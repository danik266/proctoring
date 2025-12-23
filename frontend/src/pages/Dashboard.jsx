import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

import EntPage from "./Ent";
import ModoPage from "./Modo";
import PisaPage from "./Pisa";

const Dashboard = () => {
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
        toast.error(t("toast_load_err"));
      });
  }, [userId, t]);

  // --- ЛОГИКА СТАРТА ТЕСТА ---
  const handleStartTest = async (testId, isFinished) => {
    if (isFinished) {
      toast(t("toast_finished"), { icon: "✅" });
      return;
    }

    const loadingToast = toast.loading(t("toast_prep"));
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

        toast.success(t("toast_started"));

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

  const getLocaleDate = () => {
    const locales = { RU: "ru-RU", KZ: "kk-KZ", EN: "en-US" };
    return new Date().toLocaleDateString(locales[language] || "ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div style={styles.loaderContainer}>
        <GlobalStyles />
        <div style={styles.loaderSpinner}></div>
        <p style={styles.loaderText}>{t("dash_loading")}</p>
      </div>
    );
  }

  const { user, tests } = data;
  const userName = user?.full_name || "Guest";
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

        const renderTestSection = (title, list) => {
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
                {renderTestSection("ENT", entTests)}
                {renderTestSection("MODO", modoTests)}
                {renderTestSection("PISA", pisaTests)}
                {renderTestSection(t("other_tests"), otherTests)}
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📝</div>
                <h4 style={styles.emptyTitle}>{t("empty_title")}</h4>
                <p style={styles.emptyText}>{t("empty_text")}</p>
                <button
                  style={styles.btnPrimary}
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
            <div style={styles.hero}>
              <div style={styles.heroContent}>
                <div style={styles.heroBadge}>{t("hero_badge")}</div>
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
                <div style={styles.heroVisualCard}>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#ef4444",
                      }}
                    ></div>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                      }}
                    ></div>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#10b981",
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      width: "60%",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      marginBottom: "10px",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "8px",
                      width: "80%",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      marginBottom: "20px",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "40px",
                      width: "100%",
                      background: "#eef2ff",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6366f1",
                      fontWeight: "700",
                    }}
                  >
                    Start Test
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.quickStats}>
              <QuickStat
                count={tests?.filter((t) => t.end_time).length || 0}
                label={t("stat_finished")}
                icon={
                  <>
                    <path
                      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="22 4 12 14.01 9 11.01"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                }
                color="var(--primary)"
              />
              <QuickStat
                count={
                  tests?.filter((t) => t.start_time && !t.end_time).length || 0
                }
                label={t("stat_in_progress")}
                icon={
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </>
                }
                color="#f59e0b"
              />
              <QuickStat
                count={tests?.filter((t) => !t.start_time).length || 0}
                label={t("stat_waiting")}
                icon={
                  <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </>
                }
                color="#64748b"
              />
            </div>

            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>{t("cat_select")}</h3>
              <p style={styles.sectionSubtitle}>{t("cat_sub")}</p>
            </div>
            <div style={styles.grid}>
              <CategoryCard
                title="ENT"
                description={t("cat_ent_desc")}
                icon="🎓"
                color="indigo"
                onClick={() => setActiveTab("ent")}
              />
              <CategoryCard
                title="MODO"
                description={t("cat_modo_desc")}
                icon="📊"
                color="emerald"
                onClick={() => setActiveTab("modo")}
              />
              <CategoryCard
                title="PISA"
                description={t("cat_pisa_desc")}
                icon="🌍"
                color="orange"
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
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#0f172a",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
          <div style={{ height: "20px" }}></div>
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
              icon="🎓"
              label="ENT"
              active={activeTab === "ent"}
              onClick={() => setActiveTab("ent")}
              collapsed={sidebarCollapsed}
              isEmoji
            />
            <NavItem
              icon="📊"
              label="MODO"
              active={activeTab === "modo"}
              onClick={() => setActiveTab("modo")}
              collapsed={sidebarCollapsed}
              isEmoji
            />
            <NavItem
              icon="🌍"
              label="PISA"
              active={activeTab === "pisa"}
              onClick={() => setActiveTab("pisa")}
              collapsed={sidebarCollapsed}
              isEmoji
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

          {/* USER CARD BUTTON */}
          <div
            style={styles.userCard}
            onClick={() => navigate("/profile")}
            className="user-card-btn"
          >
            <div style={styles.avatar}>{userName[0] || "?"}</div>
            {!sidebarCollapsed && (
              <div style={styles.userInfo}>
                <p style={styles.userName} className="user-name">
                  {userName}
                </p>
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

const TestCard = ({ test, onStart, t }) => {
  const isFinished = !!test.end_time;
  const isStarted = !!test.start_time && !test.end_time;
  const score = test.score || 0;
  const total = test.total_questions || test.max_score || 20;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const statusColor = isFinished
    ? "#10b981"
    : isStarted
    ? "#f59e0b"
    : "#6366f1";
  const statusBg = isFinished ? "#ecfdf5" : isStarted ? "#fffbeb" : "#eef2ff";

  return (
    <div style={styles.testCardWrapper} className="hover-card">
      <div style={styles.cardHeader}>
        <div
          style={{
            ...styles.cardIconBox,
            color: statusColor,
            background: statusBg,
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isFinished ? "✅" : isStarted ? "⏳" : "📚"}
        </div>
        <div
          style={{
            ...styles.statusBadge,
            color: statusColor,
            background: statusBg,
          }}
        >
          {isFinished
            ? t("card_status_done")
            : isStarted
            ? t("card_status_process")
            : t("card_status_wait")}
        </div>
      </div>
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
        }}
      >
        <h4 style={styles.cardTitle}>{test.name}</h4>
        <p style={styles.cardSubject}>{test.subject}</p>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "auto" }}>
          {test.category}
        </p>
        {isFinished && (
          <div style={styles.resultBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "var(--secondary)" }}>
                Баллы: {score}/{total}
              </span>
              <span style={{ fontWeight: "700", color: statusColor }}>
                {percentage}%
              </span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${percentage}%`,
                  background: statusColor,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => onStart(test.id, isFinished)}
        style={styles.cardBtnBottom}
      >
        {isFinished
          ? t("btn_result")
          : isStarted
          ? t("btn_continue")
          : t("btn_start")}
      </button>
    </div>
  );
};

const CategoryCard = ({ title, description, icon, color, onClick }) => {
  const colors = {
    indigo: { bg: "#eef2ff", text: "#6366f1" },
    emerald: { bg: "#d1fae5", text: "#10b981" },
    orange: { bg: "#ffedd5", text: "#f97316" },
  };
  const theme = colors[color] || colors.indigo;
  return (
    <div className="card-hover" onClick={onClick} style={styles.categoryCard}>
      <div
        style={{ ...styles.catIcon, background: theme.bg, color: theme.text }}
      >
        {icon}
      </div>
      <div style={{ flexGrow: 1 }}>
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
};

const QuickStat = ({ count, label, color, icon }) => (
  <div style={styles.quickStatCard}>
    <div style={{ ...styles.quickStatIcon, color: color }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
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

const NavItem = ({ icon, label, active, onClick, collapsed, isEmoji }) => (
  <div
    onClick={onClick}
    className={`nav-item ${active ? "active" : ""}`}
    style={{
      ...styles.navItem,
      background: active ? "#eef2ff" : "transparent",
      color: active ? "#6366f1" : "#64748b",
    }}
  >
    <span style={{ ...styles.navIcon, fontSize: isEmoji ? "18px" : "inherit" }}>
      {icon}
    </span>
    {!collapsed && <span style={styles.navLabel}>{label}</span>}
  </div>
);

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :root { --primary: #6366f1; --secondary: #64748b; --bg-color: #f8fafc; --text-main: #0f172a; --border: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background-color: var(--bg-color); background-image: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 40px 40px; color: var(--text-main); min-height: 100vh; overflow-x: hidden; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border-color: var(--primary); }
    .nav-item { cursor: pointer; transition: all 0.2s ease; }
    .nav-item:hover { background: #f1f5f9 !important; color: var(--text-main) !important; }
    .nav-item.active:hover { background: #eef2ff !important; color: var(--primary) !important; }
    
    /* Стили для кнопки профиля */
    .user-card-btn { cursor: pointer; transition: all 0.2s ease; }
    .user-card-btn:hover { background: #e0e7ff !important; border-color: #6366f1 !important; }
    .user-card-btn:hover .user-name { color: #4f46e5; }
    
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `}</style>
);

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f8fafc",
  },
  loaderSpinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loaderText: { color: "#64748b", fontSize: "16px", fontWeight: "600" },
  sidebar: {
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    height: "100vh",
    position: "sticky",
    top: 0,
    transition: "width 0.3s ease",
    zIndex: 50,
    flexShrink: 0,
  },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    flexShrink: 0,
  },
  navLabel: { whiteSpace: "nowrap" },
  divider: { margin: "20px 0 10px 14px" },
  dividerText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: "12px" },
  collapseBtn: {
    width: "100%",
    padding: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#64748b",
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
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#e0e7ff",
    color: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    flexShrink: 0,
  },
  userInfo: { overflow: "hidden" },
  userName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userRole: { fontSize: "12px", color: "#64748b", marginTop: "1px" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    background: "#fff",
    border: "1px solid #fee2e2",
    borderRadius: "10px",
    color: "#ef4444",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: "30px 40px",
    height: "100vh",
    overflowY: "auto",
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
    color: "#0f172a",
    marginBottom: "8px",
    letterSpacing: "-1px",
  },
  pageSubtitle: { color: "#64748b", fontSize: "16px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#475569",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  hero: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "40px 50px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    flexWrap: "wrap",
    gap: "30px",
  },
  heroContent: { maxWidth: "500px", minWidth: "300px" },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    padding: "6px 14px",
    borderRadius: "50px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  heroTitle: {
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "16px",
    lineHeight: "1.2",
    color: "#0f172a",
    letterSpacing: "-1px",
  },
  heroText: {
    fontSize: "16px",
    color: "#64748b",
    lineHeight: "1.6",
    marginBottom: "30px",
  },
  heroStats: { display: "flex", alignItems: "center", gap: "30px" },
  heroStat: { textAlign: "left" },
  heroStatNumber: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    display: "block",
  },
  heroStatLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroStatDivider: { width: "1px", height: "40px", background: "#e2e8f0" },
  heroVisual: { position: "relative", width: "240px" },
  heroVisualCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
    transform: "rotate(-3deg)",
  },
  sectionHeader: { marginBottom: "24px", marginTop: "10px" },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  sectionSubtitle: { fontSize: "16px", color: "#64748b" },
  countBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#64748b",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginLeft: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
    width: "100%",
    alignItems: "stretch",
  },
  categoryCard: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minHeight: "220px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    height: "100%",
  },
  catIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    flexShrink: 0,
  },
  catTitle: {
    fontSize: "24px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    color: "#0f172a",
  },
  catDescription: { fontSize: "14px", color: "#64748b", lineHeight: "1.5" },
  catArrow: {
    position: "absolute",
    bottom: "30px",
    right: "30px",
    width: "40px",
    height: "40px",
    background: "#f8fafc",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    border: "1px solid #e2e8f0",
  },
  testCardWrapper: {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    height: "100%",
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },
  cardSubject: { fontSize: "14px", color: "#64748b", marginBottom: "4px" },
  resultBox: {
    marginTop: "10px",
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  progressBarBg: {
    height: "6px",
    width: "100%",
    background: "#e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 1s ease-in-out",
  },
  cardBtnBottom: {
    width: "100%",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "var(--primary)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    marginTop: "auto",
  },
  quickStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  quickStatCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  quickStatIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: "1.2",
  },
  quickStatLabel: { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  emptyState: {
    textAlign: "center",
    padding: "60px 40px",
    background: "#fff",
    borderRadius: "24px",
    border: "1px solid #e2e8f0",
  },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "15px",
    color: "#64748b",
    maxWidth: "400px",
    margin: "0 auto 24px",
    lineHeight: "1.6",
  },
  btnPrimary: {
    padding: "14px 28px",
    borderRadius: "12px",
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
};

export default Dashboard;
