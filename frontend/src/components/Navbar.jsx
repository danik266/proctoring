import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        /* Анимация ссылок меню */
        .nav-btn { 
            transition: all 0.2s ease; 
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .nav-btn:hover { 
            color: #6366f1 !important; 
            background: #eef2ff !important;
        }
        
        /* Кнопка Войти */
        .login-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4) !important; 
            background: #4f46e5 !important;
        }
        
        /* Кнопка Выйти */
        .logout-btn:hover { 
            background: #fef2f2 !important; 
            border-color: #ef4444 !important; 
            color: #dc2626 !important;
            transform: translateY(-1px);
        }
        
        /* Логотип */
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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
            Главная
          </button>
          
          {isAuthenticated ? (
            /* ЕСЛИ ВОШЕЛ */
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
               {!isAuthPage && (
                  <button 
                    onClick={() => navigate("/auth")} 
                    className="login-btn"
                    style={navStyles.login}
                  >
                    Войти
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
    display: "flex",                 // Вернул flex
    justifyContent: "space-between", // Вернул разброс по краям
    alignItems: "center", 
    padding: "15px 40px",            // Вернул отступы по бокам
    background: "rgba(255, 255, 255, 0.8)", 
    backdropFilter: "blur(12px)", 
    borderBottom: "1px solid #e2e8f0", 
    position: "sticky", 
    top: 0, 
    zIndex: 1000,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box",         // Важно, чтобы padding не ломал ширину
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
    transition: "transform 0.3s ease"
  },
  logoText: {
    fontWeight: "800", 
    fontSize: "20px", 
    letterSpacing: "-0.5px",
    color: "#0f172a", 
  },
  links: { 
    display: "flex", 
    gap: "12px", 
    alignItems: "center" 
  },
  navItem: { 
    background: "transparent", 
    border: "none", 
    fontWeight: "600", 
    color: "#64748b", 
    cursor: "pointer",
    fontSize: "14px",
    padding: "8px 16px",
    borderRadius: "8px",
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
    marginLeft: "10px",
  },
  logout: { 
    padding: "9px 20px", 
    borderRadius: "10px", 
    border: "1px solid #fee2e2", 
    color: "#ef4444", 
    background: "#fff", 
    fontWeight: "600", 
    fontSize: "14px", 
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginLeft: "10px",
  }
};

export default Navbar;