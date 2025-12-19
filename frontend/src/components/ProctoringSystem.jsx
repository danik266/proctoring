"use client";
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";


const MODEL_URL = "https://vladmandic.github.io/face-api/model/";

export default function ProctoringSystem({ onViolation, isActive, sessionId }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]); 
  const sessionIdRef = useRef(sessionId);
  const cocoModelRef = useRef(null); // Добавляем реф для модели
  
  const lastViolationTime = useRef(0);
  const lastCheckTime = useRef(0);

  // Обновляем ID при смене пропса
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

 const saveAndUploadVideo = async (blob) => {
    if (!blob || blob.size === 0) return;

    const currentId = sessionIdRef.current;
    if (!currentId) {
        console.error("❌ Невозможно привязать видео: sessionId отсутствует.");
        return;
    }

    const formData = new FormData();
    // Поле должно называться 'session_video', как в upload.single() на сервере
    formData.append("session_video", blob, `test_session_${currentId}.webm`);
    // Поле sessionId для связи в БД
    formData.append("sessionId", currentId);

    try {
        const response = await fetch("http://localhost:5000/upload-video", {
            method: "POST",
            body: formData,
            // Не используем keepalive для файлов > 64kb
        });
        
        if (response.ok) {
            const result = await response.json();
        } else {
            console.error("📦 Сервер принял файл, но возникла ошибка привязки.");
        }
    } catch (e) {
        console.error("🌐 Ошибка сети при загрузке видео:", e);
    }
  };
  // Остановка записи
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.requestData(); // Сохраняем последние кадры
      mediaRecorderRef.current.stop(); // Это вызовет onstop
    }
  };

  // Остановка камеры
  const stopCamera = () => {
     if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
     }
  };

  const startRecording = (stream) => {
    try {
      // Используем VP8 - он лучше открывается в обычных плеерах
      const mimeType = 'video/webm; codecs=vp8'; 
      
      const options = MediaRecorder.isTypeSupported(mimeType) 
        ? { mimeType } 
        : { mimeType: 'video/webm' };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        chunksRef.current = []; // Чистим память
        saveAndUploadVideo(blob);
        stopCamera(); // Выключаем камеру ТОЛЬКО после сборки видео
      };

      // ВАЖНО: Убрали аргумент (1000). Пишем одним куском в память.
      // Это предотвращает "битые" заголовки при разрыве.
      recorder.start(); 
    } catch (e) {
      console.error("Ошибка старта записи:", e);
    }
  };

  // --- ЛОГИКА ДЕТЕКЦИИ (сокращенно, чтобы не занимать место) ---
  const startDetection = async () => {
    const run = async () => {
      if (!isActive || !videoRef.current) return;
      const now = Date.now();
      if (now - lastCheckTime.current > 100) {
          lastCheckTime.current = now;
          try {
             if (videoRef.current.readyState === 4) {
                 // Твой код FaceAPI...
                 const detection = await faceapi.detectSingleFace(
                     videoRef.current, 
                     new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }) 
                 );
                 if (!detection) triggerViolation("Лицо не найдено");
                 
                 // Твой код CocoSSD...
                 if (cocoModelRef.current) {
                     const objects = await cocoModelRef.current.detect(videoRef.current);
                     const forbidden = objects.find(obj => 
                         ["cell phone", "mobile phone", "laptop"].includes(obj.class) && obj.score > 0.5
                     );
                     if (forbidden) triggerViolation(`Запрещено: ${forbidden.class}`);
                 }
             }
          } catch (e) { }
      }
      if (isActive) requestAnimationFrame(run);
    };
    run();
  };
  
  const triggerViolation = (reason) => {
      // Твой код скрина...
      const now = Date.now();
      if (now - lastViolationTime.current < 2000) return;
      lastViolationTime.current = now;
      onViolation(reason);
      
      // Скриншоты тоже отправляем
      if (videoRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0);
          canvas.toBlob(b => {
             const fd = new FormData();
             fd.append("screenshot", b, `viol_${Date.now()}.jpg`);
             fetch("http://localhost:5000/upload-screenshot", { method: "POST", body: fd });
          });
      }
  };

  useEffect(() => {
    const init = async () => {
      // Загрузка моделей
      await Promise.all([
         faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
         cocoSsd.load()
      ]).then(([_, model]) => cocoModelRef.current = model);

      // Запуск камеры
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      startRecording(stream);
      startDetection();
    };

    init();

    // ПРИ ВЫХОДЕ
    return () => {
        // Мы вызываем ТОЛЬКО остановку записи.
        // Камера сама выключится внутри recorder.onstop
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