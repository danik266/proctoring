import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  // Проверяем авторизацию по токену
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear(); // Очищаем всё: токен, роль, ответы
    navigate("/auth");
    window.location.reload(); // Перезагружаем для сброса состояния App
  };

  return (
    <nav style={navStyles.navbar}>
      <div style={navStyles.logo} onClick={() => navigate("/")}>
        <span style={{ color: "#3b82f6" }}>JANA</span> PROCTOR
      </div>
      
      <div style={navStyles.links}>
        <button style={navStyles.navItem} onClick={() => navigate("/")}>
          Главная
        </button>
        
        {isAuthenticated ? (
          <>
            <button style={navStyles.navItem} onClick={() => navigate("/dashboard")}>
              Мои тесты
            </button>
            <button onClick={handleLogout} style={navStyles.logout}>
              Выйти
            </button>
          </>
        ) : (
          <button onClick={() => navigate("/auth")} style={navStyles.login}>
            Войти
          </button>
        )}
      </div>
    </nav>
  );
};

const navStyles = {
  navbar: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "15px 60px", 
    background: "rgba(255,255,255,0.9)", 
    backdropFilter: "blur(10px)", 
    borderBottom: "1px solid #e2e8f0", 
    position: "sticky", 
    top: 0, 
    zIndex: 1000,
    fontFamily: "'Inter', sans-serif"
  },
  logo: { 
    fontWeight: "900", 
    fontSize: "22px", 
    cursor: "pointer", 
    letterSpacing: "-1px",
    color: "#1e293b"
  },
  links: { 
    display: "flex", 
    gap: "25px", 
    alignItems: "center" 
  },
  navItem: { 
    background: "none", 
    border: "none", 
    fontWeight: "600", 
    color: "#64748b", 
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s"
  },
  login: { 
    padding: "10px 24px", 
    borderRadius: "12px", 
    background: "#3b82f6", 
    color: "#fff", 
    border: "none", 
    fontWeight: "700", 
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
  },
  logout: { 
    padding: "10px 24px", 
    borderRadius: "12px", 
    border: "1px solid #ef4444", 
    color: "#ef4444", 
    background: "none", 
    fontWeight: "700", 
    cursor: "pointer" 
  }
};

// ОБЯЗАТЕЛЬНО:
export default Navbar;