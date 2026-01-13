import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { CheckCircle, Clock, ShieldCheck, X as XIcon } from "lucide-react";

// === КОНСТАНТЫ ===
const API_BASE = "http://localhost:5000/api";
const UPLOADS_URL = "http://localhost:5000/uploads";

// === КОМПОНЕНТ ОТОБРАЖЕНИЯ ===
const RichDisplay = ({ text, image, isOption = false }) => {
  const safeText = text !== null && text !== undefined ? String(text) : "";
  const hasMath =
    safeText &&
    (safeText.includes("\\") ||
      safeText.includes("_") ||
      safeText.includes("^"));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
      }}
    >
      {/* Текст */}
      {safeText && (
        <div
          style={{ fontSize: isOption ? "16px" : "20px", lineHeight: "1.5" }}
        >
          <span style={{ marginRight: 8 }}>{safeText}</span>
          {hasMath && (
            <span style={{ color: "#4f46e5", fontWeight: 600 }}>
              <InlineMath math={safeText} />
            </span>
          )}
        </div>
      )}
      {/* Картинка */}
      {image && (
        <div style={{ marginTop: 5 }}>
          <img
            src={`${UPLOADS_URL}/${image}`}
            alt="Content"
            style={{
              maxWidth: "100%",
              maxHeight: isOption ? "180px" : "400px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              objectFit: "contain",
              display: "block",
            }}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}
    </div>
  );
};

const TestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- ДАННЫЕ ---
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  // --- UI ---
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200);
  const [showModal, setShowModal] = useState(false);

  const isFinishedRef = useRef(false);

  useEffect(() => {
    isFinishedRef.current = isFinished;
  }, [isFinished]);

  // 1. СТАРТ ТЕСТА
  const handleStartTest = async () => {
    try {
      const rawUserId = localStorage.getItem("user_id");
      if (!rawUserId) return alert("Ошибка: нет user_id");

      const response = await fetch(`${API_BASE}/tests/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(rawUserId),
          test_id: parseInt(id),
        }),
      });

      if (!response.ok) throw new Error("Ошибка старта");
      const data = await response.json();
      if (data.sessionId) setSessionId(data.sessionId);

      setIsTestStarted(true);
      document.documentElement.requestFullscreen().catch(() => {});
    } catch (error) {
      console.error(error);
      alert("Не удалось начать тест");
    }
  };

  // 2. ЗАГРУЗКА ВОПРОСОВ
  useEffect(() => {
    fetch(`${API_BASE}/tests/${id}/questions`)
      .then((r) => r.json())
      .then((d) => {
        const formatted = d.map((q) => ({
          ...q,
          type: q.type || "multiple_choice",
          image: q.image || null,
          options:
            typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(formatted);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
  }, [id]);

  // 3. ТАЙМЕР
  useEffect(() => {
    let timer;
    if (isTestStarted && !isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTestStarted, isFinished]);

  // 4. ЗАВЕРШЕНИЕ
  const finishTest = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem("user_id");
    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      answer_text: answers[q.id] !== undefined ? String(answers[q.id]) : null,
    }));

    try {
      const res = await fetch(`${API_BASE}/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          test_id: id,
          answers: formattedAnswers,
        }),
      });
      const data = await res.json();
      setTestResults(data);
      setIsFinished(true);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {
      alert("Ошибка отправки");
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  };

  if (isLoading)
    return (
      <div style={s.loader}>
        <div className="spinner" />
        Загрузка...
      </div>
    );

  if (isTestStarted && (!questions || questions.length === 0)) {
    return <div style={s.loader}>Ошибка: Вопросы не найдены.</div>;
  }

  // === ЭКРАН РЕЗУЛЬТАТОВ (ОБЗОР) ===
  if (isFinished) {
    if (isReviewMode) {
      const qReview = questions[currentQuestion];
      const optsReview = qReview?.options || [];
      const correctAnsStr = String(
        testResults?.details?.[qReview.id]?.correct_answer || ""
      );
      const userAnsStr = String(answers[qReview.id] || "");

      // Определение типа вопроса для обзора
      const isInputType =
        qReview.type === "open_ended" || !optsReview || optsReview.length === 0;

      // Если это просто текст, не показываем ничего
      const isTextOnly = qReview.type === "text_only";

      let isTextCorrect = false;
      if (isInputType && !isTextOnly) {
        const variants = correctAnsStr
          .split(";")
          .map((v) => v.trim().toLowerCase());
        isTextCorrect = variants.includes(userAnsStr.trim().toLowerCase());
      }

      return (
        <div style={s.page}>
          <header style={s.header}>
            <div style={s.logo}>ОБЗОР</div>
            <button style={s.btnSec} onClick={() => setIsReviewMode(false)}>
              Закрыть
            </button>
          </header>
          <main style={s.main}>
            <div style={s.qBox}>
              <div style={s.qHeader}>
                <span style={s.qBadge}>Вопрос {currentQuestion + 1}</span>
              </div>
              <RichDisplay text={qReview.text} image={qReview.image} />

              <div style={{ marginTop: 20 }}>
                {isTextOnly ? null : isInputType ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 15,
                    }}
                  >
                    <div
                      style={{
                        padding: 15,
                        borderRadius: 12,
                        border: `2px solid ${
                          isTextCorrect ? "#22c55e" : "#ef4444"
                        }`,
                        background: isTextCorrect ? "#f0fdf4" : "#fef2f2",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: "bold",
                          color: "#64748b",
                          marginBottom: 5,
                        }}
                      >
                        ВАШ ОТВЕТ:
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>
                        {userAnsStr || "(нет ответа)"}
                      </div>
                    </div>
                    {!isTextCorrect && (
                      <div
                        style={{
                          padding: 15,
                          borderRadius: 12,
                          border: "1px dashed #cbd5e1",
                          background: "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: "bold",
                            color: "#64748b",
                            marginBottom: 5,
                          }}
                        >
                          ПРАВИЛЬНЫЙ ОТВЕТ:
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 500,
                            color: "#0f172a",
                          }}
                        >
                          {correctAnsStr.split(";")[0]}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={s.ansGrid}>
                    {optsReview.map((opt, idx) => {
                      const hasText =
                        opt.text && String(opt.text).trim().length > 0;
                      const hasImage = !!opt.image;
                      if (!hasText && !hasImage) return null;
                      const oId = opt.id || idx;
                      const isCorrect = String(oId) === correctAnsStr;
                      const isWrong = String(oId) === userAnsStr && !isCorrect;
                      let bg = isCorrect
                        ? "#dcfce7"
                        : isWrong
                        ? "#fee2e2"
                        : "#fff";
                      let border = isCorrect
                        ? "#22c55e"
                        : isWrong
                        ? "#ef4444"
                        : "#e2e8f0";
                      return (
                        <div
                          key={idx}
                          style={{
                            ...s.card,
                            background: bg,
                            border: `1px solid ${border}`,
                            cursor: "default",
                          }}
                        >
                          <div style={s.letter}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <RichDisplay
                              text={opt.text}
                              image={opt.image}
                              isOption={true}
                            />
                          </div>
                          {isCorrect && <CheckCircle color="#15803d" />}
                          {isWrong && <XIcon color="#b91c1c" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={s.nav}>
                <button
                  disabled={currentQuestion === 0}
                  style={s.btnSec}
                  onClick={() => setCurrentQuestion((p) => p - 1)}
                >
                  Назад
                </button>
                <button
                  disabled={currentQuestion === questions.length - 1}
                  style={s.btnPrimary}
                  onClick={() => setCurrentQuestion((p) => p + 1)}
                >
                  Вперед
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div style={s.statusPage}>
        <div style={s.statusCard}>
          <div style={{ fontSize: 80 }}>🏆</div>
          <h1 style={s.statusTitle}>Тест завершен</h1>
          {testResults && (
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "#4f46e5",
                margin: "20px 0",
              }}
            >
              {testResults.score}{" "}
              <span style={{ fontSize: 24, color: "#94a3b8" }}>
                / {testResults.total_points}
              </span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              style={s.btnPrimary}
              onClick={() => {
                setCurrentQuestion(0);
                setIsReviewMode(true);
              }}
            >
              Посмотреть ошибки
            </button>
            <button style={s.btnSec} onClick={() => navigate("/dashboard")}>
              В меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ТЕСТА (СТАРТ) ---
  if (!isTestStarted) {
    return (
      <div style={s.startCenter}>
        <div style={s.startCard}>
          <ShieldCheck size={48} color="#4f46e5" style={{ margin: "0 auto" }} />
          <h1 style={s.mainTitle}>Начать тест</h1>
          <button style={s.btnStart} onClick={handleStartTest}>
            🚀 Начать
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  if (!currentQ) return <div style={s.loader}>Ошибка данных вопроса</div>;

  const options = currentQ.options || [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // 🔥 ОПРЕДЕЛЯЕМ: Показывать поле ввода или варианты?
  // 1. Это НЕ должен быть тип 'text_only'
  // 2. ИЛИ тип open_ended, ИЛИ нет вариантов (защита)
  const isTextOnly = currentQ.type === "text_only";
  const showInput =
    !isTextOnly &&
    (currentQ.type === "open_ended" || !options || options.length === 0);

  return (
    <div style={s.page}>
      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <h2>Завершить тест?</h2>
            <div style={s.modalActions}>
              <button style={s.btnSec} onClick={() => setShowModal(false)}>
                Нет
              </button>
              <button style={s.btnPrimary} onClick={finishTest}>
                Да
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.layout}>
        <div style={{ ...s.progressBar, width: `${progress}%` }} />
        <header style={s.header}>
          <div style={s.logo}>JANA TEST</div>
          <div style={s.timerBox}>
            <Clock size={16} />{" "}
            {new Date(timeLeft * 1000).toISOString().substr(11, 8)}
          </div>
          <button style={s.btnFinish} onClick={() => setShowModal(true)}>
            Завершить
          </button>
        </header>

        <main style={s.main}>
          <div style={s.qBox}>
            <div style={s.qHeader}>
              <span style={s.qBadge}>
                Вопрос {currentQuestion + 1}/{questions.length}
              </span>
            </div>

            {/* ТЕКСТ ВОПРОСА */}
            <div style={s.qText}>
              <RichDisplay text={currentQ.text} image={currentQ.image} />
            </div>

            {/* 🔥 ПОЛЕ ВВОДА (Сразу под вопросом) */}
            {showInput ? (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Ваш ответ:
                </div>
                <textarea
                  style={s.textArea}
                  placeholder="Введите текст ответа здесь..."
                  value={answers[currentQ.id] || ""}
                  onChange={(e) =>
                    setAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))
                  }
                />
              </div>
            ) : isTextOnly ? (
              // 🔥 ЕСЛИ ЭТО ПРОСТО ТЕКСТ - НИЧЕГО НЕ РИСУЕМ СНИЗУ 🔥
              <div style={{ marginTop: 20, color: "#94a3b8", fontSize: 14 }}>
                (Информационный текст, переходите к следующему вопросу)
              </div>
            ) : (
              /* ВАРИАНТЫ ОТВЕТОВ */
              <div style={s.ansGrid}>
                {options.map((opt, idx) => {
                  const hasText =
                    opt.text && String(opt.text).trim().length > 0;
                  const hasImage = !!opt.image;
                  if (!hasText && !hasImage) return null;
                  const oId = opt.id || idx;
                  const isSelected =
                    String(answers[currentQ.id]) === String(oId);
                  return (
                    <div
                      key={idx}
                      style={isSelected ? s.cardActive : s.card}
                      onClick={() =>
                        setAnswers((p) => ({
                          ...p,
                          [currentQ.id]: String(oId),
                        }))
                      }
                    >
                      <div style={isSelected ? s.letterActive : s.letter}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <RichDisplay
                          text={opt.text}
                          image={opt.image}
                          isOption={true}
                        />
                      </div>
                      {isSelected && <CheckCircle color="#6366f1" />}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={s.nav}>
              <button
                disabled={currentQuestion === 0}
                style={currentQuestion === 0 ? s.btnOff : s.btnSec}
                onClick={() => setCurrentQuestion((p) => p - 1)}
              >
                Назад
              </button>
              <button
                style={s.btnPrimary}
                onClick={() => {
                  if (currentQuestion < questions.length - 1)
                    setCurrentQuestion((p) => p + 1);
                  else setShowModal(true);
                }}
              >
                {currentQuestion === questions.length - 1
                  ? "Завершить"
                  : "Далее"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// === STYLES ===
const s = {
  page: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "#f8fafc",
    zIndex: 9999,
    overflow: "hidden",
    fontFamily: "sans-serif",
    color: "#0f172a",
  },
  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
  },
  startCenter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f1f5f9",
  },
  startCard: {
    background: "white",
    padding: 40,
    borderRadius: 24,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    width: "100%",
  },
  mainTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "24px 0",
  },
  btnStart: {
    marginTop: 10,
    width: "100%",
    padding: "16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: 16,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.1s",
  },
  layout: { display: "flex", flexDirection: "column", height: "100%" },
  progressBar: { height: 4, background: "#4f46e5", transition: "width 0.3s" },
  header: {
    height: 60,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    borderBottom: "1px solid #e2e8f0",
  },
  logo: { fontWeight: "bold", fontSize: 20 },
  timerBox: {
    background: "#f1f5f9",
    padding: "8px 16px",
    borderRadius: 20,
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontWeight: "bold",
  },
  btnFinish: {
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },
  main: { flex: 1, display: "flex", overflow: "hidden" },
  qBox: { flex: 1, padding: "40px", overflowY: "auto", maxWidth: "100%" },
  qHeader: { marginBottom: 20 },
  qBadge: {
    background: "#e0e7ff",
    color: "#4f46e5",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },
  qText: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  ansGrid: { display: "grid", gap: 15 },
  // 🔽 СТИЛЬ ПОЛЯ ВВОДА 🔽
  textArea: {
    width: "100%",
    minHeight: "150px",
    padding: "20px",
    fontSize: "18px",
    borderRadius: "16px",
    border: "2px solid #e2e8f0",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    backgroundColor: "#fff",
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    padding: 20,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 15,
    cursor: "pointer",
  },
  cardActive: {
    background: "#eef2ff",
    border: "2px solid #4f46e5",
    padding: 20,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 15,
    cursor: "pointer",
  },
  letter: {
    width: 32,
    height: 32,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontWeight: "bold",
    color: "#64748b",
  },
  letterActive: {
    width: 32,
    height: 32,
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    fontWeight: "bold",
  },
  nav: { marginTop: 40, display: "flex", gap: 20 },
  btnPrimary: {
    flex: 1,
    padding: "14px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnSec: {
    flex: 1,
    padding: "14px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },
  btnOff: {
    flex: 1,
    padding: "14px",
    background: "#f1f5f9",
    color: "#cbd5e1",
    border: "none",
    borderRadius: 12,
    cursor: "not-allowed",
  },
  statusPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
  },
  statusCard: {
    background: "white",
    padding: 50,
    borderRadius: 30,
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  },
  statusTitle: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20000,
  },
  modalCard: {
    background: "white",
    padding: 30,
    borderRadius: 20,
    width: 300,
    textAlign: "center",
  },
  modalActions: { display: "flex", gap: 10, marginTop: 20 },
};

export default TestPage;
