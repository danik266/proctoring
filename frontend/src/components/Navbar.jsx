import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [isOpen, setIsOpen] = useState(false);

=======
>>>>>>> 659d6b2ad56cd53c65df28b33af99d5c5a9e4096
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
    window.location.reload();
  };

  return (
    <>
      <style>{`
        /* --- CSS --- */
        .nav-links {
          display: flex;
          gap: 25px;
          align-items: center;
        }
        .hamburger {
          display: none;
          font-size: 26px; /* Чуть крупнее */
          cursor: pointer;
          background: none;
          border: none;
          color: #1e293b;
          padding: 5px;
        }

        /* МОБИЛЬНАЯ ВЕРСИЯ */
        @media (max-width: 768px) {
          .navbar-container {
            padding: 15px 20px !important;
          }
          
          .hamburger {
            display: block;
            margin-left: auto; /* <--- ЭТО ПРИЖИМАЕТ КНОПКУ ВПРАВО */
          }

          .nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            padding: 20px 0;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15); /* Тень посильнее */
            border-bottom: 1px solid #e2e8f0;
            z-index: 9999; /* <--- ЧТОБЫ БЫЛО ПОВЕРХ ВСЕГО */
          }

          .nav-links.open {
            display: flex;
          }

          .nav-item-mobile {
            width: 90%;
            padding: 15px;
            font-size: 16px;
            text-align: center;
            border-bottom: 1px solid #f1f5f9; /* Разделители между пунктами */
          }
          .nav-item-mobile:last-child {
            border-bottom: none;
          }
        }
      `}</style>

      <nav style={navStyles.navbar} className="navbar-container">
        {/* Логотип */}
        <div style={navStyles.logo} onClick={() => navigate("/")}>
          <span style={{ color: "#3b82f6" }}>JANA</span> PROCTOR
        </div>

        {/* Гамбургер */}
        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "✕" : "☰"}
        </button>

        {/* Меню ссылок */}
        <div className={`nav-links ${isOpen ? "open" : ""}`}>
          <button
            style={navStyles.navItem}
            className="nav-item-mobile"
            onClick={() => {
              navigate("/");
              setIsOpen(false);
            }}
          >
            Главная
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              style={navStyles.logout}
              className="nav-item-mobile"
            >
              Выйти
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/auth");
                setIsOpen(false);
              }}
              style={navStyles.login}
              className="nav-item-mobile"
            >
              Войти
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

const navStyles = {
<<<<<<< HEAD
  navbar: {
    display: "flex",
    justifyContent: "space-between", // Распределяет Лого слева, Гамбургер справа
    alignItems: "center",
    padding: "15px 60px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 9999, // <--- ОЧЕНЬ ВАЖНО: Самый высокий приоритет слоя
    fontFamily: "'Inter', sans-serif",
    width: "100%", // Гарантирует ширину
    boxSizing: "border-box", // Чтобы padding не ломал ширину
=======
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
    fontFamily: "'Inter', sans-serif",
    // 👇 ВОТ ЭТИ ДВЕ СТРОКИ РЕШАЮТ ПРОБЛЕМУ 👇
    width: "100%", 
    boxSizing: "border-box" 
>>>>>>> 659d6b2ad56cd53c65df28b33af99d5c5a9e4096
  },
  logo: {
    fontWeight: "900",
    fontSize: "22px",
    cursor: "pointer",
    letterSpacing: "-1px",
    color: "#1e293b",
    zIndex: 10000, // Логотип поверх всего
  },
  navItem: {
    background: "none",
    border: "none",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s",
  },
  login: {
    padding: "10px 24px",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  logout: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "1px solid #ef4444",
    color: "#ef4444",
    background: "none",
    fontWeight: "700",
    cursor: "pointer",
  },
};

<<<<<<< HEAD
export default Navbar;
=======
export default Navbar;
>>>>>>> 659d6b2ad56cd53c65df28b33af99d5c5a9e4096
