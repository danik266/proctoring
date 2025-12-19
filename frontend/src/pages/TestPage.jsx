import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProctoringSystem from "../components/ProctoringSystem"; 
import { CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Clock, ShieldCheck, AlertTriangle, X as XIcon } from "lucide-react";

const MAX_VIOLATIONS = 5;

const TestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- ОСНОВНЫЕ ДАННЫЕ ---
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  
  // --- РЕЗУЛЬТАТЫ ---
  const [testResults, setTestResults] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  // --- СОСТОЯНИЯ UI ---
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200); 
  const [showModal, setShowModal] = useState(false);

  // --- БЕЗОПАСНОСТЬ ---
  const [violationCount, setViolationCount] = useState(0);
  const [violationLog, setViolationLog] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // --- REFS ---
  const isFinishedRef = useRef(false);
  const isCooldownRef = useRef(false);
  const isBlockedRef = useRef(false);
  const currentQuestionRef = useRef(currentQuestion);
  const questionsRef = useRef(questions);
  const userIdRef = useRef(localStorage.getItem("user_id"));

  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);
  useEffect(() => { isBlockedRef.current = isBlocked; }, [isBlocked]);

  // ==========================================
  // 1. ЛОГИКА СТАРТА
  // ==========================================
  const handleStartTest = async () => {
    try {
      const rawUserId = localStorage.getItem("user_id");
      if (!rawUserId) { alert("Ошибка: Нет user_id"); return; }

      const response = await fetch('http://localhost:5000/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(rawUserId, 10), test_id: parseInt(id, 10) })
      });

      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      const data = await response.json();
      
      if (data.sessionId || data.session_id) {
         setSessionId(data.sessionId || data.session_id);
      }

      setIsTestStarted(true);
      document.documentElement.requestFullscreen().catch(() => {});

    } catch (error) {
      console.error("Start error:", error);
      alert("Ошибка старта: " + error.message);
    }
  };

  // ==========================================
  // 2. БЕЗОПАСНОСТЬ (ОПТИМИЗИРОВАНО)
  // ==========================================
  
  // Функция отправки вынесена отдельно, чтобы не пересоздавать её
  const sendLogToServer = async (violationData) => {
      try {
        await fetch('http://localhost:5000/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(violationData)
        });
      } catch (e) { console.error("Log upload error:", e); }
  };

  const addViolation = useCallback((reason, imageSrc = null) => {
    // Проверки (остаются быстрыми)
    if (isFinishedRef.current || isCooldownRef.current || isBlockedRef.current) return;

    // 1. МГНОВЕННАЯ БЛОКИРОВКА ПОВТОРОВ (Cooldown)
    isCooldownRef.current = true;

    // 2. МГНОВЕННОЕ ОБНОВЛЕНИЕ UI (Приоритет №1)
    setShowFlash(true);
    
    // Формируем время сразу
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Обновляем логи и счетчик синхронно
    setViolationLog(prev => [{ time, msg: reason, id: Date.now() }, ...prev]);
    setViolationCount(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_VIOLATIONS) setIsBlocked(true);
      return newCount;
    });

    // 3. ОТЛОЖЕННАЯ ОТПРАВКА НА СЕРВЕР (Приоритет №2)
    // Мы используем setTimeout(..., 0), чтобы выкинуть тяжелую обработку JSON и сети
    // в конец очереди событий (Event Loop). Это позволяет React отрисовать UI ДО начала отправки.
    setTimeout(() => {
        const violationData = {
          event: "TEST_VIOLATION",
          user_id: userIdRef.current ? parseInt(userIdRef.current) : null,
          data: {
                reason,
                test_id: id,
                snapshot: imageSrc // Теперь здесь будет имя файла, а не null
             }
        };
        sendLogToServer(violationData);
    }, 0);

    // 4. Сброс эффектов (сделал быстрее: 300мс вместо 500мс для ощущения скорости)
    setTimeout(() => setShowFlash(false), 300);
    setTimeout(() => { isCooldownRef.current = false; }, 200); 
  }, [id]);

  const triggerFatalBlock = useCallback((reason) => {
    if (isFinishedRef.current || isBlockedRef.current) return;
    
    setIsBlocked(true);
    
    // Тоже отправляем асинхронно
    setTimeout(() => {
        sendLogToServer({
            event: "TEST_VIOLATION",
            user_id: userIdRef.current ? parseInt(userIdRef.current) : null,
            data: { reason: `КРИТИЧЕСКОЕ: ${reason}`, test_id: id, snapshot: null }
        });
    }, 0);

    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [id]);
  
  useEffect(() => {
    if (!isTestStarted || isFinished || isBlocked) return;

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !isFinishedRef.current && !isBlockedRef.current) {
         triggerFatalBlock("Выход из полноэкранного режима");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault(); triggerFatalBlock("Попытка открытия консоли (F12)");
      }
      if ((e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
        e.preventDefault(); triggerFatalBlock("Инструменты разработчика");
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isTestStarted, isFinished, isBlocked, triggerFatalBlock]);

  // ==========================================
  // 3. ТАЙМЕР И ЗАГРУЗКА
  // ==========================================
  useEffect(() => {
    let timer;
    if (isTestStarted && !isFinished && !isBlocked) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { finishTest(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTestStarted, isFinished, isBlocked]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/tests/${id}/questions`)
      .then(r => r.json())
      .then(d => { setQuestions(d); setIsLoading(false); })
      .catch((e) => { console.error(e); setIsLoading(false); });
  }, [id]);

  useEffect(() => {
    const handleAnswerKey = (e) => {
      if (!isTestStarted || isFinished || isBlocked || showModal) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        const q = questions[currentQuestion];
        const opts = q?.options || q?.choices || [];
        if (opts[num - 1]) handleSelectAnswer(q.id, opts[num - 1].id || num - 1);
      }
    };
    window.addEventListener("keydown", handleAnswerKey);
    return () => window.removeEventListener("keydown", handleAnswerKey);
  }, [isTestStarted, currentQuestion, questions, showModal, isFinished, isBlocked]);

  // ==========================================
  // 4. ЛОГИКА ТЕСТА
  // ==========================================
  const handleSelectAnswer = (qId, optId) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(prev => prev + 1);
    else setShowModal(true);
  };

  const finishTest = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem("user_id");

    const formattedAnswers = questions.map(q => ({
      question_id: q.id,
      answer_text: answers[q.id] !== undefined ? String(answers[q.id]) : null
    }));

    try {
      const response = await fetch('http://localhost:5000/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          test_id: id,
          answers: formattedAnswers
        })
      });

      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      const resultData = await response.json();
      setTestResults(resultData);

    } catch (error) {
      console.error("Submit error:", error);
      alert(`Ошибка отправки: ${error.message}`);
      setIsLoading(false);
      return; 
    }

    setIsLoading(false);
    setShowModal(false);
    isFinishedRef.current = true;
    setIsFinished(true);
    setIsTestStarted(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const getReviewStyles = (qId, optionId) => {
    if (!testResults || !testResults.details) return {};
    const userChoiceStr = String(answers[qId]);
    const correctChoiceStr = String(testResults.details[qId]?.correct_answer);
    const currentOptionStr = String(optionId);

    if (currentOptionStr === correctChoiceStr) {
      return { background: '#dcfce7', border: '2px solid #22c55e', color: '#14532d' };
    }
    if (currentOptionStr === userChoiceStr && userChoiceStr !== correctChoiceStr) {
      return { background: '#fee2e2', border: '2px solid #ef4444', color: '#7f1d1d' };
    }
    return { background: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.5 };
  };

  // ==========================================
  // 5. РЕНДЕР
  // ==========================================
  if (isLoading) return <div style={s.loader}><div className="spinner" />Загрузка...</div>;

  if (isFinished || isBlocked) {
    if (isReviewMode && !isBlocked) {
      const qReview = questions[currentQuestion];
      const optsReview = qReview?.options || qReview?.choices || [];
      return (
        <div style={s.page}>
          <header style={s.header}>
            <div style={s.logo}>ОБЗОР ОШИБОК</div>
            <button style={s.btnSec} onClick={() => setIsReviewMode(false)}>Закрыть</button>
          </header>
          <main style={s.main}>
            <div style={s.qBox}>
               <div style={s.qHeader}>
                  <span style={s.qBadge}>Вопрос {currentQuestion + 1} из {questions.length}</span>
               </div>
               <h2 style={s.qText}>{qReview.text}</h2>
               <div style={s.ansGrid}>
                 {optsReview.map((opt, idx) => {
                   const oId = opt.id !== undefined ? opt.id : idx;
                   const style = getReviewStyles(qReview.id, oId);
                   const isCorrect = String(oId) === String(testResults?.details?.[qReview.id]?.correct_answer);
                   const isUserWrong = String(oId) === String(answers[qReview.id]) && !isCorrect;
                   return (
                     <div key={idx} style={{...s.card, ...style, cursor: 'default'}}>
                       <div style={s.letter}>{String.fromCharCode(65 + idx)}</div>
                       <div style={{ flex: 1 }}>{opt.text || opt.answer}</div>
                       {isCorrect && <CheckCircle color="#15803d" />}
                       {isUserWrong && <XIcon color="#b91c1c" />}
                     </div>
                   );
                 })}
               </div>
               <div style={s.nav}>
                 <button disabled={currentQuestion === 0} style={currentQuestion === 0 ? s.btnOff : s.btnSec} onClick={() => setCurrentQuestion(p => p - 1)}>Назад</button>
                 <button disabled={currentQuestion === questions.length - 1} style={currentQuestion === questions.length - 1 ? s.btnOff : s.btnPrimary} onClick={() => setCurrentQuestion(p => p + 1)}>Вперед</button>
               </div>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div style={s.statusPage}>
        <div style={s.statusCard}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>{isBlocked ? "🔐" : "🏆"}</div>
          <h1 style={s.statusTitle}>{isBlocked ? "Доступ закрыт" : "Тест завершен"}</h1>
          {!isBlocked && testResults && (
            <div style={{background: '#f8fafc', padding: '24px', borderRadius: '20px', margin: '24px 0'}}>
              <div style={{fontSize: '14px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>Результат</div>
              <div style={{fontSize: '56px', fontWeight: 900, color: '#4f46e5', lineHeight: 1}}>
                {testResults.score} <span style={{fontSize: '24px', color: '#94a3b8', fontWeight: 600}}>/ {testResults.total_points}</span>
              </div>
            </div>
          )}
          <p style={s.statusText}>{isBlocked ? "Критические нарушения." : "Ответы проверены."}</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {!isBlocked && <button style={s.btnPrimary} onClick={() => { setCurrentQuestion(0); setIsReviewMode(true); }}>Просмотреть ошибки</button>}
            <button style={s.btnSec} onClick={() => navigate("/dashboard")}>Вернуться в кабинет</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const options = currentQ?.options || currentQ?.choices || [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const unAnsweredCount = questions.length - answeredCount;

  return (
    <div style={s.page}>
      {/* Ускоренная анимация вспышки */}
      {showFlash && <div style={s.flash} />}

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <div style={s.modalIcon}>{unAnsweredCount > 0 ? <AlertTriangle size={32} color="#f59e0b" /> : <CheckCircle size={32} color="#10b981" />}</div>
            <h2 style={s.modalTitle}>{unAnsweredCount > 0 ? "Пропущены вопросы" : "Завершить?"}</h2>
            <div style={s.modalActions}>
              <button style={s.btnSec} onClick={() => setShowModal(false)}>Назад</button>
              <button style={{...s.btnPrimary, background: unAnsweredCount > 0 ? '#ef4444' : '#6366f1'}} onClick={finishTest}>Завершить</button>
            </div>
          </div>
        </div>
      )}

      {!isTestStarted ? (
        <div style={s.startCenter}>
          <div style={s.startCard}>
            <div style={s.badge}><ShieldCheck size={14} /> SECURE EXAM</div>
            <h1 style={s.mainTitle}>Вступительное тестирование</h1>
            <div style={s.rulesList}>
               <div style={s.ruleItem}>• Не выходите из полноэкранного режима</div>
               <div style={s.ruleItem}>• Не переключайте вкладки</div>
            </div>
            <button style={s.btnStart} onClick={handleStartTest}>Начать</button>
          </div>
        </div>
      ) : (
        <div style={s.layout}>
          <div style={{...s.progressBar, width: `${progress}%`}} />
          <header style={s.header}>
            <div style={s.logo}>QADAM <span style={{ color: '#94a3b8', fontWeight: 400 }}>PRO</span></div>
            <div style={s.timerBox}>
              <Clock size={18} color="#94a3b8" />
              <span style={s.timerText}>{new Date(timeLeft * 1000).toISOString().substr(11, 8)}</span>
            </div>
            <button style={s.btnFinish} onClick={() => setShowModal(true)}>Завершить</button>
          </header>

          <main style={s.main}>
            <div style={s.qBox}>
              <div style={s.qHeader}><span style={s.qBadge}>Вопрос {currentQuestion + 1} / {questions.length}</span></div>
              <h2 style={s.qText}>{currentQ?.text || "Загрузка..."}</h2>
              <div style={s.ansGrid}>
                {options.map((opt, idx) => {
                  const optionId = opt.id !== undefined ? opt.id : idx;
                  const isSelected = answers[currentQ.id] === optionId;
                  return (
                    <div key={optionId} style={isSelected ? s.cardActive : s.card} onClick={() => handleSelectAnswer(currentQ.id, optionId)}>
                      <div style={isSelected ? s.letterActive : s.letter}>{String.fromCharCode(65 + idx)}</div>
                      <div style={{ fontSize: '17px', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{opt.text || opt.answer || opt.option_text || opt}</div>
                      {isSelected && <CheckCircle size={24} color="#6366f1" />}
                    </div>
                  );
                })}
              </div>
              <div style={s.nav}>
                <button disabled={currentQuestion === 0} style={currentQuestion === 0 ? s.btnOff : s.btnSec} onClick={() => setCurrentQuestion(p => p - 1)}><ChevronLeft size={20} /> Назад</button>
                <button style={s.btnPrimary} onClick={handleNext}>{currentQuestion === questions.length - 1 ? "Завершить" : "Следующий"} <ChevronRight size={20} /></button>
              </div>
            </div>

            <aside style={s.side}>
              <div style={s.sidebarCamWrapper}>
                 <ProctoringSystem isActive={true} onViolation={addViolation} sessionId={sessionId} />
              </div>
              <div style={s.violBlock}>
                <div style={s.violCount}>{violationCount} / {MAX_VIOLATIONS}</div>
                <div style={s.violLabel}>НАРУШЕНИЙ</div>
                {violationCount >= 3 && <div style={s.violWarning}>Риск блокировки!</div>}
              </div>
              <div style={s.logs}>
                <div style={s.logTitle}>ИСТОРИЯ</div>
                {violationLog.length === 0 ? (
                  <div style={s.emptyLogs}>Чисто.</div>
                ) : (
                  violationLog.map(l => (
                    <div key={l.id} style={s.logItem}>
                      <AlertCircle size={14} color="#ef4444" style={{marginTop: '2px', flexShrink: 0}} />
                      <div><b style={{ color: '#ef4444' }}>{l.time}</b> {l.msg}</div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </main>
        </div>
      )}
    </div>
  );
};

const s = {
  page: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', overflow: 'hidden', color: '#0f172a' },
  // Ускорил анимацию flash-in (было 0.5s -> теперь в CSS лучше поставить 0.2s, но здесь имитируем)
  flash: { position: 'fixed', inset: 0, zIndex: 10001, pointerEvents: 'none', border: '10px solid #ef4444', boxShadow: 'inset 0 0 150px rgba(239, 68, 68, 0.5)', animation: 'flash-in 0.3s ease-out' }, 
  loader: { height: '100vh', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', background: '#fff', color: '#6366f1', fontSize: '18px', fontWeight: 600 },
  startCenter: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'radial-gradient(circle at top left, #f1f5f9, #e2e8f0)' },
  startCard: { background: 'white', padding: '56px', borderRadius: '40px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', maxWidth: '500px', border: '1px solid #f1f5f9' },
  mainTitle: { fontSize: '36px', fontWeight: 800, letterSpacing: '-0.02em', margin: '24px 0', color: '#1e293b' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: '#eef2ff', color: '#4f46e5', borderRadius: '100px', fontSize: '12px', fontWeight: 700 },
  rulesList: { textAlign: 'left', background: '#f8fafc', padding: '24px', borderRadius: '20px', marginBottom: '40px', color: '#64748b', fontSize: '15px' },
  ruleItem: { marginBottom: '8px' },
  layout: { height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' },
  progressBar: { position: 'absolute', top: 0, left: 0, height: '4px', background: '#6366f1', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 100 },
  header: { height: '80px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px' },
  logo: { fontWeight: 900, fontSize: '22px', color: '#6366f1' },
  timerBox: { display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 24px', borderRadius: '16px', border: '1px solid #f1f5f9' },
  timerText: { fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#1e293b' },
  main: { flex: 1, display: 'flex', overflow: 'hidden' },
  qBox: { flex: 1, padding: '60px 100px', overflowY: 'auto' },
  qBadge: { background: '#f1f5f9', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#64748b' },
  qText: { fontSize: '32px', fontWeight: 700, margin: '32px 0 48px', lineHeight: 1.25, color: '#0f172a' },
  ansGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxWidth: '800px' },
  card: { padding: '24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' },
  cardActive: { padding: '24px', background: '#f5f7ff', border: '2px solid #6366f1', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.15)' },
  letter: { width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: '#94a3b8' },
  letterActive: { width: '40px', height: '40px', background: '#6366f1', color: 'white', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700 },
  nav: { marginTop: '64px', display: 'flex', gap: '20px' },
  side: { width: '360px', borderLeft: '1px solid #f1f5f9', background: 'white', padding: '24px', display: 'flex', flexDirection: 'column' },
  violBlock: { background: '#fff1f2', padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px', border: '1px solid #ffe4e6' },
  violCount: { fontSize: '32px', fontWeight: 900, color: '#e11d48' },
  violLabel: { fontSize: '10px', fontWeight: 800, color: '#fb7185', marginTop: '4px', letterSpacing: '0.05em' },
  violWarning: { marginTop: '8px', color: '#e11d48', fontSize: '12px', fontWeight: 600 },
  logs: { flex: 1, overflowY: 'auto' },
  logTitle: { fontWeight: 800, marginBottom: '16px', fontSize: '11px', color: '#94a3b8', letterSpacing: '0.1em' },
  logItem: { display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f8fafc', fontSize: '13px', color: '#475569', lineHeight: 1.4 },
  emptyLogs: { color: '#cbd5e1', fontSize: '13px', fontStyle: 'italic' },
  btnPrimary: { flex: 1, background: '#6366f1', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.1s' },
  btnSec: { flex: 1, background: 'white', color: '#475569', border: '1px solid #e2e8f0', padding: '16px 32px', borderRadius: '16px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  btnOff: { flex: 1, background: '#f1f5f9', color: '#cbd5e1', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  btnStart: { background: '#1e293b', color: 'white', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 700, fontSize: '18px', cursor: 'pointer', width: '100%', marginTop: '20px' },
  btnFinish: { background: '#fff1f2', color: '#e11d48', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' },
  statusPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9', padding: '20px' },
  statusCard: { background: 'white', padding: '60px', borderRadius: '40px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', maxWidth: '500px' },
  statusTitle: { fontSize: '32px', fontWeight: 800, marginBottom: '16px', color: '#1e293b' },
  statusText: { color: '#64748b', marginBottom: '40px', lineHeight: 1.6, fontSize: '16px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
  modalCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalIcon: { width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px' },
  modalTitle: { fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' },
  modalText: { fontSize: '15px', color: '#64748b', lineHeight: 1.5, marginBottom: '32px' },
  modalActions: { display: 'flex', gap: '12px' },
  sidebarCamWrapper: { marginBottom: '24px' }
};

export default TestPage;