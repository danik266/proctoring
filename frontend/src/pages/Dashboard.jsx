import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
// ИМПОРТ ХУКА ЯЗЫКА
import { useLanguage } from "../context/LanguageContext";

import EntPage from "./Ent";
import ModoPage from "./Modo";
import PisaPage from "./Pisa";

const Dashboard = () => {
  // Подключаем перевод
  const { t, language } = useLanguage();

  const [data, setData] = useState({ user: null, tests: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id") || 1;

  // --- ЛОГИКА ЗАГРУЗКИ ---
  useEffect(() => {
    fetch(`http://localhost:5000/api/dashboard/${userId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки данных:", err);
        setIsLoading(false);
        toast.error(t("toast_load_err"), {
          style: { background: "#334155", color: "#fff" },
        });
      });
  }, [userId, t]);

  // --- ЛОГИКА СТАРТА ТЕСТА ---
  const handleStartTest = async (testId, isFinished) => {
    if (isFinished) {
      toast(t("toast_finished"), {
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: "rgba(16, 185, 129, 0.2)",
          color: "#fff",
          border: "1px solid #10b981",
        },
      });
      return;
    }

    const loadingToast = toast.loading(t("toast_prep"), {
      style: { background: "#1e293b", color: "#fff" },
    });

    try {
      const response = await fetch("http://localhost:5000/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, test_id: testId }),
      });
      const result = await response.json();

      toast.dismiss(loadingToast);

      if ((response.ok || result.sessionId) && !result.error) {
        const sessId = result.sessionId || result.session_id;
        localStorage.setItem("current_session_id", sessId);
        localStorage.setItem("current_test_id", testId);

        toast.success(t("toast_started"), {
          style: { background: "#1e293b", color: "#fff" },
        });

        setTimeout(() => {
          navigate(`/test/${testId}`);
        }, 500);
      } else {
        toast.error(result.error || t("toast_err_start"));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Ошибка", error);
      toast.error(t("toast_err_connect"));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Форматирование даты в зависимости от языка
  const getLocaleDate = () => {
    const locales = {
      RU: "ru-RU",
      KZ: "kk-KZ", // Казахская локаль
      EN: "en-US",
    };
    return new Date().toLocaleDateString(locales[language] || "ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // --- РЕНДЕР ЗАГРУЗКИ ---
  if (isLoading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}>
          <div style={styles.loaderSpinner}></div>
          <p style={styles.loaderText}>{t("dash_loading")}</p>
        </div>
      </div>
    );
  }

  const { user, tests } = data;
  const userName = user?.full_name || "Guest";
  const userFirstName = userName.split(" ")[0];

  // --- РЕНДЕР КОНТЕНТА ---
  const renderContent = () => {
    switch (activeTab) {
      case "ent":
        return <EntPage tests={tests} onStart={handleStartTest} />;
      case "modo":
        return <ModoPage tests={tests} onStart={handleStartTest} />;
      case "pisa":
        return <PisaPage tests={tests} onStart={handleStartTest} />;

      case "my_tests":
        // --- ЛОГИКА ФИЛЬТРАЦИИ ---
        const allStarted = tests ? tests.filter((t) => t.start_time) : [];

        const isCategory = (test, keywords) => {
          const searchStr = `${test.name || ""} ${test.subject || ""} ${
            test.category || ""
          } ${test.type || ""}`.toLowerCase();
          return keywords.some((word) => searchStr.includes(word));
        };

        const entTests = allStarted.filter((t) =>
          isCategory(t, ["ент", "ent", "ұбт"])
        );
        const modoTests = allStarted.filter((t) =>
          isCategory(t, ["модо", "modo"])
        );
        const pisaTests = allStarted.filter((t) =>
          isCategory(t, ["pisa", "пиза"])
        );

        const entIds = entTests.map((t) => t.id);
        const modoIds = modoTests.map((t) => t.id);
        const pisaIds = pisaTests.map((t) => t.id);

        const otherTests = allStarted.filter(
          (t) =>
            !entIds.includes(t.id) &&
            !modoIds.includes(t.id) &&
            !pisaIds.includes(t.id)
        );

        const renderTestSection = (title, list, icon, gradient) => {
          if (list.length === 0) return null;
          return (
            <div
              style={{ marginBottom: "40px" }}
              key={title}
              className="fade-in"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div style={{ ...styles.sectionIcon, background: gradient }}>
                  {icon}
                </div>
                <h3 style={styles.sectionTitle}>{title}</h3>
                <span style={styles.countBadge}>{list.length}</span>
              </div>
              <div style={styles.grid}>
                {list.map((test) => (
                  <TestCard
                    key={test.id}
                    test={test}
                    onStart={handleStartTest}
                    t={t}
                  />
                ))}
              </div>
            </div>
          );
        };

        return (
          <div className="fade-in">
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>{t("hist_title")}</h3>
              <p style={styles.sectionSubtitle}>{t("hist_sub")}</p>
            </div>

            {allStarted.length > 0 ? (
              <>
                {renderTestSection(
                  "ENT",
                  entTests,
                  "🎓",
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                )}
                {renderTestSection(
                  "MODO",
                  modoTests,
                  "📊",
                  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
                )}
                {renderTestSection(
                  "PISA",
                  pisaTests,
                  "🌍",
                  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
                )}
                {renderTestSection(
                  t("other_tests"),
                  otherTests,
                  "📁",
                  "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)"
                )}
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📝</div>
                <h4 style={styles.emptyTitle}>{t("empty_title")}</h4>
                <p style={styles.emptyText}>{t("empty_text")}</p>
                <button
                  style={styles.emptyBtn}
                  onClick={() => setActiveTab("home")}
                >
                  {t("btn_choose_exam")}
                </button>
              </div>
            )}
          </div>
        );

      default: // HOME
        return (
          <div className="fade-in">
            {/* HERO BLOCK */}
            <div style={styles.hero}>
              <div style={styles.heroGlow}></div>
              <div style={styles.heroContent}>
                <div style={styles.heroBadge}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {t("hero_badge")}
                </div>
                <h2 style={styles.heroTitle}>{t("hero_title")}</h2>
                <p style={styles.heroText}>{t("hero_text")}</p>
                <div style={styles.heroStats}>
                  <div style={styles.heroStat}>
                    <span style={styles.heroStatNumber}>3</span>
                    <span style={styles.heroStatLabel}>
                      {t("hero_stat_exam")}
                    </span>
                  </div>
                  <div style={styles.heroStatDivider}></div>
                  <div style={styles.heroStat}>
                    <span style={styles.heroStatNumber}>
                      {tests?.filter((t) => t.published === true).length || 0}
                    </span>
                    <span style={styles.heroStatLabel}>
                      {t("hero_stat_test")}
                    </span>
                  </div>
                </div>
              </div>
              <div style={styles.heroVisual}>
                <div style={styles.heroCircle1}></div>
                <div style={styles.heroCircle2}></div>
                <div style={styles.heroEmoji}>🚀</div>
              </div>
            </div>

            {/* CATEGORIES */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>{t("cat_select")}</h3>
              <p style={styles.sectionSubtitle}>{t("cat_sub")}</p>
            </div>
            <div style={styles.grid}>
              <CategoryCard
                title="ENT"
                description={t("cat_ent_desc")}
                icon="🎓"
                gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                onClick={() => setActiveTab("ent")}
              />
              <CategoryCard
                title="MODO"
                description={t("cat_modo_desc")}
                icon="📊"
                gradient="linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
                onClick={() => setActiveTab("modo")}
              />
              <CategoryCard
                title="PISA"
                description={t("cat_pisa_desc")}
                icon="🌍"
                gradient="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
                onClick={() => setActiveTab("pisa")}
              />
            </div>

            {/* QUICK STATS */}
            <div style={styles.quickStats}>
              <QuickStat
                count={tests?.filter((t) => t.end_time).length || 0}
                label={t("stat_finished")}
                color="#6366f1"
                icon={
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                }
              />
              <QuickStat
                count={
                  tests?.filter((t) => t.start_time && !t.end_time).length || 0
                }
                label={t("stat_in_progress")}
                color="#10b981"
                icon={
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </>
                }
              />
              <QuickStat
                count={tests?.filter((t) => !t.start_time).length || 0}
                label={t("stat_waiting")}
                color="#f59e0b"
                icon={
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </>
                }
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <GlobalStyles />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(30, 41, 59, 0.9)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? "80px" : "280px",
        }}
      >
        <div>
          <nav style={styles.nav}>
            <NavItem
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
              label={t("nav_home")}
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
              collapsed={sidebarCollapsed}
            />
            <NavItem
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              }
              label={t("nav_tests")}
              active={activeTab === "my_tests"}
              onClick={() => setActiveTab("my_tests")}
              collapsed={sidebarCollapsed}
            />

            <div style={styles.divider}>
              {!sidebarCollapsed && (
                <span style={styles.dividerText}>{t("section_exams")}</span>
              )}
            </div>

            <NavItem
              icon={<span style={{ fontSize: "18px" }}>🎓</span>}
              label="ENT"
              active={activeTab === "ent"}
              onClick={() => setActiveTab("ent")}
              collapsed={sidebarCollapsed}
            />
            <NavItem
              icon={<span style={{ fontSize: "18px" }}>📊</span>}
              label="MODO"
              active={activeTab === "modo"}
              onClick={() => setActiveTab("modo")}
              collapsed={sidebarCollapsed}
            />
            <NavItem
              icon={<span style={{ fontSize: "18px" }}>🌍</span>}
              label="PISA"
              active={activeTab === "pisa"}
              onClick={() => setActiveTab("pisa")}
              collapsed={sidebarCollapsed}
            />

            {(user?.role === "admin" ||
              user?.role === "superadmin" ||
              localStorage.getItem("userRole") === "admin") && (
              <>
                <div style={styles.divider}>
                  {!sidebarCollapsed && (
                    <span style={styles.dividerText}>{t("section_admin")}</span>
                  )}
                </div>
                <NavItem
                  icon={
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                  label={t("nav_admin")}
                  active={false}
                  onClick={() => navigate("/admin")}
                  collapsed={sidebarCollapsed}
                />
              </>
            )}
          </nav>
        </div>

        <div style={styles.sidebarBottom}>
          <button
            style={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: sidebarCollapsed ? "rotate(180deg)" : "none",
              }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div style={styles.userCard}>
            <div style={styles.avatar}>{userName[0] || "?"}</div>
            {!sidebarCollapsed && (
              <div style={styles.userInfo}>
                <p style={styles.userName}>{userName}</p>
                <p style={styles.userRole}>{user?.role || "Student"}</p>
              </div>
            )}
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>{t("nav_logout")}</span>}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {t("dash_hello")}, {userFirstName}!
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === "home"
                ? t("dash_sub_home")
                : activeTab === "my_tests"
                ? t("dash_sub_tests")
                : `${t("dash_sub_prep")} ${activeTab.toUpperCase()}`}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.dateBadge}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {getLocaleDate()}
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

// Передаем t в TestCard, чтобы перевести статусы и кнопки
const TestCard = ({ test, onStart, t }) => {
  const isFinished = !!test.end_time;
  const isStarted = !!test.start_time && !test.end_time;

  const score = test.score || 0;
  const total = test.total_questions || test.max_score || 20;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getScoreColor = () => {
    if (percentage >= 85) return "#10b981";
    if (percentage >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="test-card" style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardIcon}>📚</div>
        <div
          style={{
            ...styles.statusBadge,
            background: isFinished
              ? "rgba(16, 185, 129, 0.2)"
              : isStarted
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(99, 102, 241, 0.2)",
            color: isFinished ? "#10b981" : isStarted ? "#f59e0b" : "#6366f1",
          }}
        >
          {isFinished
            ? t("card_status_done")
            : isStarted
            ? t("card_status_process")
            : t("card_status_wait")}
        </div>
      </div>

      <h4 style={styles.cardTitle}>{test.name}</h4>
      <p style={styles.cardSubject}>{test.subject}</p>

      {isFinished && (
        <div style={styles.resultContainer}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>
              <span
                style={{ color: "#fff", fontWeight: "700", fontSize: "15px" }}
              >
                {score}
              </span>
              <span style={{ opacity: 0.7 }}>
                {" "}
                / {total} {t("card_score")}
              </span>
            </div>
            <div
              style={{
                color: getScoreColor(),
                fontWeight: "800",
                fontSize: "16px",
                textShadow: `0 0 15px ${getScoreColor()}40`,
              }}
            >
              {percentage}%
            </div>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${percentage}%`,
                background: getScoreColor(),
                boxShadow: `0 0 10px ${getScoreColor()}`,
              }}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => onStart(test.id, isFinished)}
        style={styles.cardBtn}
      >
        {isFinished
          ? t("btn_result")
          : isStarted
          ? t("btn_continue")
          : t("btn_start")}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};

const CategoryCard = ({ title, description, icon, gradient, onClick }) => (
  <div
    className="category-card"
    onClick={onClick}
    style={{ ...styles.categoryCard, background: gradient }}
  >
    <div style={styles.catGlow}></div>
    <div style={styles.catIcon}>{icon}</div>
    <div>
      <h3 style={styles.catTitle}>{title}</h3>
      <p style={styles.catDescription}>{description}</p>
    </div>
    <div style={styles.catArrow}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  </div>
);

const QuickStat = ({ count, label, color, icon }) => (
  <div style={styles.quickStatCard}>
    <div style={styles.quickStatIcon}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        {icon}
      </svg>
    </div>
    <div>
      <p style={styles.quickStatValue}>{count}</p>
      <p style={styles.quickStatLabel}>{label}</p>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick, collapsed }) => (
  <div
    onClick={onClick}
    className={`nav-item ${active ? "active" : ""}`}
    style={styles.navItem}
  >
    <span style={styles.navIcon}>{icon}</span>
    {!collapsed && <span style={styles.navLabel}>{label}</span>}
  </div>
);

// --- GLOBAL STYLES (Остаются без изменений) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); min-height: 100vh; overflow-x: hidden; color: #fff; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.8; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .test-card, .category-card { transition: all 0.3s ease; }
    .test-card:hover, .category-card:hover { transform: translateY(-8px); }
    .nav-item { cursor: pointer; transition: all 0.2s ease; }
    .nav-item:hover { background: rgba(99, 102, 241, 0.15); transform: translateX(5px); }
    .nav-item.active { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
    @media (max-width: 1024px) { .sidebar { width: 80px !important; min-width: 80px !important; } .sidebar-text { display: none !important; } }
    @media (max-width: 768px) { .main { padding: 20px !important; } .grid { grid-template-columns: 1fr !important; } }
  `}</style>
);

// --- STYLES OBJECT (Остаются без изменений) ---
const styles = {
  container: { display: "flex", minHeight: "100vh" },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background:
      "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  loader: { textAlign: "center" },
  loaderSpinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  loaderText: { color: "#94a3b8", fontSize: "16px" },
  sidebar: {
    background: "rgba(15, 12, 41, 0.95)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "30px 15px",
    height: "100vh",
    position: "sticky",
    top: 0,
    transition: "width 0.3s ease",
    overflow: "hidden",
    zIndex: 50,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 10px",
    marginBottom: "40px",
    cursor: "pointer",
  },
  logoIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#fff",
    letterSpacing: "-0.5px",
    whiteSpace: "nowrap",
  },
  nav: { display: "flex", flexDirection: "column", gap: "6px" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "14px",
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: "14px",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    flexShrink: 0,
  },
  navLabel: { whiteSpace: "nowrap" },
  divider: { margin: "24px 0 12px 16px" },
  dividerText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "rgba(148, 163, 184, 0.6)",
    letterSpacing: "1.5px",
  },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: "12px" },
  collapseBtn: {
    width: "100%",
    padding: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    flexShrink: 0,
  },
  userInfo: { overflow: "hidden" },
  userName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "14px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    color: "#ef4444",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  main: {
    flexGrow: 1,
    padding: "40px 50px",
    maxWidth: "1400px",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px",
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "8px",
  },
  pageSubtitle: { color: "#94a3b8", fontSize: "16px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    padding: "12px 20px",
    borderRadius: "14px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  hero: {
    background:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "28px",
    padding: "50px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "50px",
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background:
      "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
    top: "-100px",
    right: "-100px",
    animation: "pulse 4s ease-in-out infinite",
  },
  heroContent: { position: "relative", zIndex: 10, maxWidth: "500px" },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(99, 102, 241, 0.3)",
    border: "1px solid rgba(99, 102, 241, 0.5)",
    padding: "8px 16px",
    borderRadius: "50px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#a5b4fc",
    marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "16px",
    lineHeight: "1.2",
  },
  heroText: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: "1.7",
    marginBottom: "30px",
  },
  heroStats: { display: "flex", alignItems: "center", gap: "24px" },
  heroStat: { textAlign: "center" },
  heroStatNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    display: "block",
  },
  heroStatLabel: { fontSize: "13px", color: "#94a3b8" },
  heroStatDivider: {
    width: "1px",
    height: "40px",
    background: "rgba(255,255,255,0.2)",
  },
  heroVisual: { position: "relative", width: "200px", height: "200px" },
  heroCircle1: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    border: "2px solid rgba(99, 102, 241, 0.3)",
    top: "10px",
    left: "10px",
    animation: "pulse 3s ease-in-out infinite",
  },
  heroCircle2: {
    position: "absolute",
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: "2px solid rgba(139, 92, 246, 0.3)",
    top: "30px",
    left: "30px",
    animation: "pulse 3s ease-in-out infinite 0.5s",
  },
  heroEmoji: {
    position: "absolute",
    fontSize: "80px",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  sectionHeader: { marginBottom: "30px" },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "8px",
  },
  sectionSubtitle: { fontSize: "15px", color: "#94a3b8" },
  sectionIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    fontSize: "16px",
  },
  countBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.1)",
    color: "#94a3b8",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginLeft: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  categoryCard: {
    padding: "32px",
    borderRadius: "24px",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minHeight: "200px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  catGlow: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
    top: "-50px",
    right: "-50px",
  },
  catIcon: {
    fontSize: "48px",
    width: "80px",
    height: "80px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: { fontSize: "28px", fontWeight: "800", margin: 0 },
  catDescription: { fontSize: "14px", opacity: 0.8, marginTop: "6px" },
  catArrow: {
    position: "absolute",
    bottom: "28px",
    right: "28px",
    width: "44px",
    height: "44px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    padding: "28px",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
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
    borderRadius: "16px",
    background: "rgba(99, 102, 241, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },
  statusBadge: {
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px",
  },
  cardSubject: { fontSize: "14px", color: "#94a3b8", marginBottom: "24px" },
  cardBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  resultContainer: {
    marginBottom: "20px",
    background: "rgba(0,0,0,0.2)",
    padding: "12px",
    borderRadius: "12px",
  },
  progressBarBg: {
    height: "6px",
    width: "100%",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 1s ease-in-out",
  },
  quickStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  quickStatCard: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  quickStatIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "4px",
  },
  quickStatLabel: { fontSize: "13px", color: "#94a3b8" },
  emptyState: {
    textAlign: "center",
    padding: "60px 40px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  emptyIcon: { fontSize: "64px", marginBottom: "20px" },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "15px",
    color: "#94a3b8",
    maxWidth: "400px",
    margin: "0 auto 30px",
    lineHeight: "1.6",
  },
  emptyBtn: {
    padding: "16px 32px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
  },
};

export default Dashboard;
