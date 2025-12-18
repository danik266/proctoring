"use client";
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const MODEL_URL = "https://vladmandic.github.io/face-api/model/";

export default function ProctoringSystem({ onViolation, isActive }) {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const cocoModelRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const counters = useRef({
    noFace: 0, multiFace: 0, eyesClosed: 0, lookingDown: 0, talking: 0, loudNoise: 0,
  });

  const getEAR = (eye) => {
    const v1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const v2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const h = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (v1 + v2) / (2.0 * h);
  };

  // --- Функция скриншота ---
  const takeScreenshot = async (violationType) => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    
    const formData = new FormData();
    formData.append("screenshot", blob, `${Date.now()}_${violationType}.jpg`);

    try {
      await fetch("http://localhost:5000/upload-screenshot", {  // <-- ваш эндпоинт
        method: "POST",
        body: formData,
      });
      console.log("Скриншот отправлен:", violationType);
    } catch (e) {
      console.error("Ошибка отправки скриншота:", e);
    }
  };

  const startDetection = async () => {
    const video = videoRef.current;
    if (!video) return;

    const run = async () => {
      if (!isActive || !video || video.readyState !== 4) {
        requestAnimationFrame(run);
        return;
      }

      try {
        // --- 1. АУДИО ---
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const avgVolume = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
          if (avgVolume > 45) {
            counters.current.loudNoise++;
            if (counters.current.loudNoise > 30) {
              onViolation("Подозрительный шум/голос");
              await takeScreenshot("loudNoise");
              counters.current.loudNoise = 0;
            }
          }
        }

        // --- 2. ЛИЦА ---
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections.length === 0) {
          counters.current.noFace++;
          if (counters.current.noFace > 20) {
            onViolation("Лицо не обнаружено");
            await takeScreenshot("noFace");
            counters.current.noFace = 0;
          }
        } else if (detections.length > 1) {
          counters.current.multiFace++;
          if (counters.current.multiFace > 10) {
            onViolation("В кадре более одного человека!");
            await takeScreenshot("multiFace");
            counters.current.multiFace = 0;
          }
        } else {
          counters.current.noFace = 0;
          counters.current.multiFace = 0;
          const landmarks = detections[0].landmarks;
          const ear = (getEAR(landmarks.getLeftEye()) + getEAR(landmarks.getRightEye())) / 2;
          if (ear < 0.18) {
            counters.current.eyesClosed++;
            if (counters.current.eyesClosed > 15) {
              onViolation("Закрыты глаза");
              await takeScreenshot("eyesClosed");
              counters.current.eyesClosed = 0;
            }
          }

          const nose = landmarks.getNose();
          const nosePos = (nose[6].y - detections[0].detection.box.y) / detections[0].detection.box.height;
          if (nosePos > 0.8) {
            counters.current.lookingDown++;
            if (counters.current.lookingDown > 20) {
              onViolation("Не опускайте голову слишком низко");
              await takeScreenshot("lookingDown");
              counters.current.lookingDown = 0;
            }
          }
        }

        // --- 3. ПРЕДМЕТЫ ---
        if (cocoModelRef.current) {
          const objects = await cocoModelRef.current.detect(video);
          for (const obj of objects) {
            if (["cell phone", "laptop"].includes(obj.class) && obj.score > 0.6) {
              onViolation(`Запрещенный предмет: ${obj.class.toUpperCase()}`);
              await takeScreenshot(obj.class);
            }
          }
        }
      } catch (e) { console.error(e); }
      requestAnimationFrame(run);
    };
    run();
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        cocoSsd.load().then(m => cocoModelRef.current = m)
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsLoaded(true);
      startDetection();
    };
    init();
  }, []);

  return (
    <div style={styles.floatingBox}>
      <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
      <div style={styles.scanline} />
      {!isLoaded && <div style={styles.loading}>AI Sync...</div>}
      <div style={styles.statusDot}>LIVE</div>
    </div>
  );
}

const styles = {
  floatingBox: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "200px",
    height: "150px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    border: "2px solid rgba(59, 130, 246, 0.5)",
    zIndex: 1000,
    backgroundColor: "#000"
  },
  video: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  statusDot: {
    position: "absolute", top: "12px", left: "12px", padding: "4px 8px",
    background: "rgba(239, 68, 68, 0.8)", borderRadius: "8px", color: "#fff",
    fontSize: "10px", fontWeight: "bold", letterSpacing: "1px"
  },
  loading: { position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#666" },
  scanline: { position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "rgba(59, 130, 246, 0.3)", zIndex: 5, animation: "scan 3s linear infinite" }
};
