import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; 

// === КОМПОНЕНТ КРАСИВОГО ВЫБОРА (DARK THEME) ===
const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedOption = options.find(o => o.name === value);

  return (
    <div className="custom-select-wrapper" ref={wrapperRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'val-selected' : 'val-placeholder'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg 
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', color: '#94a3b8' }}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <div className="custom-options-list">
            {options.length > 0 ? (
                options.map((opt) => (
                    <div 
                        key={opt.id || opt.name} 
                        className={`custom-option ${value === opt.name ? 'selected' : ''}`}
                        onClick={() => {
                            onChange(opt.name);
                            setIsOpen(false);
                        }}
                    >
                        {opt.name}
                    </div>
                ))
            ) : (
                <div className="custom-option no-data">Нет данных</div>
            )}
        </div>
      )}
    </div>
  );
};

// === ОСНОВНОЙ КОМПОНЕНТ AUTH ===
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [schools, setSchools] = useState([]);
  const [modal, setModal] = useState({ show: false, type: "error", title: "", message: "" });

  const [formData, setFormData] = useState({
    email: "", password: "", full_name: "", phone: "", role: "student", school: "", className: "", consent_pdn: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Имитация загрузки для примера, если бэкенд недоступен
    // В реальном проекте раскомментируй axios
    const fetchSchools = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/admin/schools"); 
        setSchools(data);
      } catch (err) {
        console.error("Ошибка загрузки школ:", err);
        // Fallback data для визуализации
        setSchools([{name: "Школа №1"}, {name: "Лицей №10"}, {name: "Гимназия №3"}]);
      }
    };
    fetchSchools();
  }, []);

  const handleChange = e => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    if (val === '') { setFormData({ ...formData, className: '' }); return; }
    if (/^\d+$/.test(val)) {
        const num = parseInt(val, 10);
        if (num >= 1 && num <= 13) {
            setFormData({ ...formData, className: val });
        }
    }
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
      const msg = err.response?.data?.message || "Ошибка подключения к серверу";
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
    <div className="page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body { margin: 0; padding: 0; overflow-x: hidden; }
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        
        /* === DARK SPACE BACKGROUND === */
        .page-wrapper {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          color: white;
        }

        /* Ambient Blobs Animation */
        .page-wrapper::before {
          content: ''; position: absolute; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
          top: -150px; right: -150px; animation: pulse 6s ease-in-out infinite; z-index: 1;
        }
        .page-wrapper::after {
          content: ''; position: absolute; width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
          bottom: -100px; left: -100px; animation: pulse 6s ease-in-out infinite 3s; z-index: 1;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .auth-content-center {
          flex: 1; display: flex; justify-content: center; align-items: center;
          padding: 20px; z-index: 10;
        }

        /* === GLASS CARD === */
        .auth-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          width: 100%; max-width: 440px;
          padding: 40px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: fadeInUp 0.6s ease-out;
        }

        .auth-header { text-align: center; margin-bottom: 32px; }
        
        .auth-title { 
            font-size: 28px; font-weight: 800; margin: 0 0 8px 0; 
            background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .auth-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }

        .form-group { margin-bottom: 16px; }
        
        /* === DARK INPUTS === */
        .input-field {
          width: 100%; padding: 14px 16px;
          background: rgba(15, 23, 42, 0.6); /* Dark Blue/Slate bg */
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 14px; color: #f8fafc;
          transition: all 0.3s ease;
          outline: none;
        }
        .input-field::placeholder { color: #64748b; }
        .input-field:focus { 
            border-color: #8b5cf6; 
            background: rgba(15, 23, 42, 0.8);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); 
        }

        /* Fix autofill background in Chrome */
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover, 
        .input-field:-webkit-autofill:focus {
            -webkit-text-fill-color: white;
            -webkit-box-shadow: 0 0 0px 1000px #1e1b4b inset;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* === CUSTOM SELECT (DARK) === */
        .custom-select-wrapper { position: relative; width: 100%; }
        .custom-select-trigger {
            width: 100%; padding: 14px 16px; 
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px; font-size: 14px; 
            display: flex; justify-content: space-between; align-items: center;
            cursor: pointer; transition: all 0.3s;
        }
        .custom-select-trigger:hover { border-color: rgba(255, 255, 255, 0.3); }
        .custom-select-trigger.open { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); }
        
        .val-placeholder { color: #64748b; }
        .val-selected { color: #f8fafc; font-weight: 500; }
        
        .custom-options-list {
            position: absolute; top: 110%; left: 0; right: 0;
            background: #1e1b4b; /* Deep Indigo */
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            max-height: 200px; overflow-y: auto; z-index: 100;
            padding: 6px; animation: slideDown 0.2s ease-out;
        }
        .custom-option {
            padding: 10px 12px; border-radius: 8px; font-size: 14px; color: #cbd5e1; cursor: pointer;
            transition: background 0.2s;
        }
        .custom-option:hover { background: rgba(139, 92, 246, 0.2); color: white; }
        .custom-option.selected { background: rgba(139, 92, 246, 0.3); color: #a5b4fc; font-weight: 600; }
        
        /* Scrollbar for select */
        .custom-options-list::-webkit-scrollbar { width: 6px; }
        .custom-options-list::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }

        /* === GRADIENT BUTTON === */
        .btn-primary {
          width: 100%; padding: 14px; 
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white; border: none; border-radius: 12px;
          font-size: 16px; font-weight: 600; cursor: pointer; 
          transition: all 0.3s ease; margin-top: 12px;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .btn-primary:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .toggle-text { text-align: center; margin-top: 24px; font-size: 14px; color: #94a3b8; }
        .toggle-link { 
            color: #a5b4fc; font-weight: 600; background: none; border: none; 
            cursor: pointer; padding: 0; margin-left: 6px; 
            transition: color 0.2s;
        }
        .toggle-link:hover { color: #c084fc; text-decoration: underline; }

        /* Checkbox customization */
        .checkbox-wrapper { display: flex; gap: 10px; align-items: start; margin-bottom: 20px; }
        .checkbox-wrapper input[type="checkbox"] {
            margin-top: 4px; accent-color: #8b5cf6; width: 16px; height: 16px;
        }
        .checkbox-text { font-size: 13px; color: #94a3b8; line-height: 1.4; }

        /* MODAL (Dark Theme) */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 12, 41, 0.7); backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center; z-index: 200;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: #1e293b; padding: 30px; border-radius: 20px; 
          width: 90%; max-width: 380px; text-align: center; 
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          animation: scaleUp 0.2s ease-out;
          color: white;
        }
        .modal-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; }
        .modal-icon.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .modal-icon.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        
        .modal-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: white; }
        .modal-msg { font-size: 15px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
        
        .modal-btn { width: 100%; padding: 12px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; font-size: 15px; transition: transform 0.2s; }
        .modal-btn:hover { transform: translateY(-2px); }
        .modal-btn.error { background: #ef4444; color: white; }
        .modal-btn.success { background: #22c55e; color: white; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <Navbar />

      {modal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === 'error' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              )}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-msg">{modal.message}</p>
            <button className={`modal-btn ${modal.type}`} onClick={closeModal}>Понятно</button>
          </div>
        </div>
      )}

      <div className="auth-content-center">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">{twoFA ? "Проверка 2FA" : isLogin ? "Войти в систему" : "Регистрация"}</h2>
            <p className="auth-subtitle">{twoFA ? "Введите код из Telegram" : isLogin ? "Добро пожаловать обратно" : "Начните подготовку к экзаменам"}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {twoFA ? (
              <div className="form-group">
                <input 
                    className="input-field" 
                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }} 
                    placeholder="• • • • •" 
                    value={twoFACode} 
                    onChange={e => setTwoFACode(e.target.value)} 
                    required autoFocus 
                />
              </div>
            ) : (
              <>
                {!isLogin && (
                  <>
                    <div className="form-group"><input className="input-field" name="full_name" placeholder="ФИО" onChange={handleChange} required /></div>
                    <div className="form-group"><input className="input-field" name="phone" placeholder="Телефон" onChange={handleChange} /></div>
                    
                    <div style={{display:'flex', gap:'12px'}}>
                      <div className="form-group" style={{flex:1}}>
                          <CustomSelect 
                              options={schools}
                              value={formData.school}
                              onChange={(val) => setFormData({...formData, school: val})}
                              placeholder="Выберите школу"
                          />
                          <input type="hidden" name="school" value={formData.school} required />
                      </div>

                      <div className="form-group" style={{width:'90px'}}>
                          <input 
                              className="input-field" 
                              name="className" 
                              placeholder="Класс" 
                              value={formData.className}
                              onChange={handleClassChange} 
                              inputMode="numeric"
                          />
                      </div>
                    </div>
                  </>
                )}
                <div className="form-group"><input className="input-field" type="email" name="email" placeholder="Email" onChange={handleChange} required /></div>
                <div className="form-group"><input className="input-field" type="password" name="password" placeholder="Пароль" onChange={handleChange} required /></div>
                
                {!isLogin && (
                  <div className="checkbox-wrapper">
                      <input type="checkbox" name="consent_pdn" id="consent" onChange={handleChange} required />
                      <label htmlFor="consent" className="checkbox-text">Я согласен на обработку персональных данных</label>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Загрузка..." : twoFA ? "Подтвердить" : isLogin ? "Войти" : "Создать аккаунт"}
            </button>

            {!twoFA && (
              <div className="toggle-text">
                {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                <button type="button" className="toggle-link" onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Создать" : "Войти"}</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;