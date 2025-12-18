import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 1. Добавляем навигатор

const Dashboard = () => {
  const [data, setData] = useState({ user: null, tests: [] });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // 2. Инициализируем

  const userId = 1; 

  useEffect(() => {
    fetch(`http://localhost:5000/api/dashboard/${userId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setIsLoading(false);
      })
      .catch(err => console.error("Ошибка загрузки данных:", err));
  }, []);

  if (isLoading) return (
    <div style={styles.loaderContainer}>
      <div style={styles.loader}></div>
      <p style={styles.loaderText}>Загружаем твой успех...</p>
    </div>
  );

  const { user, tests } = data;

  const handleStartTest = async (testId, isFinished) => {
    if (isFinished) {
      alert("Тест уже завершен!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, testId: testId })
      });

      const result = await response.json();

      if (result.sessionId) {
        // Сохраняем ID сессии для страницы теста
        localStorage.setItem("current_session_id", result.sessionId);
        localStorage.setItem("current_test_id", testId);

        // 3. ПЕРЕХОДИМ ПО ПУТИ ИЗ APP.JS
        // Путь должен быть /test/ID_ТЕСТА
        navigate(`/test/${testId}`); 
      } else {
        alert("Ошибка при запуске теста");
      }
    } catch (error) {
      console.error("Ошибка запроса:", error);
      alert("Сервер не отвечает");
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
        * { box-sizing: border-box; transition: all 0.2s ease-in-out; }
        .test-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
      `}</style>
      
      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logo}>
            <div style={styles.logoCircle}>🚀</div>
            <span style={styles.logoText}>EDU.PRO</span>
          </div>
          
          <nav style={styles.nav}>
            <NavItem icon="🏠" label="Дашборд" active />
            <NavItem icon="📝" label="Мои тесты" />
            <NavItem icon="📊" label="Статистика" />
            <NavItem icon="🏆" label="Достижения" />
          </nav>
        </div>

        <div style={styles.userCard}>
          <div style={styles.avatar}>
            {user?.full_name?.[0] || "?"}
            <div style={styles.onlineBadge}></div>
          </div>
          <div style={{ marginLeft: "14px" }}>
            <div style={styles.userName}>{user?.full_name}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
        </div>
      </aside>

      {/* --- MAIN --- */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Привет, {user?.full_name?.split(' ')[0]}! 👋</h1>
            <p style={styles.pageSubtitle}>Сегодня отличный день, чтобы узнать что-то новое.</p>
          </div>
          <div style={styles.dateBadge}>
            📅 {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        </header>

        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <h2 style={styles.heroTitle}>Твой прогресс впечатляет!</h2>
            <p style={styles.heroText}>Ты прошел уже 80% курса по графическому дизайну. Не останавливайся!</p>
            <button style={styles.heroBtn}>Продолжить обучение</button>
          </div>
          <div style={styles.heroImage}>🎓</div>
        </div>

        <section>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Доступные тестирования</h3>
            <span style={styles.countBadge}>{tests.length} активных</span>
          </div>

          <div style={styles.grid}>
            {tests.map(test => {
              const isFinished = !!test.end_time;
              const isStarted = !!test.start_time && !test.end_time;

              return (
                <div key={test.id} className="test-card" style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{...styles.cardIcon, backgroundColor: getSubjectColor(test.subject) + '15', color: getSubjectColor(test.subject)}}>
                      {getSubjectEmoji(test.subject)}
                    </div>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: isFinished ? "#dcfce7" : isStarted ? "#fef9c3" : "#f1f5f9",
                      color: isFinished ? "#166534" : isStarted ? "#854d0e" : "#475569"
                    }}>
                      {isFinished ? "Завершено" : isStarted ? "В процессе" : "Новый"}
                    </div>
                  </div>

                  <h4 style={styles.cardTitle}>{test.name}</h4>
                  <p style={styles.cardSubject}>{test.subject}</p>
                  
                  <div style={styles.cardStats}>
                    <div style={styles.statItem}>⏱ {test.duration_minutes} мин</div>
                    <div style={styles.statItem}>❓ {test.q_count} вопросов</div>
                  </div>

                  <button 
                    onClick={() => handleStartTest(test.id, !!test.end_time)}
                    style={{
                      ...styles.cardBtn,
                      backgroundColor: !!test.end_time ? "#f1f5f9" : "#6366f1",
                      color: !!test.end_time ? "#94a3b8" : "#fff",
                      cursor: !!test.end_time ? "default" : "pointer"
                    }}
                  >
                    {!!test.end_time ? "Результаты" : (!!test.start_time ? "Продолжить" : "Начать тест")}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

// Вспомогательные функции остаются без изменений
const NavItem = ({ icon, label, active }) => (
  <div style={{
    ...styles.navItem,
    backgroundColor: active ? "#6366f110" : "transparent",
    color: active ? "#6366f1" : "#64748b",
  }}>
    <span style={{marginRight: "12px", fontSize: "20px"}}>{icon}</span>
    {label}
  </div>
);

const getSubjectColor = (subj) => {
  const colors = { 'Математика': '#6366f1', 'История': '#f59e0b', 'Английский': '#ec4899' };
  return colors[subj] || '#6366f1';
};

const getSubjectEmoji = (subj) => {
  const emojis = { 'Математика': '📐', 'История': '📜', 'Английский': '🇬🇧' };
  return emojis[subj] || '📚';
};

const styles = {
  container: { display: "flex", minHeight: "100vh" },
  sidebar: { width: "280px", minWidth: "280px", backgroundColor: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 0", height: "100vh", position: "sticky", top: 0 },
  logo: { display: "flex", alignItems: "center", padding: "0 30px", marginBottom: "50px" },
  logoCircle: { width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginRight: "12px" },
  logoText: { fontSize: "22px", fontWeight: "800", letterSpacing: "-1px", color: "#1e293b" },
  nav: { padding: "0 15px" },
  navItem: { display: "flex", alignItems: "center", padding: "14px 20px", borderRadius: "16px", cursor: "pointer", fontWeight: "600", marginBottom: "8px" },
  userCard: { margin: "0 20px", padding: "15px", backgroundColor: "#f8fafc", borderRadius: "20px", display: "flex", alignItems: "center" },
  avatar: { width: "48px", height: "48px", borderRadius: "14px", backgroundColor: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", position: "relative" },
  onlineBadge: { width: "12px", height: "12px", backgroundColor: "#22c55e", borderRadius: "50%", position: "absolute", bottom: "-2px", right: "-2px", border: "2px solid #fff" },
  userName: { fontSize: "14px", fontWeight: "700", color: "#1e293b" },
  userRole: { fontSize: "12px", color: "#94a3b8", fontWeight: "600" },
  main: { flexGrow: 1, padding: "40px 60px", maxWidth: "1400px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" },
  pageTitle: { fontSize: "32px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  pageSubtitle: { color: "#64748b", marginTop: "8px", fontSize: "16px" },
  dateBadge: { backgroundColor: "#fff", padding: "10px 20px", borderRadius: "14px", fontWeight: "700", color: "#1e293b", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  hero: { background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: "32px", padding: "40px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "50px", position: "relative", overflow: "hidden" },
  heroTitle: { fontSize: "28px", fontWeight: "800", marginBottom: "12px" },
  heroText: { fontSize: "16px", opacity: 0.8, maxWidth: "450px", marginBottom: "24px", lineHeight: "1.6" },
  heroBtn: { padding: "14px 28px", borderRadius: "14px", border: "none", backgroundColor: "#6366f1", color: "#fff", fontWeight: "700", cursor: "pointer" },
  heroImage: { fontSize: "100px", opacity: 0.9 },
  sectionHeader: { display: "flex", alignItems: "center", marginBottom: "30px", gap: "15px" },
  sectionTitle: { fontSize: "22px", fontWeight: "800", color: "#1e293b" },
  countBadge: { backgroundColor: "#6366f110", color: "#6366f1", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" },
  card: { backgroundColor: "#fff", padding: "30px", borderRadius: "28px", border: "1px solid #f1f5f9" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  cardIcon: { width: "56px", height: "56px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" },
  statusBadge: { padding: "6px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "800" },
  cardTitle: { fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "6px" },
  cardSubject: { fontSize: "14px", color: "#94a3b8", fontWeight: "600", marginBottom: "20px" },
  cardStats: { display: "flex", gap: "15px", marginBottom: "25px" },
  statItem: { fontSize: "13px", fontWeight: "700", color: "#475569", backgroundColor: "#f8fafc", padding: "6px 12px", borderRadius: "10px" },
  cardBtn: { width: "100%", padding: "16px", borderRadius: "16px", border: "none", fontWeight: "700", cursor: "pointer" },
  loaderContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#f8fafc" },
  loader: { width: "50px", height: "50px", border: "5px solid #e2e8f0", borderTop: "5px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loaderText: { marginTop: "20px", color: "#64748b", fontWeight: "600" }
};

export default Dashboard;