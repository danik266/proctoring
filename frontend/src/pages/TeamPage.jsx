import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TeamPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Блокируем скролл глобально
    document.body.style.overflowX = "hidden";
    // Красим фон всего body в темный цвет
    document.body.style.backgroundColor = "#0a0e1a";

    return () => {
      document.body.style.overflowX = "auto";
      // 👇 ДОБАВЬ ВОТ ЭТУ СТРОЧКУ 👇
      document.body.style.backgroundColor = ""; // Сбрасываем цвет, чтобы вернулся стандартный
    };
  }, []);

  const teamMembers = [
    { id: 1, name: "gay", role: "Developer", color: "#8b5cf6", insta: "https://instagram.com/yxungymlover911" },
    { id: 2, name: "ab1lion", role: "Developer", color: "#06b6d4", insta: "https://instagram.com/ab1lmns" },
    { id: 3, name: "w1zantiya", role: "Developer", color: "#f59e0b", insta: "https://instagram.com/eldowxl" },
    { id: 4, name: "armanello", role: "Developer", color: "#ec4899", insta: "https://instagram.com/arrmanelo" },
    { id: 5, name: "4etyre", role: "Developer", color: "#d946ef", insta: "https://instagram.com/4etyre" },
    { id: 6, name: "Kaimory", role: "Developer", color: "#10b981", insta: "https://instagram.com/kaimory7" },
    { id: 7, name: "yatogorot_", role: "Developer", color: "#3b82f6", insta: "https://instagram.com/yatogorot_" },
  ];

  const techStack = ["React", "Next.js", "Python", "FastAPI", "PostgreSQL", "Docker", "Tailwind"];

  // 1. УВЕЛИЧЕНО количество и разнообразие символов для фона
  const codeSymbols = [
      "{ }", "</>", ";", "[ ]", "=>", "&&", "||", "$", "()",
      "import", "return", "const", "let", "async", "await", "function",
      "if", "else", "try", "catch", "Bug", "Fix", "TODO:", "NaN",
      "npm i", "git push", "☕", "🔥", "🚀", "..."
  ];
  
  // Дублируем список, чтобы их было физически больше на экране
  const extendedSymbols = [...codeSymbols, ...codeSymbols];


  return (
    <div className={`live-code-page ${mounted ? 'mounted' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Fira Code:wght@500&display=swap');

        :root {
            --bg-main: #0a0e1a;
            --text-bright: #ffffff;
            --text-dim: #94a3b8;
            --accent-glow: rgba(120, 119, 198, 0.3);
        }

        body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            background-color: var(--bg-main); /* Гарантируем черный фон */
        }

        * { box-sizing: border-box; }

        .live-code-page {
            min-height: 100vh;
            width: 100%;
            background-color: var(--bg-main);
            color: var(--text-bright);
            font-family: 'Sora', sans-serif;
            position: relative;
            overflow-x: hidden;
            /* 3. УБРАН лишний padding-bottom, который создавал серую полосу внизу */
            padding-bottom: 0;
        }

        /* --- ЖИВОЙ ФОН КОДА (ANIMATED BG) --- */
        .code-bg-layer {
            position: fixed; inset: 0; pointer-events: none; z-index: 0;
            background:
                radial-gradient(circle at 20% 30%, rgba(45, 55, 200, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(200, 45, 180, 0.15) 0%, transparent 50%);
            animation: pulseColors 15s ease-in-out infinite alternate;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }

        .floating-symbol {
            position: absolute;
            font-family: 'Fira Code', monospace;
            color: rgba(255,255,255,0.08); /* Чуть ярче, так как их больше */
            font-weight: bold;
            user-select: none;
            will-change: transform, opacity;
            animation: floatUp linear infinite;
            white-space: nowrap; /* Чтобы слова не переносились */
        }

        /* Генерация стилей для увеличенного количества символов */
        ${extendedSymbols.map((_, i) => `
            .sym-${i} {
                left: ${Math.random() * 100}%;
                /* Разброс размеров шрифта делаем побольше */
                font-size: ${Math.random() * 35 + 14}px;
                /* Разброс скорости анимации */
                animation-duration: ${Math.random() * 25 + 15}s;
                animation-delay: -${Math.random() * 30}s;
                 /* Добавляем случайный поворот для разнообразия */
                transform: rotate(${Math.random() * 360}deg);
            }
        `).join('')}

        @keyframes floatUp {
            0% { transform: translateY(110vh) rotate(0deg) scale(0.8); opacity: 0; }
            20% { opacity: 0.5; }
            80% { opacity: 0.5; }
            100% { transform: translateY(-20vh) rotate(360deg) scale(1.1); opacity: 0; }
        }
        @keyframes pulseColors {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(30deg); }
        }

        .container {
            max-width: 1200px; margin: 0 auto; padding: 0 30px;
            position: relative; z-index: 10;
            display: flex; flex-direction: column; align-items: center;
            padding-top: 60px;
        }

        .nav-header {
            width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 40px 0;
        }

        .logo { font-size: 26px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #fff, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer;}

        .back-btn {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: white; padding: 12px 28px; border-radius: 14px; cursor: pointer;
            font-weight: 600; transition: 0.3s;
            position: relative; overflow: hidden;
        }
        .back-btn:hover { border-color: white; box-shadow: 0 0 20px rgba(255,255,255,0.2); }
        .back-btn::after {
            content: ''; position: absolute; top: 50%; left: 50%; width: 300px; height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.2), transparent 60%);
            transform: translate(-50%, -50%) scale(0); transition: 0.5s;
        }
        .back-btn:hover::after { transform: translate(-50%, -50%) scale(1); opacity: 0; }

        /* --- HERO --- */
        .hero { text-align: center; margin: 40px 0 100px; opacity: 0; transform: translateY(30px); transition: 0.8s ease-out; }
        .mounted .hero { opacity: 1; transform: translateY(0); }

        .hero-title {
            font-size: 72px; font-weight: 800; line-height: 1; margin-bottom: 24px;
            background: linear-gradient(to right, #ffffff, #a5b4fc, #ffffff); background-size: 200%;
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: shimmerText 5s linear infinite;
        }
        @keyframes shimmerText { to { background-position: 200% center; } }
        .hero-desc { font-size: 20px; color: var(--text-dim); max-width: 650px; margin: 0 auto; }

        /* --- CARDS --- */
        .cards-wrapper {
            display: flex; flex-wrap: wrap; justify-content: center; gap: 40px;
            perspective: 1000px;
        }

        .dev-card {
            width: 300px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 28px;
            padding: 40px 25px;
            text-align: center;
            backdrop-filter: blur(15px);
            position: relative; overflow: hidden;
            opacity: 0; transform: translateY(50px) scale(0.9);
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            animation: breathingCard 6s ease-in-out infinite alternate;
        }
        @keyframes breathingCard { from { transform: translateY(0); } to { transform: translateY(-10px); } }

        ${teamMembers.map((_, i) => `.mounted .dev-card:nth-child(${i + 1}) { opacity: 1; transform: translateY(0) scale(1); transition-delay: ${i * 0.1}s; }`).join('')}

        .dev-card:hover {
            transform: translateY(-20px) scale(1.02) !important;
            border-color: var(--member-color);
            box-shadow: 0 20px 50px -20px var(--member-color), inset 0 0 20px rgba(0,0,0,0.2);
        }
        .dev-card::before {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--member-color), transparent 50%);
            opacity: 0; transition: 0.3s; mix-blend-mode: screen; pointer-events: none;
        }
        .dev-card:hover::before { opacity: 0.15; }

        .avatar-container {
            width: 100px; height: 100px; margin: 0 auto 25px; position: relative;
            display: flex; align-items: center; justify-content: center;
        }
        .avatar-ring {
            position: absolute; inset: -5px; border-radius: 50%;
            border: 2px solid transparent; border-top-color: var(--member-color); border-left-color: var(--member-color);
            opacity: 0; transition: 0.4s;
        }
        .dev-card:hover .avatar-ring { opacity: 1; animation: spinRing 2s linear infinite; }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        .avatar-box {
            width: 100%; height: 100%; border-radius: 50%;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            display: flex; align-items: center; justify-content: center;
            font-size: 36px; font-weight: 800; color: var(--member-color);
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.1);
            transition: 0.4s;
        }
        .dev-card:hover .avatar-box { border-color: var(--member-color); color: white; background: var(--member-color); box-shadow: 0 0 30px var(--member-color); }

        .member-name { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
        .member-role {
            font-family: 'Fira Code', monospace; font-size: 13px; color: var(--member-color);
            background: rgba(255,255,255,0.05); padding: 6px 14px; border-radius: 50px;
            border: 1px solid rgba(255,255,255,0.1);
        }

        /* --- STACK --- */
        .stack-section { margin-top: 140px; text-align: center; }
        .stack-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 40px; }
        .tech-pill {
            font-family: 'Fira Code', monospace; font-size: 15px; font-weight: 600;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
            padding: 12px 24px; border-radius: 16px; color: #e2e8f0;
            transition: 0.3s; animation: floatPill 4s ease-in-out infinite alternate;
        }
        .tech-pill:hover { background: rgba(255,255,255,0.1); border-color: #a5b4fc; color: white; box-shadow: 0 0 15px rgba(165, 180, 252, 0.3); }
        ${techStack.map((_, i) => `.tech-pill:nth-child(${i + 1}) { animation-delay: -${i * 0.5}s; }`).join('')}
        @keyframes floatPill { from { transform: translateY(5px); } to { transform: translateY(-5px); } }

        /* --- FOOTER --- */
        .contacts-section {
            margin-top: 160px;
            /* Убеждаемся, что паддинг футера достаточный, чтобы не прилипать к низу экрана */
            padding: 80px 40px 100px;
            width: 100%;
            background: linear-gradient(180deg, transparent, rgba(255,255,255,0.03));
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center; position: relative; overflow: hidden;
            z-index: 10; /* Чтобы быть над фоном */
        }
        .contact-grid {
            display: flex; flex-wrap: wrap; justify-content: center; gap: 24px;
            margin-top: 50px; max-width: 900px; margin-left: auto; margin-right: auto;
        }
        .insta-btn-live {
            position: relative; display: flex; align-items: center; gap: 12px;
            padding: 16px 32px; border-radius: 20px;
            background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.08);
            color: white; text-decoration: none; font-weight: 600;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            overflow: hidden; z-index: 1;
        }
        .insta-btn-live::before {
            content: ''; position: absolute; inset: 0; z-index: -1;
            background: var(--btn-color); transform: scaleX(0); transform-origin: left;
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .insta-btn-live:hover { border-color: transparent; box-shadow: 0 10px 30px -10px var(--btn-color); transform: translateY(-3px); }
        .insta-btn-live:hover::before { transform: scaleX(1); }
        .insta-icon { width: 24px; height: 24px; fill: currentColor; transition: 0.3s; }
        .insta-btn-live:hover .insta-icon { transform: rotate(-15deg) scale(1.1); }

        @media (max-width: 768px) {
            .hero-title { font-size: 48px; }
            .dev-card { width: 100%; }
            .contact-grid { flex-direction: column; align-items: center; }
            .insta-btn-live { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* ЖИВОЙ ФОН С БОЛЬШИМ КОЛИЧЕСТВОМ СИМВОЛОВ */}
      <div className="code-bg-layer">
          {extendedSymbols.map((symbol, index) => (
               <div key={index} className={`floating-symbol sym-${index}`}>{symbol}</div>
          ))}
      </div>

      <div className="container">
         {/* Nav */}
        <nav className="nav-header">
            <div className="logo" onClick={() => navigate("/")}>GymCoders</div>
            <button className="back-btn" onClick={() => navigate("/")}>← Назад</button>
        </nav>

        {/* Hero */}
        <div className="hero">
            <h1 className="hero-title">Создатели цифровых миров</h1>
            <p className="hero-desc">
                Мы пишем чисто, быстро и эффективно. Код — это наш инструмент, а результат — искусство.
            </p>
        </div>

        {/* Team Grid */}
        <div className="cards-wrapper">
            {teamMembers.map((member, index) => (
                <div
                    className="dev-card"
                    key={member.id}
                    style={{'--member-color': member.color}}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                    }}
                >
                    <div className="avatar-container">
                        <div className="avatar-ring"></div>
                        <div className="avatar-box">
                            {member.name.charAt(0)}
                        </div>
                    </div>
                    <h3 className="member-name">{member.name}</h3>
                    <div className="member-role">&lt;{member.role}/&gt;</div>
                </div>
            ))}
        </div>

        {/* Stack */}
        <div className="stack-section">
            <h2 style={{fontSize: '28px', fontWeight: 800, letterSpacing:'-1px'}}>Core Stack</h2>
            <div className="stack-list">
                {techStack.map(tech => (
                    <div className="tech-pill" key={tech}>{tech}</div>
                ))}
            </div>
        </div>
      </div>

        {/* Footer */}
        <div className="contacts-section">
            <h2 style={{fontSize: '36px', fontWeight: 800, marginBottom:'20px'}}>Связь с разработчиками</h2>
            <p style={{color:'var(--text-dim)', maxWidth:'600px', margin:'0 auto'}}>
                Нажмите на кнопку, чтобы перейти в Instagram профиль участника команды.
            </p>

            <div className="contact-grid">
                {teamMembers.map(member => (
                    <a
                        href={member.insta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insta-btn-live"
                        key={member.id}
                        style={{'--btn-color': member.color}}
                    >
                        {/* 2. ИСПРАВЛЕНА иконка Instagram на более качественную */}
                        <svg className="insta-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/>
                        </svg>
                        {member.name}
                    </a>
                ))}
            </div>
        </div>
    </div>
  );
};

export default TeamPage;