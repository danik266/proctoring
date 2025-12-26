"use client";
import React, { useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const MODEL_URL = "https://vladmandic.github.io/face-api/model/";

export default function ProctoringSystem({ onViolation, isActive, sessionId }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]); 
  const sessionIdRef = useRef(sessionId);
  
  const cocoModelRef = useRef(null);
  const authorizedFaceRef = useRef(null); // Хранит дескриптор (слепок) лица первого пользователя

  const lastViolationTime = useRef(0);
  const lastCheckTime = useRef(0);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // --- ЗАГРУЗКА ВИДЕО (без изменений) ---
  const saveAndUploadVideo = async (blob) => {
    if (!blob || blob.size === 0) return;
    const currentId = sessionIdRef.current;
    if (!currentId) return;

    const formData = new FormData();
    formData.append("session_video", blob, `test_session_${currentId}.webm`);
    formData.append("sessionId", currentId);

    try {
        await fetch("http://localhost:5000/upload-video", {
            method: "POST",
            body: formData,
        });
    } catch (e) {
        console.error("🌐 Ошибка загрузки видео:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  const stopCamera = () => {
     if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
     }
  };

  const startRecording = (stream) => {
    try {
      const mimeType = 'video/webm; codecs=vp8'; 
      const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : { mimeType: 'video/webm' };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        chunksRef.current = [];
        saveAndUploadVideo(blob);
        stopCamera();
      };
      recorder.start(); 
    } catch (e) {
      console.error("Ошибка старта записи:", e);
    }
  };

  // --- ЛОГИКА НАРУШЕНИЙ (Скриншот) ---
  const triggerViolation = async (reason) => {
    const now = Date.now();
    // Увеличим задержку до 3 сек, чтобы не спамить при смене лица
    if (now - lastViolationTime.current < 3000) return; 
    lastViolationTime.current = now;

    let screenshotFilename = null;

    if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);
        
        await new Promise(resolve => {
            canvas.toBlob(async (blob) => {
                const fd = new FormData();
                fd.append("screenshot", blob, `viol_${Date.now()}.jpg`);
                try {
                    const res = await fetch("http://localhost:5000/upload-screenshot", { method: "POST", body: fd });
                    const data = await res.json();
                    screenshotFilename = data.filename;
                } catch(e) { console.error(e); }
                resolve();
            });
        });
    }
    onViolation(reason, screenshotFilename);
  };

  // --- ГЛАВНАЯ ЛОГИКА ДЕТЕКЦИИ ---
  const startDetection = async () => {
    const run = async () => {
      if (!isActive || !videoRef.current) return;
      const now = Date.now();
      
      // Проверяем каждые 200мс (чуть реже, т.к. вычисления тяжелее)
      if (now - lastCheckTime.current > 200) { 
          lastCheckTime.current = now;
          try {
             if (videoRef.current.readyState === 4) {
                 
                 // 1. ПОИСК ЛИЦ И ВЫЧИСЛЕНИЕ ДЕСКРИПТОРОВ
                 // Используем detectAllFaces, чтобы найти количество людей
                 const detections = await faceapi.detectAllFaces(
                     videoRef.current, 
                     new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }) 
                 )
                 .withFaceLandmarks() // Нужно для выравнивания
                 .withFaceDescriptors(); // Нужно для сравнения (Face ID)

                 // ПРОВЕРКА 1: Количество людей
                 if (detections.length === 0) {
                     triggerViolation("Лицо не найдено");
                 } else if (detections.length > 1) {
                     triggerViolation("Посторонние в кадре (более 1 чел)");
                 } else {
                     // Если лицо одно - проверяем, тот ли это человек
                     const currentDescriptor = detections[0].descriptor;

                     if (!authorizedFaceRef.current) {
                         // Если это первый успешный кадр с одним лицом - запоминаем его
                         authorizedFaceRef.current = currentDescriptor;
                         console.log("✅ Пользователь авторизован (лицо запомнено)");
                     } else {
                         // Сравниваем текущее лицо с запомненным
                         const distance = faceapi.euclideanDistance(authorizedFaceRef.current, currentDescriptor);
                         
                         // Порог 0.6 является стандартом для face-api. 
                         // > 0.6 значит лица разные.
                         if (distance > 0.6) {
                             triggerViolation("Обнаружена подмена пользователя");
                         }
                     }
                 }
                 
                 // 2. ПОИСК ОБЪЕКТОВ (CocoSSD)
                 if (cocoModelRef.current) {
                     const objects = await cocoModelRef.current.detect(videoRef.current);
                     const forbidden = objects.find(obj => 
                         ["cell phone", "mobile phone", "laptop"].includes(obj.class) && obj.score > 0.5
                     );
                     if (forbidden) triggerViolation(`Запрещено: ${forbidden.class}`);
                 }
             }
          } catch (e) { 
              console.error("Detection error:", e);
          }
      }
      if (isActive) requestAnimationFrame(run);
    };
    run();
  };
  
  useEffect(() => {
    const init = async () => {
      try {
          // Загружаем ДОПОЛНИТЕЛЬНЫЕ модели для распознавания
          await Promise.all([
             faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
             faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // Для точек лица
             faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // Для сравнения лиц
             cocoSsd.load()
          ]).then(([_, __, ___, model]) => cocoModelRef.current = model);

          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;

          startRecording(stream);
          startDetection();
      } catch (e) {
          console.error("Ошибка инициализации:", e);
      }
    };

    init();

    return () => {
        stopRecording();
    };
  }, []);

  return (
    <div style={styles.floatingBox}>
      <video ref={videoRef} autoPlay muted playsInline style={styles.video} />
      <div style={styles.statusDot}>REC</div>
    </div>
  );
}

const styles = {
  floatingBox: { position: "fixed", bottom: "24px", right: "24px", width: "180px", height: "135px", borderRadius: "12px", overflow: "hidden", zIndex: 1000, background: "#000", border: "2px solid #333" },
  video: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  statusDot: { position: "absolute", top: "8px", left: "8px", padding: "2px 6px", background: "red", color: "#fff", fontSize: "10px", fontWeight: "bold", borderRadius: "4px" }
};