import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  // Проверяем наличие токена для отображения кнопок
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token"); // Удаляем токен
    navigate("/auth"); // Перекидываем на логин
    window.location.reload(); // Перезагружаем, чтобы App.jsx обновил состояние
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.linkBold}>PROCTORING SYSTEM</Link>
      </div>
      
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Главная</Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={styles.link}>Мои тесты</Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>Выйти</button>
          </>
        ) : (
          <Link to="/auth" style={styles.loginBtn}>Войти</Link>
        )}
      </div>
    </nav>
  );
};

// Простые стили прямо в файле для быстрой проверки
const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#222",
    color: "white",
    marginBottom: "20px"
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  link: {
    color: "white",
    textDecoration: "none"
  },
  linkBold: {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "1.2rem"
  },
  loginBtn: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "8px 16px",
    borderRadius: "4px",
    textDecoration: "none"
  },
  logoutBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer"
  }
};

export default Navbar;