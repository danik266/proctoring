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

  const lastViolationTime = useRef(0);
  const lastCheckTime = useRef(0);

  // Обновляем ID при смене пропса
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // --- ЗАГРУЗКА ВИДЕО НА СЕРВЕР ---
  const saveAndUploadVideo = async (blob) => {
    if (!blob || blob.size === 0) return;

    const currentId = sessionIdRef.current;
    if (!currentId) {
      console.error("❌ Невозможно привязать видео: sessionId отсутствует.");
      return;
    }

    const formData = new FormData();
    formData.append("session_video", blob, `test_session_${currentId}.webm`);
    formData.append("sessionId", currentId);

    try {
      await fetch("http://localhost:5000/upload-video", {
        method: "POST",
        body: formData,
      });
      console.log("✅ Видео отправлено");
    } catch (e) {
      console.error("🌐 Ошибка сети при загрузке видео:", e);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = (stream) => {
    try {
      const mimeType = "video/webm; codecs=vp8";
      const options = MediaRecorder.isTypeSupported(mimeType)
        ? { mimeType }
        : { mimeType: "video/webm" };

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
        chunksRef.current = [];
        saveAndUploadVideo(blob);
        stopCamera();
      };

      recorder.start();
    } catch (e) {
      console.error("Ошибка старта записи:", e);
    }
  };

  // --- ГЛАВНАЯ ЛОГИКА ДЕТЕКЦИИ ---
  const startDetection = async () => {
    console.log("🚀 Запуск детекции...");

    const run = async () => {
      // Если компонент не активен или видео не готово — ждем
      if (
        !isActive ||
        !videoRef.current ||
        videoRef.current.paused ||
        videoRef.current.ended
      ) {
        if (isActive) requestAnimationFrame(run);
        return;
      }

      const now = Date.now();
      // Проверка каждые 200мс (5 раз в секунду) — оптимально для производительности
      if (now - lastCheckTime.current > 200) {
        lastCheckTime.current = now;

        try {
          if (
            videoRef.current.readyState === 4 &&
            videoRef.current.videoWidth > 0
          ) {
            // 1. ДЕТЕКЦИЯ ЛИЦА (SSD MobileNet - точная)
            // minConfidence: 0.4 — значит, если уверен хотя бы на 40%, считаем что лицо есть
            const faceDetection = await faceapi.detectSingleFace(
              videoRef.current,
              new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
            );

            if (!faceDetection) {
              triggerViolation("Лицо не найдено");
            }

            // 2. ДЕТЕКЦИЯ ОБЪЕКТОВ (Телефон, ноут)
            if (cocoModelRef.current) {
              const objects = await cocoModelRef.current.detect(
                videoRef.current
              );

              const forbidden = objects.find((obj) => {
                const isForbiddenItem = [
                  "cell phone",
                  "mobile phone",
                  "phone",
                  "smartphone",
                  "laptop",
                ].includes(obj.class);

                // score > 0.4 — реагируем даже если модель уверена всего на 40%
                return isForbiddenItem && obj.score > 0.4;
              });

              if (forbidden) {
                console.log(
                  `⚠️ Обнаружен запрещенный предмет: ${
                    forbidden.class
                  } (${Math.round(forbidden.score * 100)}%)`
                );
                triggerViolation(`Запрещено: ${forbidden.class}`);
              }
            }
          }
        } catch (e) {
          console.error("Ошибка в цикле детекции:", e);
        }
      }

      if (isActive) requestAnimationFrame(run);
    };

    run();
  };

  const triggerViolation = (reason) => {
    const now = Date.now();
    // Не спамить нарушениями чаще, чем раз в 2 секунды
    if (now - lastViolationTime.current < 2000) return;

    lastViolationTime.current = now;
    // console.log(`🚨 НАРУШЕНИЕ ЗАФИКСИРОВАНО: ${reason}`);
    onViolation(reason);

    // Скриншот
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((b) => {
          if (b) {
            const fd = new FormData();
            fd.append("screenshot", b, `viol_${Date.now()}.jpg`);
            fetch("http://localhost:5000/upload-screenshot", {
              method: "POST",
              body: fd,
            }).catch((e) => console.error("Ошибка отправки скрина:", e));
          }
        });
      } catch (e) {
        console.error("Ошибка создания скриншота:", e);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log("⚙️ Инициализация...");

        // 1. Принудительно включаем WebGL для ускорения
        await faceapi.tf.setBackend("webgl");
        await faceapi.tf.ready();

        // 2. Загружаем модели параллельно
        // ВАЖНО: Используем SSD MobileNet для лица (она мощнее Tiny)
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          cocoSsd.load(),
        ]).then(([_, model]) => {
          cocoModelRef.current = model;
          console.log("📦 Все модели загружены (FaceAPI + COCO)");
        });

        // 3. Запуск камеры
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: 30,
          },
          audio: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ждем события загрузки метаданных, чтобы начать детекцию
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            startRecording(stream);
            startDetection();
          };
        }
      } catch (err) {
        console.error("❌ Ошибка инициализации:", err);
      }
    };

    init();

    return () => {
      stopRecording();
    };
  }, []);

  return (
    <div style={styles.floatingBox}>
      {/* ВАЖНО: width и height установлены жестко. 
         Это помогает моделям правильно понимать координаты.
      */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="640"
        height="480"
        style={styles.video}
      />
      <div style={styles.statusDot}>REC</div>
    </div>
  );
}

const styles = {
  floatingBox: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "180px",
    height: "135px",
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 1000,
    background: "#000",
    border: "2px solid #333",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    // Если нужно зеркалить для пользователя - раскомментируй,
    // но модели все равно будут видеть оригинал.
    transform: "scaleX(-1)",
  },
  statusDot: {
    position: "absolute",
    top: "8px",
    left: "8px",
    padding: "2px 6px",
    background: "red",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    borderRadius: "4px",
  },
};
