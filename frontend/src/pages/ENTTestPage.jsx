import React, { useState, useEffect, useCallback, useRef } from "react";
import ProctoringSystem from "../components/ProctoringSystem";
import { QUESTIONS_MOCK } from "../data/questions";

const MAX_VIOLATIONS = 5;
const TEST_DURATION = 7200;

const ENTTestPage = () => {
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [isBlocked, setIsBlocked] = useState(false);

  const [violations, setViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);

  // Реф для предотвращения слишком частых срабатываний (раз в 2 секунды)
  const lastViolationTime = useRef(0);

  // --- 1. ПРАВИЛЬНАЯ ЛОГИКА НАРУШЕНИЙ ---
  const handleViolation = useCallback((message) => {
    const now = Date.now();
    
    // Если с момента последнего нарушения прошло меньше 2 секунд — игнорируем
    // Это защищает от ситуации, когда ИИ шлет 60 ошибок в секунду
    if (now - lastViolationTime.current < 2000) return;
    lastViolationTime.current = now;

    // 1. Увеличиваем счетчик через функциональное обновление (гарантирует точность)
    setViolationCount(prev => prev + 1);

    // 2. Добавляем визуальное уведомление
    const id = now;
    const newViolation = { id, text: message };
    
    setViolations(prev => [newViolation, ...prev].slice(0, 3));

    // Авто-удаление плашки
    setTimeout(() => {
      setViolations(curr => curr.filter(v => v.id !== id));
    }, 4000);
  }, []);

  // --- 2. ПРОВЕРКА НА БЛОКИРОВКУ ---
  useEffect(() => {
    if (violationCount >= MAX_VIOLATIONS) {
      setIsBlocked(true);
    }
  }, [violationCount]);

  // --- 3. СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    const savedAnswers = localStorage.getItem("ent_answers");
    const savedTime = localStorage.getItem("ent_timeLeft");
    const savedViolations = localStorage.getItem("ent_violationCount");

    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    if (savedTime) setTimeLeft(parseInt(savedTime));
    if (savedViolations) setViolationCount(parseInt(savedViolations));
  }, []);

  useEffect(() => {
    if (isTestStarted) {
      localStorage.setItem("ent_answers", JSON.stringify(answers));
      localStorage.setItem("ent_timeLeft", timeLeft.toString());
      localStorage.setItem("ent_violationCount", violationCount.toString());
    }
  }, [answers, timeLeft, violationCount, isTestStarted]);

  // --- 4. АНТИ-ЧИТ И ТАЙМЕР ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTestStarted && !isBlocked) {
        handleViolation("Переключение вкладки запрещено!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isTestStarted, isBlocked, handleViolation]);

  useEffect(() => {
    let timer;
    if (isTestStarted && timeLeft > 0 && !isBlocked) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isTestStarted, timeLeft, isBlocked]);

  // --- РЕНДЕР: БЛОКИРОВКА ---
  if (isBlocked) {
    return (
      <div style={uiStyles.overlay}>
        <div style={uiStyles.blockCard}>
          <h1 style={{fontSize: "80px", marginBottom: "20px"}}>🚫</h1>
          <h2 style={{color: "#ef4444", fontSize: "32px", fontWeight: "800"}}>Доступ ограничен</h2>
          <p style={{color: "#64748b", margin: "20px 0 40px", fontSize: "18px", lineHeight: "1.6"}}>
            Система прокторинга зафиксировала <b>{violationCount}</b> нарушений.<br/>
            Согласно правилам, ваше тестирование прекращено.
          </p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={uiStyles.startBtn}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={uiStyles.page}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(-50%); }
          20%, 60% { transform: translateX(-51%); }
          40%, 80% { transform: translateX(-49%); }
        }
      `}</style>

      {isTestStarted && <ProctoringSystem isActive={isTestStarted} onViolation={handleViolation} />}

      <div style={uiStyles.toastContainer}>
        {violations.map(v => (
          <div key={v.id} style={uiStyles.toast}>
            <span style={{marginRight: "10px"}}>⚠️</span> {v.text}
          </div>
        ))}
      </div>

      {!isTestStarted ? (
        <div style={uiStyles.startCard}>
          <div style={uiStyles.badge}>ENT PREP 2025</div>
          <h1 style={{fontSize: "32px", marginBottom: "12px", fontWeight: "800"}}>Национальное Тестирование</h1>
          <p style={{color: "#64748b", marginBottom: "32px"}}>Система ИИ будет следить за вашим взглядом и окружением.</p>
          <div style={uiStyles.rulesGrid}>
            <div style={uiStyles.ruleItem}>📷 Камера активна</div>
            <div style={uiStyles.ruleItem}>🤫 Тишина в комнате</div>
            <div style={uiStyles.ruleItem}>📵 Без гаджетов</div>
            <div style={uiStyles.ruleItem}>🛑 5 попыток</div>
          </div>
          <button style={uiStyles.startBtn} onClick={() => { setIsTestStarted(true); document.documentElement.requestFullscreen().catch(() => {}); }}>
            Начать тестирование
          </button>
        </div>
      ) : (
        <div style={uiStyles.testContainer}>
          <header style={uiStyles.header}>
            <div style={uiStyles.logo}>Jana ENT</div>
            <div style={uiStyles.stats}>
              <div style={{...uiStyles.statBox, borderColor: violationCount >= 4 ? "#ef4444" : "#e2e8f0", background: violationCount >= 4 ? "#fef2f2" : "#fff"}}>
                Нарушения: <span style={{color: violationCount >= 4 ? "#ef4444" : "#f59e0b"}}>{violationCount}/{MAX_VIOLATIONS}</span>
              </div>
              <div style={{...uiStyles.timerBox, color: timeLeft < 300 ? "#ef4444" : "#1e293b"}}>
                {Math.floor(timeLeft/3600)}:{String(Math.floor((timeLeft%3600)/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
              </div>
            </div>
            <button style={uiStyles.finishBtn} onClick={() => confirm("Вы уверены?")}>Завершить</button>
          </header>

          <main style={uiStyles.mainGrid}>
            <section style={uiStyles.questionCard}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "16px"}}>
                <div style={uiStyles.qMeta}>Вопрос {currentQuestion + 1} из {QUESTIONS_MOCK.length}</div>
                <button 
                  onClick={() => setBookmarked(prev => ({...prev, [currentQuestion]: !prev[currentQuestion]}))}
                  style={{background: "none", border: "none", cursor: "pointer", color: bookmarked[currentQuestion] ? "#3b82f6" : "#cbd5e1", fontWeight: "600"}}
                >
                  {bookmarked[currentQuestion] ? "🔖 Сохранено" : "📑 В закладки"}
                </button>
              </div>
              
              <h2 style={uiStyles.qText}>{QUESTIONS_MOCK[currentQuestion].text}</h2>
              
              <div style={uiStyles.optionsList}>
                {QUESTIONS_MOCK[currentQuestion].options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion]: idx })}
                    style={{
                      ...uiStyles.optionBtn,
                      background: answers[currentQuestion] === idx ? "#eff6ff" : "#fff",
                      borderColor: answers[currentQuestion] === idx ? "#3b82f6" : "#e2e8f0"
                    }}
                  >
                    <div style={{...uiStyles.optionLetter, background: answers[currentQuestion] === idx ? "#3b82f6" : "#f8fafc", color: answers[currentQuestion] === idx ? "#fff" : "#64748b"}}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>

              <div style={uiStyles.navRow}>
                <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(q => q-1)} style={uiStyles.navBtn}>← Назад</button>
                <button disabled={currentQuestion === QUESTIONS_MOCK.length-1} onClick={() => setCurrentQuestion(q => q+1)} style={uiStyles.navBtnPrimary}>Вперед →</button>
              </div>
            </section>

            <aside style={uiStyles.sidebar}>
              <div style={{fontWeight: "700", marginBottom: "16px"}}>Карта вопросов</div>
              <div style={uiStyles.palette}>
                {QUESTIONS_MOCK.map((_, i) => (
                  <div 
                    key={i} 
                    onClick={() => setCurrentQuestion(i)}
                    style={{
                      ...uiStyles.paletteItem,
                      background: currentQuestion === i ? "#3b82f6" : (answers[i] !== undefined ? "#10b981" : "#fff"),
                      color: (currentQuestion === i || answers[i] !== undefined) ? "#fff" : "#1e293b",
                      border: bookmarked[i] ? "2px solid #3b82f6" : "1px solid #e2e8f0"
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </aside>
          </main>
        </div>
      )}
    </div>
  );
};

const uiStyles = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif", color: "#1e293b" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontWeight: "900", fontSize: "24px", color: "#3b82f6", letterSpacing: "-1px" },
  stats: { display: "flex", gap: "20px", alignItems: "center" },
  statBox: { padding: "8px 20px", borderRadius: "12px", border: "1px solid", fontSize: "14px", fontWeight: "700", transition: "all 0.3s" },
  timerBox: { fontSize: "24px", fontWeight: "800", fontVariantNumeric: "tabular-nums" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", padding: "32px", maxWidth: "1400px", margin: "0 auto" },
  questionCard: { background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" },
  qMeta: { fontSize: "13px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  qText: { fontSize: "24px", fontWeight: "600", lineHeight: "1.5", marginBottom: "32px" },
  optionsList: { display: "flex", flexDirection: "column", gap: "12px" },
  optionBtn: { display: "flex", alignItems: "center", padding: "20px", borderRadius: "16px", border: "2px solid", cursor: "pointer", transition: "all 0.2s", fontSize: "16px", fontWeight: "500" },
  optionLetter: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "16px", fontWeight: "800" },
  navRow: { display: "flex", justifyContent: "space-between", marginTop: "40px" },
  navBtn: { padding: "14px 28px", borderRadius: "14px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "700" },
  navBtnPrimary: { padding: "14px 28px", borderRadius: "14px", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer", fontWeight: "700" },
  toastContainer: { position: "fixed", top: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", flexDirection: "column", gap: "12px" },
  toast: { background: "#ef4444", color: "#fff", padding: "16px 32px", borderRadius: "20px", fontWeight: "700", boxShadow: "0 20px 25px -5px rgba(239, 68, 68, 0.4)", animation: "shake 0.5s ease-in-out" },
  sidebar: { background: "#fff", padding: "24px", borderRadius: "24px", height: "fit-content", position: "sticky", top: "110px" },
  palette: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" },
  paletteItem: { height: "45px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "700", fontSize: "14px", transition: "0.2s" },
  startCard: { maxWidth: "500px", margin: "100px auto", textAlign: "center", background: "#fff", padding: "50px", borderRadius: "35px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.15)" },
  badge: { display: "inline-block", padding: "6px 16px", background: "#eff6ff", color: "#3b82f6", borderRadius: "20px", fontSize: "12px", fontWeight: "900", marginBottom: "20px" },
  rulesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "35px" },
  ruleItem: { padding: "15px", background: "#f8fafc", borderRadius: "15px", fontSize: "14px", fontWeight: "600" },
  startBtn: { width: "100%", padding: "20px", borderRadius: "20px", background: "#3b82f6", color: "#fff", border: "none", fontSize: "18px", fontWeight: "800", cursor: "pointer" },
  overlay: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff1f2" },
  blockCard: { textAlign: "center", background: "#fff", padding: "60px", borderRadius: "40px", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.2)", maxWidth: "550px" },
  finishBtn: { background: "#10b981", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer" }
};

export default ENTTestPage;