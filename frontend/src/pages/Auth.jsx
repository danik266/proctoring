import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [modal, setModal] = useState({ show: false, type: "error", title: "", message: "" });

  const [formData, setFormData] = useState({
    email: "", password: "", full_name: "", phone: "", role: "student", school: "", className: "", consent_pdn: false
  });

  const navigate = useNavigate();

  const handleChange = e => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const closeModal = () => setModal({ ...modal, show: false });
  const showModal = (type, title, message) => setModal({ show: true, type, title, message });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      if (twoFA) {
        const { data } = await axios.post("http://localhost:5000/api/auth/verify-2fa", {
          twoFAToken, code: twoFACode
        });
        saveAuth(data);
        return;
      }

      const url = `http://localhost:5000/api/auth/${isLogin ? "login" : "register"}`;
      const { data } = await axios.post(url, formData);

      if (data.requires2FA) {
        setTwoFA(true);
        setTwoFAToken(data.twoFAToken);
        showModal("success", "Проверка безопасности", "Код подтверждения отправлен в Telegram.");
      } else {
        saveAuth(data);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Что-то пошло не так";
      showModal("error", "Ошибка", msg);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("user_id", data.user.id);
    navigate("/dashboard");
  };

  return (
    <div className="auth-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* 👇 ВОТ ЭТО УБИРАЕТ ПОЛОСКУ 👇 */
        body { margin: 0; padding: 0; overflow-x: hidden; }

        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%; /* Явно указываем ширину */
          background-color: #f3f4f6;
          background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.1) 0, transparent 50%);
          padding: 20px;
          overflow-x: hidden; /* Дополнительная страховка */
        }

        .auth-card {
          background: #ffffff;
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          z-index: 10;
        }

        .auth-header { text-align: center; margin-bottom: 32px; }
        .auth-title { font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
        .auth-subtitle { font-size: 14px; color: #6b7280; margin: 0; }

        .form-group { margin-bottom: 16px; }
        
        .input-field {
          width: 100%;
          padding: 14px 16px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          color: #1f2937;
          transition: all 0.2s;
          outline: none;
        }

        .input-field:focus { background: #fff; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

        .btn-primary {
          width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 12px;
          font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px;
        }
        .btn-primary:hover { background: #4338ca; }
        .btn-primary:disabled { background: #a5a3d4; cursor: not-allowed; }

        .toggle-text { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
        .toggle-link { color: #4f46e5; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; margin-left: 5px; }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center; z-index: 100;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 350px;
          text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: scaleUp 0.2s ease-out;
        }
        .modal-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; }
        .modal-icon.error { background: #fee2e2; color: #dc2626; }
        .modal-icon.success { background: #dcfce7; color: #16a34a; }
        .modal-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .modal-msg { font-size: 14px; color: #6b7280; margin-bottom: 24px; line-height: 1.5; }
        .modal-btn { width: 100%; padding: 12px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; font-size: 14px; }
        .modal-btn.error { background: #dc2626; color: white; }
        .modal-btn.success { background: #16a34a; color: white; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* MODAL */}
      {modal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === 'error' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              )}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-msg">{modal.message}</p>
            <button className={`modal-btn ${modal.type}`} onClick={closeModal}>Понятно</button>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{twoFA ? "Проверка 2FA" : isLogin ? "Вход" : "Регистрация"}</h2>
          <p className="auth-subtitle">{twoFA ? "Введите код из Telegram" : "Добро пожаловать в систему"}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {twoFA ? (
            <div className="form-group">
              <input className="input-field" style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }} placeholder="• • • • •" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} required autoFocus />
            </div>
          ) : (
            <>
              {!isLogin && (
                <>
                  <div className="form-group"><input className="input-field" name="full_name" placeholder="ФИО" onChange={handleChange} required /></div>
                  <div className="form-group"><input className="input-field" name="phone" placeholder="Телефон" onChange={handleChange} /></div>
                  <div style={{display:'flex', gap:'10px'}}>
                    <div className="form-group" style={{flex:1}}><input className="input-field" name="school" placeholder="Школа" onChange={handleChange} /></div>
                    <div className="form-group" style={{width:'80px'}}><input className="input-field" name="className" placeholder="Класс" onChange={handleChange} /></div>
                  </div>
                </>
              )}
              <div className="form-group"><input className="input-field" type="email" name="email" placeholder="Email" onChange={handleChange} required /></div>
              <div className="form-group"><input className="input-field" type="password" name="password" placeholder="Пароль" onChange={handleChange} required /></div>
              {!isLogin && (
                 <div style={{display:'flex', gap:'8px', alignItems:'start', marginBottom:'16px'}}>
                    <input type="checkbox" name="consent_pdn" style={{marginTop:'4px'}} onChange={handleChange} required />
                    <span style={{fontSize:'13px', color:'#4b5563'}}>Согласен на обработку данных</span>
                 </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Загрузка..." : twoFA ? "Подтвердить" : isLogin ? "Войти" : "Создать аккаунт"}
          </button>

          {!twoFA && (
            <div className="toggle-text">
              {isLogin ? "Нет аккаунта?" : "Есть аккаунт?"}
              <button type="button" className="toggle-link" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Создать" : "Войти"}</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;