import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "student",
    school: "",
    className: "",
    consent_pdn: false,
  });

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // ОСНОВНАЯ ФУНКЦИЯ ОТПРАВКИ
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = `http://localhost:5000/api/auth/${
      isLogin ? "login" : "register"
    }`;

    try {
      const { data } = await axios.post(url, formData);

      // 1. Сохраняем токен и роль
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);

      // 2. ДОБАВЛЯЕМ СОХРАНЕНИЕ ID (Чтобы логи QADAM работали)
      if (data.user && data.user.id) {
        localStorage.setItem("user_id", data.user.id);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      alert(err.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    // ... (весь твой JSX без изменений, так как он вызывает handleSubmit)
    <div style={authStyles.container}>
      <div style={authStyles.card}>
        <h2 style={authStyles.title}>
          {isLogin ? "С возвращением" : "Создать аккаунт"}
        </h2>
        <p style={authStyles.subtitle}>
          {isLogin
            ? "Войдите в систему для доступа к тестам"
            : "Заполните данные для регистрации"}
        </p>

        <form onSubmit={handleSubmit} style={authStyles.form}>
          {!isLogin && (
            <>
              <input
                style={authStyles.input}
                name="full_name"
                placeholder="Полное имя"
                onChange={handleChange}
                required
              />
              <input
                style={authStyles.input}
                name="phone"
                placeholder="Телефон"
                onChange={handleChange}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <input
                  style={authStyles.input}
                  name="school"
                  placeholder="Школа"
                  onChange={handleChange}
                />
                <input
                  style={authStyles.input}
                  name="className"
                  placeholder="Класс"
                  onChange={handleChange}
                />
              </div>
            </>
          )}
          <input
            style={authStyles.input}
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            style={authStyles.input}
            name="password"
            type="password"
            placeholder="Пароль"
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <label style={authStyles.checkboxLabel}>
              <input
                type="checkbox"
                name="consent_pdn"
                onChange={handleChange}
                required
              />
              <span>Согласен на обработку данных</span>
            </label>
          )}

          <button type="submit" style={authStyles.submitBtn}>
            {isLogin ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          style={authStyles.switchBtn}
        >
          {isLogin
            ? "Ещё нет аккаунта? Зарегистрируйтесь"
            : "Уже есть аккаунт? Войдите"}
        </button>
      </div>
    </div>
  );
};

const authStyles = {
  container: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    maxWidth: "450px",
    width: "100%",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: "8px",
  },
  subtitle: { color: "#64748b", marginBottom: "32px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: {
    width: "100%", // ← важно
    boxSizing: "border-box", // ← важно
    padding: "14px 18px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "16px",
    outline: "none",
    transition: "0.2s",
    color: "#000",
    backgroundColor: "#fff",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#64748b",
    textAlign: "left",
    marginTop: "5px",
  },
  submitBtn: {
    padding: "16px",
    borderRadius: "12px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
  },
  switchBtn: {
    marginTop: "20px",
    background: "none",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Auth;
