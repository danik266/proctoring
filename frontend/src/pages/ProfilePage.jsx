import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // 👈 Вернул импорт Navbar
import { useLanguage } from "../context/LanguageContext";

// 👇 ИМПОРТИРУЕМ DASHBOARD
import Dashboard from "./Dashboard";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        if (!token || !userId) {
          navigate("/auth");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/dashboard/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserData(response.data.user);
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        if (err.response && err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError("Не удалось загрузить данные профиля. Проверьте консоль.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
    window.location.reload();
  };

  const handleClose = () => {
    navigate(-1);
  };

  const renderRole = (role) => {
    switch (role) {
      case "student":
        return t("role_student") || "Ученик";
      case "teacher":
        return t("role_teacher") || "Учитель";
      case "admin":
        return t("role_admin") || "Админ";
      default:
        return role;
    }
  };

  return (
    <div
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}
    >
      {/* 👇 1. ФОНОВАЯ СТРАНИЦА DASHBOARD (Размытая) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          filter: "blur(6px)", // Только размытие
          pointerEvents: "none",
          transform: "scale(1.02)",
        }}
      >
        <Dashboard />
      </div>

      {/* 👇 2. NAVBAR (Четкий, поверх размытого фона, но под затемнением) */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Navbar />
      </div>

      {/* 👇 3. САМ ПРОФИЛЬ (Overlay - лежит поверх всего) */}
      <div className="profile-overlay">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          .profile-overlay { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100vw; 
            height: 100vh; 
            /* Легкое затемнение фона, покрывает и Dashboard и Navbar */
            background: rgba(0, 0, 0, 0.2); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            z-index: 2000; 
            animation: fadeIn 0.3s ease-out; 
            font-family: 'Plus Jakarta Sans', sans-serif; 
          }

          .profile-card { 
            background: #ffffff; 
            width: 90%; 
            max-width: 500px; 
            border-radius: 24px; 
            padding: 32px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); 
            position: relative; 
            animation: scaleUp 0.3s ease-out; 
            border: 1px solid rgba(255, 255, 255, 0.8); 
          }
          
          .close-btn { position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
          .close-btn:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
          .profile-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
          .avatar-placeholder { width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; font-weight: 700; margin-bottom: 16px; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); }
          .user-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-align: center; }
          .user-role-badge { margin-top: 6px; padding: 4px 12px; background: #eef2ff; color: #6366f1; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-grid { display: grid; gap: 16px; margin-bottom: 30px; }
          .info-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
          .info-item:last-child { border-bottom: none; }
          .label { color: #64748b; font-size: 14px; font-weight: 500; }
          .value { color: #0f172a; font-size: 15px; font-weight: 600; text-align: right; }
          .logout-btn-full { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #fee2e2; background: #fef2f2; color: #ef4444; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .logout-btn-full:hover { background: #fee2e2; transform: translateY(-2px); }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleUp { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        `}</style>

        <div className="profile-card">
          <button className="close-btn" onClick={handleClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#64748b" }}
            >
              Загрузка данных...
            </div>
          ) : error ? (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#ef4444" }}
            >
              {error}
            </div>
          ) : (
            <>
              <div className="profile-header">
                <div className="avatar-placeholder">
                  {userData.full_name
                    ? userData.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <h2 className="user-name">{userData.full_name}</h2>
                <div className="user-role-badge">
                  {renderRole(userData.role)}
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value">{userData.email || "—"}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t("auth_phone") || "Телефон"}</span>
                  <span className="value">{userData.phone || "—"}</span>
                </div>

                {userData.school && (
                  <div className="info-item">
                    <span className="label">{t("auth_school") || "Школа"}</span>
                    <span className="value">{userData.school}</span>
                  </div>
                )}

                {userData.className && (
                  <div className="info-item">
                    <span className="label">{t("auth_class") || "Класс"}</span>
                    <span className="value">{userData.className}</span>
                  </div>
                )}
              </div>

              <button className="logout-btn-full" onClick={handleLogout}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {t("nav_logout") || "Выйти из аккаунта"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
