import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");

  const { language, changeLanguage, t } = useLanguage();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const languages = [
    { code: "KZ", label: "Қазақша" },
    { code: "RU", label: "Русский" },
    { code: "EN", label: "English" },
  ];

  const handleLangSelect = (code) => {
    changeLanguage(code);
    setLangMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Проверяем, находимся ли мы на странице авторизации
  const isAuthPage = location.pathname === "/auth";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
    window.location.reload();
  };

  const activeLabel =
    languages.find((l) => l.code === language)?.label || "Русский";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .nav-btn { transition: all 0.2s ease; font-family: 'Plus Jakarta Sans', sans-serif; }
        .nav-btn:hover { color: #6366f1 !important; background: #eef2ff !important; }
        .login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4) !important; background: #4f46e5 !important; }
        .logout-btn:hover { background: #fef2f2 !important; border-color: #ef4444 !important; color: #dc2626 !important; transform: translateY(-1px); }
        .logo-container:hover .logo-icon { transform: rotate(10deg); }
        .lang-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 8px; border: 1px solid transparent; background: transparent; cursor: pointer; transition: all 0.2s ease; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #475569; font-size: 14px; }
        .lang-btn:hover, .lang-btn.open { background: #f1f5f9; color: #0f172a; }
        .chevron { transition: transform 0.2s ease; font-size: 10px; opacity: 0.6; margin-top: 1px; }
        .lang-btn.open .chevron { transform: rotate(180deg); }
        .lang-dropdown { position: absolute; top: 120%; right: 0; min-width: 140px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); padding: 6px; display: flex; flex-direction: column; gap: 2px; z-index: 1001; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .lang-item { display: flex; align-items: center; padding: 10px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; color: #334155; font-family: 'Plus Jakarta Sans', sans-serif; }
        .lang-item:hover { background: #eef2ff; color: #6366f1; }
        .lang-item.active { background: #e0e7ff; color: #4338ca; font-weight: 600; }
        .profile-btn-content { display: flex; align-items: center; gap: 8px; }
      `}</style>

      <nav style={navStyles.navbar}>
        {/* LOGO */}
        <div
          style={navStyles.logo}
          className="logo-container"
          onClick={() => navigate("/")}
        >
          <div style={navStyles.logoIcon} className="logo-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={navStyles.logoText}>
            JANA <span style={{ color: "#6366f1" }}>TEST</span>
          </span>
        </div>

        {/* LINKS */}
        <div style={navStyles.links}>
          <button
            className="nav-btn"
            style={navStyles.navItem}
            onClick={() => navigate("/")}
          >
            {t("nav_home")}
          </button>

          {/* ЯЗЫКОВОЙ ПЕРЕКЛЮЧАТЕЛЬ */}
          <div style={{ position: "relative" }} ref={langMenuRef}>
            <button
              className={`lang-btn ${langMenuOpen ? "open" : ""}`}
              onClick={() => setLangMenuOpen(!langMenuOpen)}
            >
              <span>{activeLabel}</span>
              <span className="chevron">▼</span>
            </button>

            {langMenuOpen && (
              <div className="lang-dropdown">
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className={`lang-item ${
                      language === lang.code ? "active" : ""
                    }`}
                    onClick={() => handleLangSelect(lang.code)}
                  >
                    <span>{lang.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              width: "1px",
              height: "24px",
              background: "#e2e8f0",
              margin: "0 4px",
            }}
          ></div>

          {isAuthenticated ? (
            <>
              {/* --- ИЗМЕНЕНИЕ: Добавлена проверка !isAuthPage перед кнопкой тестов --- */}
              {!isAuthPage && (
                <button
                  className="nav-btn"
                  style={navStyles.navItem}
                  onClick={() => navigate("/profile")}
                >
                  <div className="profile-btn-content">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {t("nav_profile") || "Кабинет"}
                  </div>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="logout-btn"
                style={navStyles.logout}
              >
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              {!isAuthPage && (
                <button
                  onClick={() => navigate("/auth")}
                  className="login-btn"
                  style={navStyles.login}
                >
                  {t("nav_login")}
                </button>
              )}
            </>
          )}
        </div>
      </nav>
    </>
  );
};

const navStyles = {
  navbar: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  logoIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.3s ease",
  },
  logoText: {
    fontWeight: "800",
    fontSize: "20px",
    letterSpacing: "-0.5px",
    color: "#0f172a",
  },
  links: { display: "flex", gap: "8px", alignItems: "center" },
  navItem: {
    background: "transparent",
    border: "none",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "14px",
    padding: "8px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  login: {
    display: "flex",
    alignItems: "center",
    padding: "10px 24px",
    borderRadius: "10px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
    transition: "all 0.2s ease",
    marginLeft: "6px",
  },
  logout: {
    padding: "9px 20px",
    borderRadius: "10px",
    border: "1px solid #6366f1",
    color: "#fff",
    background: "#6366f1",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginLeft: "6px",
  },
};

export default Navbar;
