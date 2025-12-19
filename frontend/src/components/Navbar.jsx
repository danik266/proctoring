import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 👇 Хук чтобы знать где мы
  const isAuthenticated = !!localStorage.getItem("token");

  // Проверка: мы на странице авторизации?
  const isAuthPage = location.pathname === "/auth";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
    window.location.reload();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .nav-btn { transition: all 0.3s ease; }
        .nav-btn:hover { transform: translateY(-2px); text-shadow: 0 0 8px rgba(255,255,255,0.5); }
        
        .login-btn:hover { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6) !important; transform: translateY(-2px); }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.15) !important; border-color: #ef4444 !important; }
        
        .logo-container:hover .logo-icon { transform: rotate(10deg); }
      `}</style>

      <nav style={navStyles.navbar}>
        {/* LOGO */}
        <div 
            style={navStyles.logo} 
            className="logo-container"
            onClick={() => navigate("/")}
        >
          <div style={navStyles.logoIcon} className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={navStyles.logoText}>
            JANA <span style={{ color: "#a5b4fc", fontWeight: "400" }}>TEST</span>
          </span>
        </div>
        
        {/* LINKS */}
        <div style={navStyles.links}>
          {/* Кнопка Главная всегда видна */}
          <button 
            className="nav-btn"
            style={navStyles.navItem} 
            onClick={() => navigate("/")}
          >
            Главная
          </button>
          
          {isAuthenticated ? (
            /* ЕСЛИ ВОШЕЛ: показываем Дашборд и Выход */
            <>
              <button 
                className="nav-btn"
                style={navStyles.navItem} 
                onClick={() => navigate("/dashboard")}
              >
                Мои тесты
              </button>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
                style={navStyles.logout}
              >
                Выйти
              </button>
            </>
          ) : (
            /* ЕСЛИ НЕ ВОШЕЛ */
            <>
               {/* Показываем кнопку "Войти" ТОЛЬКО если мы НЕ на странице авторизации */}
               {!isAuthPage && (
                  <button 
                    onClick={() => navigate("/auth")} 
                    className="login-btn"
                    style={navStyles.login}
                  >
                    Войти
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft: '8px'}}>
                       <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                       <polyline points="10 17 15 12 10 7"/>
                       <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
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
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "15px 60px", 
    background: "rgba(15, 12, 41, 0.7)", 
    backdropFilter: "blur(20px)", 
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)", 
    position: "sticky", 
    top: 0, 
    zIndex: 1000,
    fontFamily: "'Inter', sans-serif",
    width: "100%", 
    boxSizing: "border-box",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  },
  logo: { 
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer", 
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
    transition: "transform 0.3s ease"
  },
  logoText: {
    fontWeight: "800", 
    fontSize: "20px", 
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  links: { 
    display: "flex", 
    gap: "30px", 
    alignItems: "center" 
  },
  navItem: { 
    background: "none", 
    border: "none", 
    fontWeight: "600", 
    color: "#cbd5e1", 
    cursor: "pointer",
    fontSize: "14px",
    letterSpacing: "0.5px",
  },
  login: { 
    display: "flex",
    alignItems: "center",
    padding: "10px 24px", 
    borderRadius: "12px", 
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", 
    color: "#fff", 
    border: "none", 
    fontWeight: "700", 
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
    transition: "all 0.3s ease",
  },
  logout: { 
    padding: "9px 24px", 
    borderRadius: "12px", 
    border: "1px solid rgba(239, 68, 68, 0.5)", 
    color: "#ef4444", 
    background: "rgba(239, 68, 68, 0.05)", 
    fontWeight: "600", 
    fontSize: "14px", 
    cursor: "pointer",
    transition: "all 0.3s ease",
  }
};

export default Navbar;