import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  // Функция для плавного скролла к секциям (если нужно по клику)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* --- ДОБАВЛЕНО: Плавный скролл для всей страницы --- */
        html {
          scroll-behavior: smooth;
        }

        /* --- ДОБАВЛЕНО: Кастомный скроллбар --- */
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #0f0c29; 
        }
        ::-webkit-scrollbar-thumb {
          background: #6366f1; 
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8b5cf6; 
        }

        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { margin: 0; padding: 0; overflow-x: hidden; }

        .landing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          color: white;
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          animation: pulse 4s ease-in-out infinite;
        }

        .hero::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
          bottom: -150px;
          left: -150px;
          animation: pulse 4s ease-in-out infinite 2s;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: #a5b4fc;
          margin-bottom: 24px;
          animation: fadeInDown 0.6s ease-out;
        }

        .hero-title {
          font-size: clamp(40px, 8vw, 72px);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 24px 0;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.8s ease-out;
        }

        .hero-subtitle {
          font-size: clamp(16px, 2.5vw, 22px);
          color: #94a3b8;
          margin: 0 0 40px 0;
          line-height: 1.6;
          max-width: 650px;
          margin-left: auto;
          margin-right: auto;
          animation: fadeInUp 0.8s ease-out 0.2s backwards;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeInUp 0.8s ease-out 0.4s backwards;
        }

        .btn {
          padding: 16px 36px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(99, 102, 241, 0.5);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-3px);
        }

        /* Stats Section */
        .stats {
          display: flex;
          justify-content: center;
          gap: 60px;
          margin-top: 80px;
          flex-wrap: wrap;
          animation: fadeInUp 0.8s ease-out 0.6s backwards;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 42px;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Features Section */
        .features {
          padding: 100px 20px;
          background: linear-gradient(180deg, transparent 0%, rgba(15, 12, 41, 0.5) 100%);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: clamp(28px, 5vw, 42px);
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .section-subtitle {
          font-size: 18px;
          color: #94a3b8;
          max-width: 500px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-5px);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .feature-desc {
          font-size: 15px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        /* Tests Section */
        .tests {
          padding: 100px 20px;
        }

        .tests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .test-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .test-card:hover {
          transform: translateY(-5px);
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
        }

        .test-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .test-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .test-desc {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        /* CTA Section */
        .cta {
          padding: 100px 20px;
          text-align: center;
        }

        .cta-box {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 32px;
          padding: 60px 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 700;
          margin: 0 0 16px 0;
        }

        .cta-text {
          font-size: 18px;
          color: #94a3b8;
          margin: 0 0 32px 0;
        }

        /* Footer Styles Update */
        .footer {
          padding: 40px 20px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 12, 41, 0.3);
          backdrop-filter: blur(10px);
        }

        .footer-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }

        .copyright {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .team-text {
            font-size: 15px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin: 0;
        }

        .gym-coders {
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .heart {
            color: #ef4444;
            display: inline-block;
            animation: heartBeat 1.5s ease-in-out infinite;
        }

        @keyframes heartBeat {
            0% { transform: scale(1); }
            14% { transform: scale(1.3); }
            28% { transform: scale(1); }
            42% { transform: scale(1.3); }
            70% { transform: scale(1); }
        }

        /* Animations */
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero { padding: 60px 20px; }
          .stats { gap: 40px; }
          .stat-number { font-size: 32px; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .btn { width: 100%; max-width: 280px; justify-content: center; }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Безопасное онлайн-тестирование
          </div>

          <h1 className="hero-title">
            JANA TEST
          </h1>

          <p className="hero-subtitle">
            Современная платформа для проведения онлайн-экзаменов с интеллектуальным
            мониторингом и защитой от нарушений. ЕНТ, МОДО, PISA и другие тесты.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate("/auth")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Войти в систему
            </button>
            
            {/* Пример кнопки с плавным скроллом к секции */}
            <button className="btn btn-secondary" onClick={() => scrollToSection('features')}>
              Узнать больше
            </button>
          </div>

          <div className="stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Пользователей</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Тестов сдано</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Точность</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Добавили ID для скролла */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Почему выбирают нас</h2>
            <p className="section-subtitle">
              Передовые технологии для честного и безопасного тестирования
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <h3 className="feature-title">AI-мониторинг</h3>
              <p className="feature-desc">
                Интеллектуальная система распознавания лиц и обнаружения
                посторонних объектов в реальном времени.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="feature-title">Защита от списывания</h3>
              <p className="feature-desc">
                Полноэкранный режим, блокировка переключения окон и
                контроль действий пользователя.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="feature-title">2FA Аутентификация</h3>
              <p className="feature-desc">
                Двухфакторная аутентификация через Telegram для
                максимальной безопасности аккаунта.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="feature-title">Контроль времени</h3>
              <p className="feature-desc">
                Автоматический таймер с возможностью настройки
                времени для каждого теста.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3 className="feature-title">Детальные отчёты</h3>
              <p className="feature-desc">
                Полная статистика прохождения тестов с записью
                видео и скриншотами нарушений.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3 className="feature-title">Кроссплатформенность</h3>
              <p className="feature-desc">
                Работает в любом современном браузере на компьютере.
                Простая настройка и быстрый старт.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tests Section */}
      <section className="tests">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Доступные тесты</h2>
            <p className="section-subtitle">
              Готовьтесь к важным экзаменам с нашей платформой
            </p>
          </div>

          <div className="tests-grid">
            <div className="test-card">
              <div className="test-icon">📚</div>
              <h3 className="test-name">ЕНТ</h3>
              <p className="test-desc">
                Единое национальное тестирование для выпускников школ
              </p>
            </div>

            <div className="test-card">
              <div className="test-icon">🎯</div>
              <h3 className="test-name">МОДО</h3>
              <p className="test-desc">
                Мониторинг образовательных достижений обучающихся
              </p>
            </div>

            <div className="test-card">
              <div className="test-icon">🌍</div>
              <h3 className="test-name">PISA</h3>
              <p className="test-desc">
                Международная программа оценки образовательных достижений
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-title">Готовы начать?</h2>
            <p className="cta-text">
              Присоединяйтесь к тысячам учеников, которые уже готовятся к экзаменам с нами
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/auth")}>
              Начать бесплатно
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
            <p className="copyright">
              © 2025 JANA TEST. Все права защищены.
            </p>
            <p className="team-text">
              Создано с <span className="heart">❤</span> командой <span className="gym-coders">GymCoders</span>
            </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;