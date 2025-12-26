import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 2700));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="landing-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #64748b;
            --bg-color: #f8fafc;
            --text-main: #0f172a;
        }

        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        html, body { margin: 0; padding: 0; overflow-x: hidden; background-color: var(--bg-color); width: 100%; }

        .landing-page {
          width: 100%;
          min-height: 100vh;
          color: var(--text-main);
          position: relative;
          background-image: 
            linear-gradient(#e2e8f0 1px, transparent 1px),
            linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: center top;
          padding-bottom: 0;
        }

        /* --- HERO --- */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
        }

        .container {
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .hero-grid {
            display: grid;
            grid-template-columns: 1fr 450px;
            gap: 60px;
            align-items: center;
        }

        .hero-content { text-align: left; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #eef2ff; border: 1px solid #c7d2fe;
          padding: 8px 16px; border-radius: 50px;
          font-size: 13px; font-weight: 700;
          color: var(--primary); margin-bottom: 24px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .hero-title {
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 800; line-height: 1.1; margin: 0 0 24px 0; color: var(--text-main); letter-spacing: -1px;
        }
        .hero-title span { color: var(--primary); }
        .hero-subtitle {
          font-size: 18px; color: var(--secondary); margin: 0 0 40px 0; line-height: 1.6; max-width: 550px;
        }
        .hero-buttons { display: flex; gap: 16px; flex-wrap: wrap; }
        .btn {
          padding: 16px 32px; font-size: 16px; font-weight: 600; border-radius: 14px; 
          cursor: pointer; transition: all 0.2s ease; border: none; display: inline-flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .btn-primary {
          background: var(--primary); color: white; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5); }
        .btn-secondary { background: white; color: var(--text-main); border: 1px solid #e2e8f0; }
        .btn-secondary:hover { background: #f8fafc; transform: translateY(-2px); border-color: #cbd5e1; }
        
        .hero-stats { display: flex; gap: 40px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; }
        .stat-item-hero { text-align: left; }
        .stat-number-hero { font-size: 28px; font-weight: 800; color: var(--text-main); }
        .stat-label-hero { font-size: 12px; color: var(--secondary); font-weight: 600; text-transform: uppercase; }

        /* HERO VISUAL (MOCKUP) */
        .hero-visual {
            position: relative; width: 400px; height: 560px; perspective: 1000px; margin: 0 auto;
        }
        .mock-interface {
            width: 100%; height: 100%; background: white; border-radius: 20px;
            box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.15); border: 1px solid #e2e8f0;
            transform: rotateY(-5deg) rotateX(2deg); position: relative; overflow: hidden;
            display: flex; flex-direction: column;
        }
        .mock-header { height: 60px; min-height: 60px; background: #fff; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
        .mock-timer { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--primary); background: #eef2ff; padding: 4px 8px; border-radius: 6px; font-size: 13px; }
        .mock-user { display: flex; gap: 8px; align-items: center; font-size: 13px; font-weight: 600; }
        .avatar-circle { width: 24px; height: 24px; background: #cbd5e1; border-radius: 50%; }
        .mock-body { padding: 20px; flex-grow: 1; position: relative; display: flex; flex-direction: column; }
        
        /* Question Animation Parts */
        .question-slide { position: absolute; top: 20px; left: 20px; right: 20px; opacity: 0; pointer-events: none; }
        .question-area-fixed { height: 110px; margin-bottom: 10px; }
        .question-meta { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
        .question-text { font-size: 15px; font-weight: 700; line-height: 1.4; color: #0f172a; }
        .options-list { display: flex; flex-direction: column; gap: 10px; }
        .option-item { height: 50px; display: flex; align-items: center; gap: 12px; padding: 0 15px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 500; background: white; color: #334155; }
        .radio-circle { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .radio-inner { width: 10px; height: 10px; background: transparent; border-radius: 50%; }
        .mock-footer { height: 70px; min-height: 70px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: flex-end; padding: 0 25px; background: #fff; margin-top: auto; }
        .mock-btn { background: var(--primary); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; }
        .cursor-ghost { position: absolute; top: 0; left: 0; width: 24px; height: 24px; background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.65376 12.3673H5.46023L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z' fill='%230f172a' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E"); z-index: 100; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); animation: cursorMaster 20s infinite linear; }

        /* --- СЕКЦИИ --- */
        .section-white { background: white; padding: 100px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .section-gray { background: #f8fafc; padding: 100px 0; }
        
        .section-header { text-align: center; margin-bottom: 60px; max-width: 800px; margin-left: auto; margin-right: auto; }
        .section-tag { color: var(--primary); font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 16px; }
        .section-title { font-size: 42px; fontWeight: 800; color: var(--text-main); margin-bottom: 20px; letter-spacing: -1px; line-height: 1.2; }
        .section-desc { color: var(--secondary); font-size: 18px; line-height: 1.6; }

        /* BENTO GRID */
        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .bento-card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px;
            transition: all 0.3s ease; display: flex; flex-direction: column; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .bento-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1); border-color: var(--primary); }
        .bento-card.wide { grid-column: span 2; }
        .bento-card.tall { grid-row: span 2; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
        
        .feature-icon { width: 56px; height: 56px; background: #eef2ff; border-radius: 16px; color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .feature-title { font-size: 22px; font-weight: 800; margin-bottom: 12px; color: var(--text-main); }
        .feature-txt { color: var(--secondary); line-height: 1.6; font-size: 16px; }

        /* PROCESS */
        .process-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; position: relative; margin-top: 60px; }
        .process-line { position: absolute; top: 30px; left: 15%; right: 15%; height: 2px; background: #e2e8f0; z-index: 0; }
        .step-item { position: relative; z-index: 1; text-align: center; }
        .step-circle { width: 60px; height: 60px; background: white; border: 2px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 20px; font-weight: 800; color: var(--text-main); transition: 0.3s; }
        .step-item:hover .step-circle { border-color: var(--primary); background: var(--primary); color: white; transform: scale(1.1); }
        .step-title { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
        .step-desc { font-size: 15px; color: var(--secondary); line-height: 1.5; }

        /* STATS */
        .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
        .big-stat { font-size: 56px; font-weight: 900; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .stat-text { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }

        /* CTA */
        .cta-section { padding: 100px 20px; }
        .cta-box {
            background: linear-gradient(120deg, #4f46e5, #7c3aed);
            border-radius: 40px; padding: 80px 40px; text-align: center; color: white;
            position: relative; overflow: hidden; box-shadow: 0 30px 60px -12px rgba(79, 70, 229, 0.4);
        }
        .cta-circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); }
        .cta-content { position: relative; z-index: 2; max-width: 700px; margin: 0 auto; }
        .cta-title { font-size: 48px; font-weight: 800; margin-bottom: 24px; letter-spacing: -1px; }
        .cta-text { font-size: 20px; opacity: 0.9; margin-bottom: 40px; line-height: 1.5; }
        .btn-white { background: white; color: var(--primary); padding: 20px 48px; font-size: 18px; font-weight: 800; border-radius: 16px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .btn-white:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }

        /* FOOTER */
        .footer { background: #fff; padding: 80px 0 40px; border-top: 1px solid #e2e8f0; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
        .footer-logo { font-size: 24px; font-weight: 900; color: var(--primary); margin-bottom: 16px; display: inline-block; }
        .footer-desc { color: var(--secondary); line-height: 1.6; max-width: 300px; font-size: 15px; }
        .footer-title { font-size: 14px; font-weight: 800; color: var(--text-main); text-transform: uppercase; margin-bottom: 24px; letter-spacing: 0.5px; }
        .footer-link { display: block; color: #64748b; margin-bottom: 14px; text-decoration: none; transition: 0.2s; font-size: 15px; }
        .footer-link:hover { color: var(--primary); transform: translateX(5px); }
        .footer-bottom { border-top: 1px solid #f1f5f9; padding-top: 30px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 14px; }

        /* ANIMATION KEYFRAMES */
        @keyframes cursorMaster {
            0%   { transform: translate(300px, 400px); opacity: 0; } 2% { opacity: 1; }
            5%   { transform: translate(280px, 380px); } 
            10%  { transform: translate(50px, 350px); } 11% { transform: translate(50px, 350px) scale(0.9); } 12% { transform: translate(50px, 350px) scale(1); }
            17%  { transform: translate(340px, 525px); } 18% { transform: translate(340px, 525px) scale(0.9); } 19% { transform: translate(340px, 525px) scale(1); }
            25%  { transform: translate(300px, 300px); } 30% { transform: translate(280px, 320px); } 
            35%  { transform: translate(50px, 290px); } 36% { transform: translate(50px, 290px) scale(0.9); } 37% { transform: translate(50px, 290px) scale(1); }
            42%  { transform: translate(340px, 525px); } 43% { transform: translate(340px, 525px) scale(0.9); } 44% { transform: translate(340px, 525px) scale(1); }
            50%  { transform: translate(300px, 250px); } 55% { transform: translate(290px, 270px); } 
            60%  { transform: translate(50px, 230px); } 61% { transform: translate(50px, 230px) scale(0.9); } 62% { transform: translate(50px, 230px) scale(1); }
            67%  { transform: translate(340px, 525px); } 68% { transform: translate(340px, 525px) scale(0.9); } 69% { transform: translate(340px, 525px) scale(1); }
            75%  { transform: translate(300px, 380px); } 80% { transform: translate(280px, 390px); } 
            85%  { transform: translate(50px, 410px); } 86% { transform: translate(50px, 410px) scale(0.9); } 87% { transform: translate(50px, 410px) scale(1); }
            92%  { transform: translate(340px, 525px); } 93% { transform: translate(340px, 525px) scale(0.9); } 94% { transform: translate(340px, 525px) scale(1); }
            100% { transform: translate(450px, 600px); opacity: 0; }
        }
        .anim-opt-1 { animation: highlight-1 20s infinite steps(1); }
        .anim-opt-2 { animation: highlight-2 20s infinite steps(1); }
        .anim-opt-3 { animation: highlight-3 20s infinite steps(1); }
        .anim-opt-4 { animation: highlight-4 20s infinite steps(1); }
        @keyframes highlight-1 { 0% { background: white; border-color: #e2e8f0; } 61% { background: #eef2ff; border-color: var(--primary); } 68% { background: white; border-color: #e2e8f0; } 100% { background: white; border-color: #e2e8f0; } }
        @keyframes highlight-2 { 0% { background: white; border-color: #e2e8f0; } 36% { background: #eef2ff; border-color: var(--primary); } 43% { background: white; border-color: #e2e8f0; } 100% { background: white; border-color: #e2e8f0; } }
        @keyframes highlight-3 { 0% { background: white; border-color: #e2e8f0; } 11% { background: #eef2ff; border-color: var(--primary); } 18% { background: white; border-color: #e2e8f0; } 100% { background: white; border-color: #e2e8f0; } }
        @keyframes highlight-4 { 0% { background: white; border-color: #e2e8f0; } 86% { background: #eef2ff; border-color: var(--primary); } 93% { background: white; border-color: #e2e8f0; } 100% { background: white; border-color: #e2e8f0; } }
        .anim-opt-1 .radio-inner { animation: fill-1 20s infinite steps(1); }
        .anim-opt-2 .radio-inner { animation: fill-2 20s infinite steps(1); }
        .anim-opt-3 .radio-inner { animation: fill-3 20s infinite steps(1); }
        .anim-opt-4 .radio-inner { animation: fill-4 20s infinite steps(1); }
        @keyframes fill-1 { 0%{background:transparent} 61%{background:var(--primary)} 68%{background:transparent} }
        @keyframes fill-2 { 0%{background:transparent} 36%{background:var(--primary)} 43%{background:transparent} }
        @keyframes fill-3 { 0%{background:transparent} 11%{background:var(--primary)} 18%{background:transparent} }
        @keyframes fill-4 { 0%{background:transparent} 86%{background:var(--primary)} 93%{background:transparent} }
        .question-slide { position: absolute; top: 20px; left: 20px; right: 20px; opacity: 0; pointer-events: none; }
        .slide-1 { animation: showSlide 20s infinite steps(1); animation-delay: 0s; }
        .slide-2 { animation: showSlide 20s infinite steps(1); animation-delay: 5s; }
        .slide-3 { animation: showSlide 20s infinite steps(1); animation-delay: 10s; }
        .slide-4 { animation: showSlide 20s infinite steps(1); animation-delay: 15s; }
        @keyframes showSlide { 0% { opacity: 1; transform: translateX(0); z-index: 2; } 20% { opacity: 0; transform: translateX(-10px); z-index: 1; } 100% { opacity: 0; } }
        .mock-btn { animation: btnClick 20s infinite; }
        @keyframes btnClick { 18% { transform: scale(0.95); background: var(--primary-dark); } 19% { transform: scale(1); background: var(--primary); } 43% { transform: scale(0.95); background: var(--primary-dark); } 44% { transform: scale(1); background: var(--primary); } 68% { transform: scale(0.95); background: var(--primary-dark); } 69% { transform: scale(1); background: var(--primary); } 93% { transform: scale(0.95); background: var(--primary-dark); } 94% { transform: scale(1); background: var(--primary); } }

        @media (max-width: 1024px) {
            .hero-grid { grid-template-columns: 1fr; justify-items: center; }
            .hero-content { text-align: center; }
            .hero-buttons { justify-content: center; }
            .hero-stats { justify-content: center; }
            .hero-visual { margin-top: 40px; }
            .bento-grid { grid-template-columns: 1fr; }
            .bento-card.wide, .bento-card.tall { grid-column: span 1; grid-row: span 1; }
            .process-steps { grid-template-columns: 1fr; gap: 30px; }
            .process-line { display: none; }
            .footer-grid { grid-template-columns: 1fr; gap: 40px; }
            .trust-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* --- 1. HERO SECTION --- */}
      <section className="hero">
        <div className="container">
            <div className="hero-grid">
                <div className="hero-content">
                  <div className="badge">Онлайн-тестирование</div>
                  <h1 className="hero-title">Сдавай ЕНТ, МОДО <br />и PISA <span>без стресса</span></h1>
                  <p className="hero-subtitle">
                    Удобная платформа для подготовки и проверки знаний. 
                    Огромная база вопросов, мгновенные результаты и работа над ошибками.
                  </p>
                  <div className="hero-buttons">
                    <button className="btn btn-primary" onClick={() => navigate("/auth")}>Войти</button>
                    <button className="btn btn-secondary" onClick={() => scrollToSection('features')}>Как это работает</button>
                  </div>
                  <div className="hero-stats">
                    <div className="stat-item-hero"><div className="stat-number-hero">10k+</div><div className="stat-label-hero">Студентов</div></div>
                    <div className="stat-item-hero"><div className="stat-number-hero">30k+</div><div className="stat-label-hero">Вопросов в базе</div></div>
                  </div>
                </div>

                <div className="hero-visual">
                    <div className="cursor-ghost"></div>
                    <div className="mock-interface">
                        <div className="mock-header">
                            <div className="mock-timer">⏱ {formatTime(timeLeft)}</div>
                            <div className="mock-user"><div className="avatar-circle"></div><span>Amanov A.</span></div>
                        </div>
                        <div style={{height:'4px', width:'100%', background:'#f1f5f9'}}><div style={{height:'100%', width:'65%', background:'#6366f1'}}></div></div>
                        <div className="mock-body">
                            {/* Slides */}
                            <div className="question-slide slide-1">
                                <div className="question-area-fixed"><div className="question-meta">Вопрос 14 из 30 • Математика</div><div className="question-text">Чему равен определенный интеграл от функции f(x) = x² на отрезке [0; 3]?</div></div>
                                <div className="options-list">
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>3</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>6</span></div>
                                    <div className="option-item anim-opt-3"><div className="radio-circle"><div className="radio-inner"></div></div><span>9</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>12</span></div>
                                </div>
                            </div>
                            <div className="question-slide slide-2">
                                 <div className="question-area-fixed"><div className="question-meta">Вопрос 15 из 30 • История</div><div className="question-text">В каком году столица Казахстана была перенесена из Алматы в Акмолу?</div></div>
                                <div className="options-list">
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>1995</span></div>
                                    <div className="option-item anim-opt-2"><div className="radio-circle"><div className="radio-inner"></div></div><span>1997</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>1999</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>2001</span></div>
                                </div>
                            </div>
                            <div className="question-slide slide-3">
                                 <div className="question-area-fixed"><div className="question-meta">Вопрос 16 из 30 • Физика</div><div className="question-text">Единица измерения электрического сопротивления в системе СИ?</div></div>
                                <div className="options-list">
                                    <div className="option-item anim-opt-1"><div className="radio-circle"><div className="radio-inner"></div></div><span>Ом (Ω)</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>Ампер (A)</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>Вольт (V)</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>Ватт (W)</span></div>
                                </div>
                            </div>
                            <div className="question-slide slide-4">
                                <div className="question-area-fixed"><div className="question-meta">Question 17 of 30 • English</div><div className="question-text">Choose the correct preposition: "She is good ___ playing the piano."</div></div>
                                <div className="options-list">
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>in</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>on</span></div>
                                    <div className="option-item"><div className="radio-circle"><div className="radio-inner"></div></div><span>with</span></div>
                                    <div className="option-item anim-opt-4"><div className="radio-circle"><div className="radio-inner"></div></div><span>at</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="mock-footer"><div className="mock-btn">Следующий вопрос →</div></div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 2. BENTO FEATURES (WHITE BG) --- */}
      <section className="section-white" id="features">
        <div className="container">
            <div className="section-header">
                <span className="section-tag">Возможности</span>
                <h2 className="section-title">Все инструменты для успешной сдачи</h2>
                <p className="section-desc">Удобный интерфейс, актуальные вопросы и ничего лишнего.</p>
            </div>
            
            <div className="bento-grid">
                {/* Card 1: Results & Analysis (Replaced AI) */}
                <div className="bento-card tall">
                    <div>
                        <div className="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div>
                        <h3 className="feature-title">Работа над ошибками</h3>
                        <p className="feature-txt">После каждого тестирования система показывает правильные ответы и объяснения. Следи за своим прогрессом в личном кабинете.</p>
                    </div>
                    <div style={{marginTop: 'auto', height: '180px', background: '#eef2ff', borderRadius: '16px', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexDirection: 'column', gap:'10px'}}>
                        {/* Fake Bar Chart */}
                        <div style={{display:'flex', alignItems:'flex-end', gap:'8px', height:'60px'}}>
                            <div style={{width:'12px', height:'30px', background:'#c7d2fe', borderRadius:'4px'}}></div>
                            <div style={{width:'12px', height:'45px', background:'#a5b4fc', borderRadius:'4px'}}></div>
                            <div style={{width:'12px', height:'60px', background:'#6366f1', borderRadius:'4px'}}></div>
                            <div style={{width:'12px', height:'50px', background:'#818cf8', borderRadius:'4px'}}></div>
                            <div style={{width:'12px', height:'55px', background:'#4f46e5', borderRadius:'4px'}}></div>
                        </div>
                        <div style={{fontSize:'12px', fontWeight:'700', color:'#4f46e5'}}>Ваш результат: 125/140</div>
                    </div>
                </div>

                {/* Card 2: Secure Browser (Kept Kiosk/Focus mode info but softer) */}
                <div className="bento-card">
                    <div className="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                    <h3 className="feature-title">Режим фокуса</h3>
                    <p className="feature-txt">Тренируйся в условиях, приближенных к реальному экзамену. Полноэкранный режим без отвлекающих факторов.</p>
                </div>

                {/* Card 3: Analytics */}
                <div className="bento-card">
                    <div className="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
                    <h3 className="feature-title">История тестов</h3>
                    <p className="feature-txt">Все пройденные тесты сохраняются. Вы всегда можете вернуться и посмотреть свои результаты.</p>
                </div>

                {/* Card 4: Base (Wide) */}
                <div className="bento-card wide">
                    <div style={{display:'flex', gap:'40px', alignItems:'center', flexWrap:'wrap'}}>
                        <div style={{flex:1, minWidth:'250px'}}>
                            <div className="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
                            <h3 className="feature-title">Актуальная база 2025</h3>
                            <p className="feature-txt">Пробники ЕНТ, МОДО и PISA, соответствующие школьной программе и новым стандартам.</p>
                        </div>
                        <div style={{flex:1, display:'flex', gap:'12px', flexWrap:'wrap'}}>
                            {['Математика', 'История Казахстана', 'Физика', 'Биология', 'География', 'Химия'].map(tag => (
                                <span key={tag} style={{padding:'8px 16px', background:'#f1f5f9', borderRadius:'8px', fontSize:'14px', fontWeight:'600', color:'#475569'}}>{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 3. HOW IT WORKS (GRAY BG) --- */}
      <section className="section-gray">
        <div className="container">
            <div className="section-header">
                <span className="section-tag">Процесс</span>
                <h2 className="section-title">Как начать тестирование</h2>
            </div>
            <div className="process-steps">
                <div className="process-line"></div>
                <div className="step-item">
                    <div className="step-circle">1</div>
                    <h3 className="step-title">Регистрация</h3>
                    <p className="step-desc">Создайте аккаунт за пару кликов.<br/>Нужен только Email или телефон.</p>
                </div>
                <div className="step-item">
                    <div className="step-circle">2</div>
                    <h3 className="step-title">Выбор теста</h3>
                    <p className="step-desc">Выберите предмет и тип тестирования<br/>(ЕНТ, МОДО или PISA).</p>
                </div>
                <div className="step-item">
                    <div className="step-circle">3</div>
                    <h3 className="step-title">Результат</h3>
                    <p className="step-desc">Пройдите тест и сразу получите<br/>баллы с разбором ответов.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- 4. TRUST / STATS (WHITE BG) --- */}
      <section className="section-white">
        <div className="container">
            <div className="trust-grid">
                <div>
                    <div className="big-stat">99.9%</div>
                    <div className="stat-text">Доступность 24/7</div>
                </div>
                <div>
                    <div className="big-stat">50k+</div>
                    <div className="stat-text">Сданных тестов</div>
                </div>
                <div>
                    <div className="big-stat">50+</div>
                    <div className="stat-text">Предметов</div>
                </div>
                <div>
                    <div className="big-stat">Free</div>
                    <div className="stat-text">Пробный режим</div>
                </div>
            </div>
        </div>
      </section>

      {/* --- 5. CTA SECTION --- */}
      <section className="cta-section">
        <div className="container">
            <div className="cta-box">
                <div className="cta-circle" style={{width:'300px', height:'300px', top:'-100px', left:'-50px'}}></div>
                <div className="cta-circle" style={{width:'200px', height:'200px', bottom:'-50px', right:'-50px'}}></div>
                
                <div className="cta-content">
                    <h2 className="cta-title">Готовы проверить знания?</h2>
                    <p className="cta-text">Присоединяйтесь к тысячам школьников, которые уже готовятся к экзаменам с нами.</p>
                    <button className="btn-white" onClick={() => navigate("/auth")}>Начать бесплатно</button>
                </div>
            </div>
        </div>
      </section>

      {/* --- 6. FOOTER --- */}
      <footer className="footer">
        <div className="container">
            <div className="footer-grid">
                <div>
                    <span className="footer-logo">JANA TEST</span>
                    <p className="footer-desc">Удобная платформа для подготовки к экзаменам ЕНТ, МОДО и PISA в Казахстане.</p>
                </div>
                <div>
                    <h4 className="footer-title">Платформа</h4>
                    <a href="#" className="footer-link">О нас</a>
                    <a href="#" className="footer-link">Предметы</a>
                    <a href="#" className="footer-link">Тарифы</a>
                </div>
                <div>
                    <h4 className="footer-title">Помощь</h4>
                    <a href="#" className="footer-link">Частые вопросы</a>
                    <a href="#" className="footer-link">Как сдать ЕНТ</a>
                    <a href="#" className="footer-link">Контакты</a>
                </div>
                <div>
                    <h4 className="footer-title">Контакты</h4>
                    <a href="#" className="footer-link">support@janatest.kz</a>
                    <a href="#" className="footer-link">+7 (777) 123-45-67</a>
                </div>
            </div>
            
            {/* Нижняя полоса */}
            <div className="footer-bottom" style={{alignItems: 'center'}}>
                <div>© 2025 JANA TEST. Все права защищены.</div>
                
                {/* GymCoders Credit (Кликабельный) */}
                <div style={{fontWeight: '600', color: '#64748b'}}>
                    Создано командой{' '}
                    <span 
                        onClick={() => navigate("/team")} 
                        style={{
                            color: 'var(--primary)', 
                            fontWeight: '800', 
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        GymCoders
                    </span>
                </div>

                <div style={{display:'flex', gap:'20px'}}>
                    <a href="#" style={{color:'inherit', textDecoration:'none'}}>Конфиденциальность</a>
                    <a href="#" style={{color:'inherit', textDecoration:'none'}}>Оферта</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;