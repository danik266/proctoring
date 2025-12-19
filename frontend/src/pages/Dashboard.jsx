import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ИМПОРТИРУЙ СВОИ КОМПОНЕНТЫ ЗДЕСЬ:
// Убедись, что файлы Ent.jsx, Modo.jsx, Pisa.jsx существуют в той же папке
import EntPage from "./Ent";
import ModoPage from "./Modo";
import PisaPage from "./Pisa";

const Dashboard = () => {
  const [data, setData] = useState({ user: null, tests: [] });
  const [isLoading, setIsLoading] = useState(true);

  // activeTab может быть: 'home', 'my_tests', 'ent', 'modo', 'pisa'
  const [activeTab, setActiveTab] = useState("home");

  const navigate = useNavigate();
  const userId = 1; // ID пользователя (в реальном проекте брать из контекста/токена)

  useEffect(() => {
    fetch(`http://localhost:5000/api/dashboard/${userId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки данных:", err);
        // Для демонстрации, если бэкенд выключен, уберем вечную загрузку:
        setIsLoading(false);
      });
  }, []);

  const handleStartTest = async (testId, isFinished) => {
    if (isFinished) {
      alert("Тест уже завершен!");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, testId: testId }),
      });
      const result = await response.json();
      if (result.sessionId) {
        localStorage.setItem("current_session_id", result.sessionId);
        localStorage.setItem("current_test_id", testId);
        navigate(`/test/${testId}`);
      } else {
        alert("Ошибка при запуске теста");
      }
    } catch (error) {
      console.error("Ошибка", error);
      alert("Не удалось соединиться с сервером");
    }
  };

  if (isLoading) return <div style={styles.loaderContainer}>Загрузка...</div>;

  const { user, tests } = data;

  // Безопасное получение имени (если user null)
  const userName = user?.full_name || "Гость";
  const userFirstName = userName.split(" ")[0];

  const renderContent = () => {
    switch (activeTab) {
      case "ent":
        return <EntPage tests={tests} onStart={handleStartTest} />;
      case "modo":
        return <ModoPage tests={tests} onStart={handleStartTest} />;
      case "pisa":
        return <PisaPage tests={tests} onStart={handleStartTest} />;
      case "my_tests":
        const myTests = tests ? tests.filter((t) => t.start_time) : [];
        return (
          <div className="fade-in">
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Мои тесты</h3>
              <span style={styles.countBadge}>{myTests.length} начатых</span>
            </div>
            {myTests.length > 0 ? (
              <div style={styles.grid}>
                {myTests.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onStart={handleStartTest}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#94a3b8",
                }}
              >
                У вас пока нет активных тестов.
              </div>
            )}
          </div>
        );
      default: // 'home'
        return (
          <div className="fade-in">
            {/* HERO BLOCK */}
            <div style={styles.hero}>
              <div style={styles.heroContent}>
                <h2 style={styles.heroTitle}>Твой путь к успеху</h2>
                <p style={styles.heroText}>
                  Официальная платформа тестирования. Выбери направление и начни
                  подготовку прямо сейчас.
                </p>
              </div>
              <div style={styles.heroImage}>🚀</div>
            </div>

            {/* CATEGORIES BLOCKS */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Выбери экзамен</h3>
            </div>
            <div style={styles.grid}>
              <CategoryCard
                title="ЕНТ"
                icon="🎓"
                color="#3b82f6"
                gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                onClick={() => setActiveTab("ent")}
              />
              <CategoryCard
                title="МОДО"
                icon="📊"
                color="#10b981"
                gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                onClick={() => setActiveTab("modo")}
              />
              <CategoryCard
                title="PISA"
                icon="🌍"
                color="#8b5cf6"
                gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                onClick={() => setActiveTab("pisa")}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <GlobalStyles />

      {/* SIDEBAR */}
      <aside className="sidebar" style={styles.sidebar}>
        <div>
          <nav style={styles.nav}>
            <NavItem
              icon="🏠"
              label="Главная"
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            />
            <NavItem
              icon="📝"
              label="Мои тесты"
              active={activeTab === "my_tests"}
              onClick={() => setActiveTab("my_tests")}
            />

            <div style={styles.divider}>
              <span
                className="divider-text"
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#cbd5e1",
                  letterSpacing: "1px",
                }}
              >
                ЭКЗАМЕНЫ
              </span>
            </div>

            <NavItem
              icon="🎓"
              label="ЕНТ"
              active={activeTab === "ent"}
              onClick={() => setActiveTab("ent")}
            />
            <NavItem
              icon="📊"
              label="МОДО"
              active={activeTab === "modo"}
              onClick={() => setActiveTab("modo")}
            />
            <NavItem
              icon="🌍"
              label="PISA"
              active={activeTab === "pisa"}
              onClick={() => setActiveTab("pisa")}
            />
          </nav>
        </div>

        <div style={styles.userCard} className="user-card">
          <div style={styles.avatar}>{userName[0] || "?"}</div>
          <div style={{ marginLeft: "14px" }} className="user-details">
            <div style={styles.userName}>{userName}</div>
            <div style={styles.userRole}>{user?.role || "Студент"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content" style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Привет, {userFirstName}! 👋</h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "home"
                ? "Готов приступить к экзаменам?"
                : activeTab === "my_tests"
                ? "Продолжи свое обучение"
                : `Подготовка к ${activeTab.toUpperCase()}`}
            </p>
          </div>
          <div style={styles.dateBadge}>
            📅 {new Date().toLocaleDateString("ru-RU")}
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

// --- КОМПОНЕНТЫ UI ---

const TestCard = ({ test, onStart }) => {
  const isFinished = !!test.end_time;
  const isStarted = !!test.start_time && !test.end_time;
  return (
    <div className="test-card" style={styles.card}>
      <div style={styles.cardHeader}>
        <div
          style={{
            ...styles.cardIcon,
            color: "#6366f1",
            background: "#6366f115",
          }}
        >
          📚
        </div>
        <div
          style={{
            ...styles.statusBadge,
            background: isFinished
              ? "#dcfce7"
              : isStarted
              ? "#fef9c3"
              : "#f1f5f9",
            color: isFinished ? "#166534" : isStarted ? "#854d0e" : "#475569",
          }}
        >
          {isFinished ? "Сдано" : isStarted ? "В процессе" : "Ожидает"}
        </div>
      </div>
      <h4 style={styles.cardTitle}>{test.name}</h4>
      <p style={styles.cardSubject}>{test.subject}</p>
      <button
        onClick={() => onStart(test.id, isFinished)}
        style={styles.cardBtn}
      >
        {isFinished ? "Результат" : isStarted ? "Продолжить" : "Начать"}
      </button>
    </div>
  );
};

const CategoryCard = ({ title, icon, gradient, onClick }) => (
  <div
    className="category-card"
    onClick={onClick}
    style={{ ...styles.categoryCard, background: gradient }}
  >
    <div style={styles.catIcon}>{icon}</div>
    <h3 style={styles.catTitle}>{title}</h3>
    <div style={styles.catArrow}>➜</div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`nav-item ${active ? "active" : ""}`}
    style={styles.navItem}
  >
    <span style={{ marginRight: "12px", fontSize: "20px" }}>{icon}</span>
    <span className="sidebar-text">{label}</span>
  </div>
);

// --- СТИЛИ И CSS ---

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    
    body { 
        margin: 0; 
        font-family: 'Plus Jakarta Sans', sans-serif; 
        background: #f8fafc; 
        
        /* --- ИСПРАВЛЕНИЕ: Убирает горизонтальный скролл --- */
        overflow-x: hidden; 
        width: 100%;
    }

    * { box-sizing: border-box; transition: all 0.2s ease; }
    
    .test-card:hover, .category-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .category-card:active { transform: scale(0.98); }
    
    /* Nav Item Styles */
    .nav-item { cursor: pointer; display: flex; align-items: center; padding: 14px 20px; border-radius: 16px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
    .nav-item:hover { background-color: #e0e7ff; color: #6366f1; transform: translateX(5px); }
    .nav-item.active { background-color: #6366f110; color: #6366f1; }
    .nav-item:active { background-color: #c7d2fe; transform: scale(0.96); }

    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Mobile Styles */
    @media (max-width: 768px) {
        .sidebar { width: 80px !important; min-width: 80px !important; padding: 20px 10px !important; position: fixed; height: 100vh; z-index: 1000; }
        .sidebar-text, .user-details, .logo-text, .divider-text { display: none !important; }
        .nav-item, .logo, .user-card { justify-content: center !important; padding-left: 0 !important; padding-right: 0 !important; }
        .nav-item span { margin-right: 0 !important; }
        
        /* Исправление отступов для мобильных */
        .main-content { 
            margin-left: 80px; 
            padding: 20px 15px !important; 
            width: calc(100% - 80px) !important; 
            max-width: 100vw;
        }
        
        .grid { grid-template-columns: 1fr !important; }
        .hero-image { display: none !important; }
        .header { flex-direction: column; align-items: flex-start; gap: 10px; }
    }
  `}</style>
);

const styles = {
  container: { display: "flex", minHeight: "100vh", maxWidth: "100vw" },
  sidebar: {
    width: "280px",
    minWidth: "280px",
    background: "#fff",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px 0",
    height: "100vh",
    position: "sticky",
    top: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    padding: "0 30px",
    marginBottom: "40px",
  },
  logoCircle: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    marginRight: "12px",
    color: "#fff",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: "-1px",
  },
  nav: { padding: "0 15px" },
  divider: { margin: "20px 0 10px 20px" },
  userCard: {
    margin: "0 20px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#6366f1",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },
  userName: { fontSize: "14px", fontWeight: "700", color: "#1e293b" },
  userRole: { fontSize: "12px", color: "#94a3b8", fontWeight: "600" },
  main: { flexGrow: 1, padding: "40px 60px", maxWidth: "1400px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  pageSubtitle: { color: "#64748b", marginTop: "8px", fontSize: "16px" },
  dateBadge: {
    background: "#fff",
    padding: "10px 20px",
    borderRadius: "14px",
    fontWeight: "700",
    color: "#1e293b",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  hero: {
    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    borderRadius: "32px",
    padding: "40px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "50px",
    position: "relative",
    overflow: "hidden",
  },
  heroTitle: { fontSize: "28px", fontWeight: "800", marginBottom: "12px" },
  heroText: {
    fontSize: "16px",
    opacity: 0.8,
    maxWidth: "450px",
    lineHeight: "1.6",
  },
  heroImage: { fontSize: "100px", opacity: 0.9 },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "30px",
  },
  sectionTitle: { fontSize: "22px", fontWeight: "800", color: "#1e293b" },
  countBadge: {
    background: "#6366f110",
    color: "#6366f1",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "30px",
  },
  categoryCard: {
    padding: "30px",
    borderRadius: "28px",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "220px",
  },
  catIcon: {
    fontSize: "40px",
    marginBottom: "15px",
    background: "rgba(255,255,255,0.2)",
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: { fontSize: "28px", fontWeight: "800", margin: 0 },
  catArrow: {
    position: "absolute",
    bottom: "30px",
    right: "30px",
    fontSize: "24px",
    background: "#fff",
    color: "#1e293b",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "28px",
    border: "1px solid #f1f5f9",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "6px",
  },
  cardSubject: {
    fontSize: "14px",
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: "20px",
  },
  cardBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",
    backgroundColor: "#6366f1",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f8fafc",
  },
};

export default Dashboard;
