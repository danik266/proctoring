import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";

// === КОМПОНЕНТ КРАСИВОГО ВЫБОРА ===
const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  noDataMessage,
}) => {
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

  const selectedOption = options.find((o) => o.name === value);

  return (
    <div className="custom-select-wrapper" ref={wrapperRef}>
      <div
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "val-selected" : "val-placeholder"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "0.2s",
            color: "#64748b",
          }}
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
                className={`custom-option ${
                  value === opt.name ? "selected" : ""
                }`}
                onClick={() => {
                  onChange(opt.name);
                  setIsOpen(false);
                }}
              >
                {opt.name}
              </div>
            ))
          ) : (
            <div className="custom-option no-data">{noDataMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

// === ОСНОВНОЙ КОМПОНЕНТ AUTH ===
const Auth = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [loading, setLoading] = useState(false);

  const [schools, setSchools] = useState([]);
  const [modal, setModal] = useState({
    show: false,
    type: "error",
    title: "",
    message: "",
  });

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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/admin/schools"
        );
        setSchools(data);
      } catch (err) {
        console.error("Ошибка загрузки школ:", err);
        setSchools([
          { name: "Школа №1" },
          { name: "Лицей №10" },
          { name: "Гимназия №3" },
        ]);
      }
    };
    fetchSchools();
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setFormData({ ...formData, className: "" });
      return;
    }
    if (/^\d+$/.test(val)) {
      const num = parseInt(val, 10);
      if (num >= 1 && num <= 13) {
        setFormData({ ...formData, className: val });
      }
    }
  };

  const closeModal = () => setModal({ ...modal, show: false });
  const showModal = (type, title, message) =>
    setModal({ show: true, type, title, message });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (twoFA) {
        const { data } = await axios.post(
          "http://localhost:5000/api/auth/verify-2fa",
          {
            twoFAToken,
            code: twoFACode,
          }
        );
        saveAuth(data);
        return;
      }

      const url = `http://localhost:5000/api/auth/${
        isLogin ? "login" : "register"
      }`;
      const { data } = await axios.post(url, formData);

      if (data.requires2FA) {
        setTwoFA(true);
        setTwoFAToken(data.twoFAToken);
        showModal("success", t("modal_security"), t("modal_2fa_sent"));
      } else {
        saveAuth(data);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Server connection error";
      showModal("error", t("modal_error"), msg);
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
    <div className="auth-page">
      <style>{`
        /* ЗАМЕНИЛ ШРИФТ НА INTER (ЛУЧШЕ ДЛЯ КАЗАХСКОГО/КИРИЛЛИЦЫ) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        :root { --primary: #6366f1; --primary-dark: #4f46e5; --secondary: #64748b; --bg-color: #f8fafc; --text-main: #0f172a; --card-bg: #ffffff; --input-bg: #f8fafc; --border-color: #e2e8f0; }
        
        body, html { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
        
        /* Применяем шрифт Inter ко всем элементам */
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        
        .auth-page { min-height: 100vh; width: 100vw; background-color: var(--bg-color); background-image: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 40px 40px; display: flex; flex-direction: column; align-items: center; color: var(--text-main); position: relative; }
        .auth-container { flex: 1; width: 100%; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .auth-card { background: var(--card-bg); width: 100%; max-width: 420px; padding: 40px; border-radius: 24px; border: 1px solid var(--border-color); box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.05); animation: fadeInUp 0.5s ease-out; margin: 0 auto; text-align: left; }
        .auth-header { text-align: center; margin-bottom: 32px; width: 100%; }
        .brand-logo { font-size: 20px; font-weight: 900; color: var(--primary); display: inline-block; margin-bottom: 20px; letter-spacing: -0.5px; }
        .auth-title { font-size: 26px; font-weight: 800; margin: 0 0 8px 0; color: var(--text-main); letter-spacing: -0.5px; }
        .auth-subtitle { font-size: 15px; color: var(--secondary); margin: 0; line-height: 1.5; }
        .form-group { margin-bottom: 16px; width: 100%; }
        .input-field { width: 100%; padding: 14px 16px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; font-size: 15px; color: var(--text-main); font-weight: 500; transition: all 0.2s ease; outline: none; }
        .input-field::placeholder { color: #94a3b8; font-weight: 400; }
        .input-field:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
        .custom-select-wrapper { position: relative; width: 100%; }
        .custom-select-trigger { width: 100%; padding: 14px 16px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; font-size: 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; }
        .custom-select-trigger:hover { background: #f1f5f9; }
        .custom-select-trigger.open { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
        .val-placeholder { color: #94a3b8; }
        .val-selected { color: var(--text-main); font-weight: 600; }
        .custom-options-list { position: absolute; top: 110%; left: 0; right: 0; background: white; border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-height: 220px; overflow-y: auto; z-index: 100; padding: 6px; animation: slideDown 0.2s ease-out; }
        .custom-option { padding: 10px 12px; border-radius: 8px; font-size: 14px; color: var(--text-main); cursor: pointer; transition: background 0.2s; font-weight: 500; text-align: left; }
        .custom-option:hover { background: #f1f5f9; color: var(--primary); }
        .custom-option.selected { background: #eef2ff; color: var(--primary); font-weight: 700; }
        .btn-primary { width: 100%; padding: 16px; background: var(--primary); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; margin-top: 12px; box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3); display: flex; justify-content: center; align-items: center; }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.4); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .toggle-text { text-align: center; margin-top: 24px; font-size: 14px; color: var(--secondary); font-weight: 500; }
        .toggle-link { color: var(--primary); font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; margin-left: 6px; transition: color 0.2s; }
        .toggle-link:hover { text-decoration: underline; color: var(--primary-dark); }
        .checkbox-wrapper { display: flex; gap: 10px; align-items: start; margin-bottom: 20px; justify-content: flex-start; }
        .checkbox-wrapper input[type="checkbox"] { margin-top: 3px; accent-color: var(--primary); width: 18px; height: 18px; cursor: pointer; }
        .checkbox-text { font-size: 13px; color: var(--secondary); line-height: 1.4; font-weight: 500; text-align: left; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 200; animation: fadeIn 0.2s ease-out; }
        .modal-content { background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 380px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: scaleUp 0.2s ease-out; }
        .modal-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; }
        .modal-icon.error { background: #fef2f2; color: #ef4444; }
        .modal-icon.success { background: #f0fdf4; color: #22c55e; }
        .modal-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: var(--text-main); }
        .modal-msg { font-size: 15px; color: var(--secondary); margin-bottom: 24px; line-height: 1.5; }
        .modal-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; font-size: 15px; transition: transform 0.2s; }
        .modal-btn:hover { transform: translateY(-2px); }
        .modal-btn.error { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .modal-btn.success { background: #22c55e; color: white; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Navbar теперь сам использует useLanguage внутри себя */}
      <Navbar />

      {modal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === "error" ? (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-msg">{modal.message}</p>
            <button className={`modal-btn ${modal.type}`} onClick={closeModal}>
              {t("modal_btn_ok")}
            </button>
          </div>
        </div>
      )}

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">JANA TEST</div>
            <h2 className="auth-title">
              {twoFA
                ? t("auth_2fa_title")
                : isLogin
                ? t("auth_welcome")
                : t("auth_register")}
            </h2>
            <p className="auth-subtitle">
              {twoFA
                ? t("auth_2fa_sub")
                : isLogin
                ? t("auth_sub_login")
                : t("auth_sub_register")}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {twoFA ? (
              <div className="form-group">
                <input
                  className="input-field"
                  style={{
                    textAlign: "center",
                    fontSize: "24px",
                    letterSpacing: "8px",
                    fontWeight: "800",
                    color: "var(--primary)",
                  }}
                  placeholder="• • • • •"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <>
                {!isLogin && (
                  <>
                    <div className="form-group">
                      <input
                        className="input-field"
                        name="full_name"
                        placeholder={t("auth_fullname")}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        className="input-field"
                        name="phone"
                        placeholder={t("auth_phone")}
                        onChange={handleChange}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <CustomSelect
                          options={schools}
                          value={formData.school}
                          onChange={(val) =>
                            setFormData({ ...formData, school: val })
                          }
                          placeholder={t("auth_school")}
                          noDataMessage={t("no_data")}
                        />
                        <input
                          type="hidden"
                          name="school"
                          value={formData.school}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ width: "90px" }}>
                        <input
                          className="input-field"
                          name="className"
                          placeholder={t("auth_class")}
                          value={formData.className}
                          onChange={handleClassChange}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <input
                    className="input-field"
                    type="email"
                    name="email"
                    placeholder={t("auth_email")}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    className="input-field"
                    type="password"
                    name="password"
                    placeholder={t("auth_password")}
                    onChange={handleChange}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="consent_pdn"
                      id="consent"
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="consent" className="checkbox-text">
                      {t("auth_consent")}
                    </label>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? t("auth_loading")
                : twoFA
                ? t("auth_verify")
                : isLogin
                ? t("auth_btn_login")
                : t("auth_btn_register")}
            </button>

            {!twoFA && (
              <div className="toggle-text">
                {isLogin ? t("auth_no_account") : t("auth_have_account")}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? t("auth_btn_create") : t("auth_btn_login")}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
