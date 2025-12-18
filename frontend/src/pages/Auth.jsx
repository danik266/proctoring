import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  
  // Состояние для всех полей твоей БД
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "student",
    school: "",
    className: "",
    consent_pdn: false
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? "http://localhost:3000/api/auth/login" : "http://localhost:3000/api/auth/register";
    
    try {
      const { data } = await axios.post(url, formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);
      
      alert("Успешно!");
      navigate("/dashboard");
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.message || "Ошибка соединения с сервером");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px", border: "1px solid #ddd" }}>
      <h2>{isLogin ? "Вход в систему" : "Регистрация"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {!isLogin && (
          <>
            <input name="full_name" placeholder="ФИО" onChange={handleChange} required />
            <input name="phone" placeholder="Телефон" onChange={handleChange} />
            <input name="school" placeholder="Школа" onChange={handleChange} />
            <input name="className" placeholder="Класс" onChange={handleChange} />
            <select name="role" onChange={handleChange}>
              <option value="student">Ученик</option>
              <option value="teacher">Учитель</option>
            </select>
            <label>
              <input type="checkbox" name="consent_pdn" onChange={handleChange} required />
              Согласие на обработку данных
            </label>
          </>
        )}

        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Пароль" onChange={handleChange} required />
        
        <button type="submit" style={{ padding: "10px", background: "#007bff", color: "#fff", border: "none" }}>
          {isLogin ? "Войти" : "Зарегистрироваться"}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: "10px", background: "none", border: "none", color: "blue", cursor: "pointer" }}>
        {isLogin ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
};

export default Auth;