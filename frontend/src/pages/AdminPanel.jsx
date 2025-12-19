import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// === API CONSTANTS ===
const API_URL = "http://localhost:5000/api/admin";
const UPLOADS_URL = "http://localhost:5000/uploads";
const VIDEOS_URL = "http://localhost:5000/videos";

const fetcher = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API Error: ${res.statusText}`);
  }
  return res.json();
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // === STATE ===
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [schools, setSchools] = useState([]);

  // АНАЛИТИКА STATE
  const [reportsData, setReportsData] = useState(null);
  // 👇 Исправлено: default state включает type: 'all'
  const [filters, setFilters] = useState({ dateRange: 'week', schoolId: 'all', type: 'all' });

  // === UI STATE ===
  const [toast, setToast] = useState(null);

  // === MODALS STATE ===
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);

  // === MEDIA PREVIEW STATE ===
  const [mediaPreview, setMediaPreview] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // === LOAD DATA ===
  const loadData = async () => {
    try {
      const time = Date.now();
      const schoolsData = await fetcher(`/schools?t=${time}`);
      setSchools(schoolsData);
      setStats(await fetcher(`/stats?t=${time}`));

      if (activeTab === 'users') setUsers(await fetcher(`/users?t=${time}`));
      if (activeTab === 'tests') setTests(await fetcher(`/tests?t=${time}`));
      if (activeTab === 'sessions') setSessions(await fetcher(`/sessions?t=${time}`));
      if (activeTab === 'violations') setViolations(await fetcher(`/violations?t=${time}`));

      // 👇 ИСПРАВЛЕННАЯ ЗАГРУЗКА АНАЛИТИКИ
      if (activeTab === 'analytics') {
          const queryParams = new URLSearchParams({
              dateRange: filters.dateRange,
              schoolId: filters.schoolId,
              type: filters.type // Передаем тип теста (ENT, MODO...)
          }).toString();

          try {
             const data = await fetcher(`/reports?${queryParams}`); 
             setReportsData(data);
          } catch(e) {
             console.error("Ошибка аналитики", e);
             setReportsData({
                kpi: { avgScore: 0, passRate: 0, cheatingIndex: 0, totalExams: 0 },
                distribution: [],
                difficultQuestions: [],
                heatmap: []
             });
          }
      }

      if (activeTab === 'dashboard') {
        const [sess, viol] = await Promise.all([
          fetcher(`/sessions?t=${time}`),
          fetcher(`/violations?t=${time}`)
        ]);
        setSessions(sess.slice(0, 5));
        setViolations(viol.slice(0, 5));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [activeTab, filters]);

  // === HANDLERS ===
  const deleteItem = async (type, id) => {
    if (!window.confirm('Подтвердите удаление')) return;
    try {
      await fetcher(`/${type}/${id}`, { method: 'DELETE' });
      notify('Успешно удалено');
      loadData();
    } catch (e) { notify(e.message, 'error'); }
  };

  const toggleTest = async (test) => {
    const newValue = !test.published;
    try {
      await fetcher(`/tests/${test.id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: newValue })
      });
      setTests(prev => prev.map(t => t.id === test.id ? { ...t, published: newValue } : t));
      notify(newValue ? 'Тест опубликован' : 'Тест скрыт');
    } catch (e) { notify(e.message, 'error'); loadData(); }
  };

  const saveUser = async (data) => {
    try {
      await fetcher('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setShowUserModal(false);
      notify('Пользователь создан');
      loadData();
    } catch (e) { notify(e.message, 'error'); }
  };

  const saveTest = async (data) => {
    try {
      const url = editingTestId ? `/tests/${editingTestId}` : '/tests';
      const method = editingTestId ? 'PUT' : 'POST';
      await fetcher(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setShowTestModal(false);
      setEditingTestId(null);
      notify(editingTestId ? 'Тест обновлен' : 'Тест создан');
      loadData();
    } catch (e) { notify(e.message, 'error'); }
  };

  const openTestEditor = (id) => { setEditingTestId(id); setShowTestModal(true); };
  
  const handleLogout = () => {
    if(window.confirm("Выйти из системы?")) { localStorage.clear(); navigate('/'); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab stats={stats} sessions={sessions} violations={violations} />;
      case "users": return <UsersTab users={users} onDelete={(id) => deleteItem('users', id)} onAdd={() => setShowUserModal(true)} />;
      case "tests": return <TestsTab tests={tests} onDelete={(id) => deleteItem('tests', id)} onToggle={toggleTest} onEdit={openTestEditor} onAdd={() => { setEditingTestId(null); setShowTestModal(true); }} />;
      case "sessions": return <SessionsTab sessions={sessions} onVideo={(src) => setMediaPreview({type:'video', src})} onViewViolations={() => setActiveTab('violations')} />;
      case "violations": return <ViolationsTab violations={violations} onScreenshot={(src) => setMediaPreview({type:'image', src})} />;
      case "analytics": return <AnalyticsTab data={reportsData} filters={filters} setFilters={setFilters} schools={schools} />;
      default: return null;
    }
  };

  return (
    <div style={styles.container}>
      <GlobalStyles />
      <aside style={{ ...styles.sidebar, width: sidebarCollapsed ? '80px' : '280px' }}>
        <div>
          <nav style={styles.nav}>
            <NavItem icon={<DashboardIcon />} label="Дашборд" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} collapsed={sidebarCollapsed} />
            <NavItem icon={<AnalyticsIcon />} label="Аналитика" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} collapsed={sidebarCollapsed} />
            <div style={styles.divider} />
            <NavItem icon={<UsersIcon />} label="Пользователи" active={activeTab === "users"} onClick={() => setActiveTab("users")} collapsed={sidebarCollapsed} badge={stats.users?.students} />
            <NavItem icon={<TestsIcon />} label="Тесты" active={activeTab === "tests"} onClick={() => setActiveTab("tests")} collapsed={sidebarCollapsed} badge={stats.tests?.active} />
            <NavItem icon={<SessionsIcon />} label="Сессии" active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} collapsed={sidebarCollapsed} />
            <NavItem icon={<ViolationsIcon />} label="Нарушения" active={activeTab === "violations"} onClick={() => setActiveTab("violations")} collapsed={sidebarCollapsed} badge={stats.violations?.total} badgeColor="#ef4444" />
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <button style={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }}><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            {!sidebarCollapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
            <div>
                 <h1 style={styles.pageTitle}>{activeTab === 'analytics' ? 'Отчеты и Аналитика' : 'Панель управления'}</h1>
                 <p style={styles.pageSubtitle}>Система тестирования JANA TEST</p>
            </div>
            <div style={styles.adminBadge}>Администратор</div>
        </header>

        {renderContent()}
      </main>

      {toast && (
          <div style={{...styles.toast, borderLeft: toast.type === 'error' ? '4px solid #ef4444' : '4px solid #10b981'}}>
              <div style={{marginRight:10}}>{toast.type === 'error' ? '🚫' : '✅'}</div>
              <div><div style={{fontWeight:'bold', fontSize:14}}>{toast.type === 'error' ? 'Ошибка' : 'Успешно'}</div><div style={{fontSize:12, opacity:0.8}}>{toast.msg}</div></div>
          </div>
      )}

      {showUserModal && <UserModal schools={schools} onClose={() => setShowUserModal(false)} onSave={saveUser} />}
      {showTestModal && <TestModal testId={editingTestId} onClose={() => setShowTestModal(false)} onSave={saveTest} />}
      
      {mediaPreview && (
          <div style={styles.mediaOverlay} onClick={() => setMediaPreview(null)}>
              <div style={styles.mediaContainer} onClick={e => e.stopPropagation()}>
                  <div style={styles.mediaHeader}>
                      <span style={{color:'white', fontWeight:600}}>{mediaPreview.type === 'video' ? '📹 Запись сессии' : '📸 Снимок нарушения'}</span>
                      <button onClick={() => setMediaPreview(null)} style={styles.mediaCloseBtn}>✕</button>
                  </div>
                  <div style={styles.mediaContentWrapper}>
                      {mediaPreview.type === 'video' ? <video src={`${VIDEOS_URL}/${mediaPreview.src}`} controls autoPlay style={styles.mediaContent} /> : <img src={`${UPLOADS_URL}/${mediaPreview.src}`} style={styles.mediaContent} alt="Evidence" />}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// === TAB COMPONENTS ===

// 👇 ПОЛНОСТЬЮ ОБНОВЛЕННАЯ ВКЛАДКА АНАЛИТИКИ
const AnalyticsTab = ({ data, filters, setFilters, schools }) => {
    if (!data) return <div style={{color:'#94a3b8', padding:20}}>Загрузка аналитики...</div>;

    const dateOptions = [
        { value: 'week', label: 'Последняя неделя' },
        { value: 'month', label: 'Последний месяц' },
        { value: 'quarter', label: 'Квартал' },
        { value: 'year', label: 'Год' },
    ];

    // 👇 ВМЕСТО ПРЕДМЕТОВ ТЕПЕРЬ ТИПЫ
    const typeOptions = [
        { value: 'all', label: 'Все типы' },
        { value: 'ENT', label: 'ЕНТ' },
        { value: 'MODO', label: 'МОДО' },
        { value: 'PISA', label: 'PISA' },
    ];

    const schoolOptions = [
        { value: 'all', label: 'Все школы' },
        ...schools.map(s => ({ value: s.id, label: s.name }))
    ];

    // 👇 РАБОЧИЙ ЭКСПОРТ В CSV
    const handleExportExcel = () => {
        if (!data || !data.kpi) return alert("Нет данных для экспорта");
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Метрика,Значение\n";
        csvContent += `Всего экзаменов,${data.kpi.totalExams}\n`;
        csvContent += `Средний балл,${data.kpi.avgScore}\n`;
        csvContent += `Успеваемость (%),${data.kpi.passRate}\n`;
        csvContent += `Индекс списывания (%),${data.kpi.cheatingIndex}\n\n`;
        
        csvContent += "Распределение баллов,Количество\n";
        data.distribution.forEach(row => {
            csvContent += `${row.range},${row.count}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "analytics_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fade-in analytics-print-container">
             {/* Стили для печати PDF */}
             <style>{`
                @media print {
                    aside, header, .no-print { display: none !important; }
                    .analytics-print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    body { background: white !important; color: black !important; }
                    .card, .stat-card { border: 1px solid #ccc !important; background: white !important; color: black !important; box-shadow: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            <div style={styles.filterBar} className="no-print">
                <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                    <div style={{width: 200, zIndex: 30}}>
                        <CustomSelect options={dateOptions} value={filters.dateRange} onChange={v => setFilters({...filters, dateRange: v})} placeholder="Период" />
                    </div>
                    <div style={{width: 250, zIndex: 29}}>
                        <CustomSelect options={schoolOptions} value={filters.schoolId} onChange={v => setFilters({...filters, schoolId: v})} placeholder="Школа" />
                    </div>
                    <div style={{width: 200, zIndex: 28}}>
                        {/* 👇 ВЫБОР ТИПА ЭКЗАМЕНА */}
                        <CustomSelect options={typeOptions} value={filters.type} onChange={v => setFilters({...filters, type: v})} placeholder="Тип экзамена" />
                    </div>
                </div>
                <div style={{display:'flex', gap:10, marginTop:10}}>
                    <button style={styles.btnExport} onClick={handleExportExcel}>Скачать Excel (CSV)</button>
                    <button style={styles.btnExportOutline} onClick={() => window.print()}>Печать / PDF</button>
                </div>
            </div>

            <div style={styles.statsGrid}>
                <StatCard title="Средний балл" value={data.kpi.avgScore} subtitle="По выбранным фильтрам" icon="📊" color="#6366f1" />
                <StatCard title="Успеваемость" value={`${data.kpi.passRate}%`} subtitle="Преодолели порог" icon="🎓" color="#10b981" />
                <StatCard title="Индекс списывания" value={`${data.kpi.cheatingIndex}%`} subtitle="Сессии с нарушениями" icon="👁️" color="#ef4444" />
                <StatCard title="Всего экзаменов" value={data.kpi.totalExams} subtitle="За период" icon="📝" color="#f59e0b" />
            </div>

            <div style={styles.gridTwo}>
                <div style={styles.card} className="card">
                    <h3 style={{...styles.cardTitle, color: 'inherit'}}>Распределение баллов</h3>
                    <div style={styles.chartContainer}>
                        <div style={styles.barChart}>
                            {data.distribution.map((item, idx) => (
                                <div key={idx} style={styles.barColumn}>
                                    <div style={{
                                        height: `${item.count > 0 ? (item.count / (data.kpi.totalExams || 1)) * 200 : 5}px`, 
                                        background: item.color, 
                                        ...styles.bar, 
                                        minHeight:5
                                    }}>
                                        <div style={styles.barTooltip}>{item.count}</div>
                                    </div>
                                    <span style={styles.barLabel}>{item.range}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={styles.card} className="card">
                    <h3 style={{...styles.cardTitle, color: 'inherit'}}>Трудные вопросы (Топ 5)</h3>
                    <div style={{overflowY:'auto', maxHeight:250}}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{...styles.th, color: '#64748b'}}>Вопрос</th>
                                    <th style={{...styles.th, color: '#64748b', width: 80}}>Верно</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.difficultQuestions && data.difficultQuestions.length > 0 ? data.difficultQuestions.map(q => (
                                    <tr key={q.id}>
                                        <td style={{...styles.td, color: 'inherit'}}>{q.text}</td>
                                        <td style={{...styles.td, color: 'inherit'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                                <div style={{flex:1, height:6, background:'#e2e8f0', borderRadius:3, overflow:'hidden', width:50}}>
                                                    <div style={{width:`${q.correctRate}%`, background: q.correctRate < 30 ? '#ef4444' : '#f59e0b', height:'100%'}}></div>
                                                </div>
                                                <span style={{fontSize:12, fontWeight:'bold'}}>{q.correctRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" style={{...styles.td, textAlign:'center', color:'#64748b', padding: 20}}>
                                            Нет данных о прохождении тестов
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div style={{...styles.card, marginTop:24}} className="card">
                <h3 style={{...styles.cardTitle, color: 'inherit'}}>Матрица ответов (Heatmap)</h3>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                    {data.heatmap && data.heatmap.length > 0 ? data.heatmap.map((h, i) => (
                         <div key={i} title={`Вопрос ID:${h.q} | Верно: ${h.val}%`} style={{
                             width: 36, height: 36, borderRadius: 6, display:'flex', alignItems:'center', justifyContent:'center',
                             fontSize: 11, fontWeight: 'bold', color: 'rgba(255,255,255,0.9)',
                             background: h.val > 70 ? '#10b981' : h.val > 40 ? '#f59e0b' : '#ef4444',
                             opacity: 0.8, cursor:'pointer'
                         }}>
                             {i+1}
                         </div>
                    )) : (
                        <div style={{color:'#64748b'}}>Нет данных для отображения</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardTab = ({ stats, sessions, violations }) => (
  <div className="fade-in">
    <div style={styles.statsGrid}>
      <StatCard title="Студенты" value={stats.users?.students || 0} subtitle="Всего в базе" icon={<UsersIcon />} color="#6366f1" />
      <StatCard title="Активные тесты" value={stats.tests?.active || 0} subtitle="Доступно сейчас" icon={<TestsIcon />} color="#10b981" />
      <StatCard title="Нарушения" value={stats.violations?.total || 0} subtitle="За все время" icon={<ViolationsIcon />} color="#ef4444" />
      <StatCard title="Сессии" value={stats.sessions?.total || 0} subtitle="Проведенных экзаменов" icon={<SessionsIcon />} color="#f59e0b" />
    </div>

    <div style={styles.gridTwo}>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Последние сессии</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
             <thead><tr><th style={styles.th}>Студент</th><th style={styles.th}>Тест</th><th style={styles.th}>Статус</th></tr></thead>
             <tbody>
                {sessions.map(s => (
                    <tr key={s.id}>
                        <td style={styles.td}>{s.user_name}</td>
                        <td style={styles.td}>{s.test_name}</td>
                        <td style={styles.td}>{s.end_time ? <StatusBadge status="completed" /> : <StatusBadge status="active" />}</td>
                    </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Последние нарушения</h3>
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead><tr><th style={styles.th}>Студент</th><th style={styles.th}>Причина</th><th style={styles.th}>Время</th></tr></thead>
                <tbody>
                    {violations.map(v => (
                        <tr key={v.id}>
                            <td style={styles.td}>{v.user_name}</td>
                            <td style={{...styles.td, color:'#f87171'}}>{v.data?.reason || v.event}</td>
                            <td style={styles.td}>{new Date(v.event_time).toLocaleTimeString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  </div>
);

const UsersTab = ({ users, onDelete, onAdd }) => (
    <div className="fade-in">
        <div style={styles.toolbar}>
             <input type="text" placeholder="Поиск пользователей..." style={styles.searchBox} />
             <button style={styles.addBtn} onClick={onAdd}>+ Добавить пользователя</button>
        </div>
        <div style={styles.card}>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Имя</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Роль</th>
                            <th style={styles.th}>Школа / Класс</th>
                            <th style={styles.th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={styles.td}>{u.id}</td>
                                <td style={{...styles.td, fontWeight:'bold'}}>{u.full_name}</td>
                                <td style={styles.td}>{u.email}</td>
                                <td style={styles.td}>
                                    <span style={u.role==='admin' ? styles.badgeAdmin : styles.badgeStudent}>
                                        {u.role === 'admin' ? 'Админ' : 'Студент'}
                                    </span>
                                </td>
                                <td style={styles.td}>{u.school || '-'} {u.class ? `(${u.class})` : ''}</td>
                                <td style={styles.td}>
                                    <button style={styles.iconBtnDel} onClick={()=>onDelete(u.id)} title="Удалить">🗑</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const TestsTab = ({ tests, onDelete, onToggle, onEdit, onAdd }) => (
    <div className="fade-in">
        <div style={styles.toolbar}>
            <div style={{color:'#94a3b8'}}>Всего тестов: {tests.length}</div>
            <button style={styles.addBtn} onClick={onAdd}>+ Создать тест</button>
        </div>
        <div style={styles.testsGrid}>
            {tests.map(t => (
                <div key={t.id} style={styles.testCard}>
                    <div style={styles.testCardHeader}>
                        <span style={{...styles.typeBadge, 
                            background: t.type==='ENT' ? '#6366f120' : '#10b98120', 
                            color: t.type==='ENT' ? '#818cf8' : '#34d399'
                        }}>{t.type}</span>
                        <div style={{...styles.statusDot, background: t.published ? '#10b981' : '#64748b'}}></div>
                    </div>
                    <h3 style={styles.testCardTitle}>{t.name}</h3>
                    <p style={styles.testCardSubject}>{t.subject} • {t.duration_minutes} мин</p>
                    
                    <div style={styles.testCardActions}>
                        <button 
                            style={{...styles.btnStatus, background: t.published ? '#10b98120' : '#47556920', color: t.published ? '#34d399' : '#94a3b8'}}
                            onClick={()=>onToggle(t)}
                        >
                            {t.published ? 'Активен' : 'Скрыт'}
                        </button>
                        <div style={{display:'flex', gap:8}}>
                             <button style={styles.btnIconAction} onClick={()=>onEdit(t.id)} title="Редактировать">✏️</button>
                             <button style={{...styles.btnIconAction, color:'#f87171', background:'#ef444420'}} onClick={()=>onDelete(t.id)} title="Удалить">🗑</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SessionsTab = ({ sessions, onVideo, onViewViolations }) => (
    <div className="fade-in">
        <div style={styles.card}>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Студент</th>
                            <th style={styles.th}>Тест</th>
                            <th style={styles.th}>Балл</th>
                            <th style={styles.th}>Видео</th>
                            <th style={styles.th}>Нарушения</th>
                            <th style={styles.th}>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(s => (
                            <tr key={s.id}>
                                <td style={styles.td}>{s.id}</td>
                                <td style={styles.td}>
                                    <div style={{fontWeight:'bold'}}>{s.user_name}</div>
                                    <div style={{fontSize:11, opacity:0.6}}>ID: {s.user_id}</div>
                                </td>
                                <td style={styles.td}>{s.test_name}</td>
                                <td style={styles.td}><span style={styles.scoreBadge}>{s.score}</span></td>
                                <td style={styles.td}>
                                    {s.recording_links?.length > 0 ? (
                                        <button style={styles.btnLink} onClick={() => onVideo(s.recording_links[0])}>▶ Play</button>
                                    ) : <span style={{opacity:0.3}}>-</span>}
                                </td>
                                <td style={styles.td}>
                                    {parseInt(s.violations_count) > 0 ? (
                                        <button style={styles.violationBtn} onClick={onViewViolations}>⚠️ {s.violations_count}</button>
                                    ) : <span style={{color:'#10b981'}}>Нет</span>}
                                </td>
                                <td style={styles.td}>
                                    {s.end_time ? <StatusBadge status="completed"/> : <StatusBadge status="active"/>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ViolationsTab = ({ violations, onScreenshot }) => (
    <div className="fade-in">
        <div style={styles.card}>
            <table style={styles.table}>
                <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Студент</th><th style={styles.th}>Нарушение</th><th style={styles.th}>Время</th><th style={styles.th}>Фото</th></tr></thead>
                <tbody>
                    {violations.map(v => (
                        <tr key={v.id}>
                            <td style={styles.td}>{v.id}</td>
                            <td style={styles.td}>{v.user_name}</td>
                            <td style={{...styles.td, color:'#f87171', fontWeight:'500'}}>{v.data?.reason || v.event}</td>
                            <td style={styles.td}>{new Date(v.event_time).toLocaleString()}</td>
                            <td style={styles.td}>
                                {v.data?.snapshot ? (
                                    <button style={styles.btnPrimaryOutline} onClick={()=>onScreenshot(v.data.snapshot)}>Фото</button>
                                ) : <span style={{opacity:0.3}}>-</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// === MODALS COMPONENTS ===

const UserModal = ({ onClose, onSave, schools = [] }) => {
    const [form, setForm] = useState({ full_name:'', email:'', password:'', role:'student', telegram_id:'', school:'', className:'' });
    
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modal} onClick={e=>e.stopPropagation()}>
                <h3 style={styles.modalTitle}>Новый пользователь</h3>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>ФИО</label>
                    <input style={styles.input} onChange={e=>setForm({...form, full_name:e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input style={styles.input} onChange={e=>setForm({...form, email:e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Пароль</label>
                    <input style={{...styles.input, borderColor:'#6366f1'}} placeholder="Обязательно" onChange={e=>setForm({...form, password:e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Роль</label>
                    <select style={styles.select} onChange={e=>setForm({...form, role:e.target.value})}>
                        <option value="student">Студент</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>

                {form.role === 'student' && (
                    <div style={{display:'flex', gap:10}}>
                         <div style={{flex: 2}}>
                             <CustomSelect 
                                placeholder="Выберите школу"
                                options={schools.map(s => ({ value: s.name, label: s.name }))} 
                                value={form.school} 
                                onChange={(val) => setForm({...form, school: val})} 
                            />
                         </div>
                         
                         <div style={{flex: 1}}>
                            <input 
                                type="text"
                                inputMode="numeric"
                                style={styles.input} 
                                placeholder="Класс (1-13)"
                                value={form.className || ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') { setForm({...form, className: ''}); return; }
                                    if (/^\d+$/.test(val)) {
                                        const num = parseInt(val, 10);
                                        if (num >= 1 && num <= 13) setForm({...form, className: val});
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
                
                {form.role === 'admin' && (
                    <input style={styles.input} placeholder="Telegram ID" onChange={e=>setForm({...form, telegram_id:e.target.value})} />
                )}
                
                <div style={styles.modalFooter}>
                    <button onClick={onClose} style={styles.btnSecondary}>Отмена</button>
                    <button onClick={()=>onSave(form)} style={styles.btnPrimary}>Сохранить</button>
                </div>
            </div>
        </div>
    );
};

const TestModal = ({ testId, onClose, onSave }) => {
    const [meta, setMeta] = useState({ name:'', subject:'', type:'ENT', duration_minutes:60, published:true });
    const [qs, setQs] = useState([{ text:'', points:1, options:[{id:'1', text:''},{id:'2', text:''},{id:'3', text:''},{id:'4', text:''}], correctAnswer:'1' }]);

    useEffect(() => {
        if(testId) {
            fetcher(`/tests/${testId}/full`).then(d => {
                setMeta(d.test);
                const loadedQs = d.questions.map(q => ({
                    text: q.text,
                    points: q.points || 1,
                    options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
                    correctAnswer: String(q.correct_answers).replace(/['"]+/g, '')
                }));
                setQs(loadedQs);
            });
        }
    }, [testId]);

    const addQ = () => setQs([...qs, { text:'', points:1, options:[{id:'1', text:''},{id:'2', text:''},{id:'3', text:''},{id:'4', text:''}], correctAnswer:'1' }]);
    const updQ = (i, f, v) => { const n=[...qs]; n[i][f]=v; setQs(n); }
    const updOpt = (qi, oi, v) => { const n=[...qs]; n[qi].options[oi].text=v; setQs(n); }

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{...styles.modal, width:'900px', maxWidth:'95vw', height:'90vh', display:'flex', flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
                <div style={{marginBottom:20}}>
                    <h3 style={styles.modalTitle}>{testId ? 'Редактирование' : 'Создание'} теста</h3>
                    <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:15}}>
                        <input style={styles.input} placeholder="Название" value={meta.name} onChange={e=>setMeta({...meta, name:e.target.value})} />
                        <input style={styles.input} placeholder="Предмет" value={meta.subject} onChange={e=>setMeta({...meta, subject:e.target.value})} />
                        <select style={styles.select} value={meta.type} onChange={e=>setMeta({...meta, type:e.target.value})}>
                             <option value="ENT">ENT</option><option value="MODO">MODO</option><option value="PISA">PISA</option>
                        </select>
                        <input style={styles.input} type="number" placeholder="Мин" value={meta.duration_minutes} onChange={e=>setMeta({...meta, duration_minutes:e.target.value})} />
                    </div>
                </div>

                <div style={{flex:1, overflowY:'auto', paddingRight:10}}>
                    {qs.map((q, i) => (
                        <div key={i} style={styles.questionCard}>
                             <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                                 <div style={{fontWeight:'bold', color:'#94a3b8'}}>Вопрос {i+1}</div>
                                 <button onClick={()=>setQs(qs.filter((_,idx)=>idx!==i))} style={styles.btnLinkRed}>Удалить</button>
                             </div>
                             <div style={{display:'flex', gap:10, marginBottom:10}}>
                                <input style={{...styles.input, flex:1}} placeholder="Текст вопроса" value={q.text} onChange={e=>updQ(i,'text',e.target.value)} />
                                <input style={{...styles.input, width:70}} type="number" value={q.points} onChange={e=>updQ(i,'points',e.target.value)} placeholder="Балл"/>
                             </div>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                {q.options.map((o, oi) => (
                                    <div key={oi} style={styles.optionRow}>
                                        <input type="radio" checked={String(q.correctAnswer)===String(o.id)} onChange={()=>updQ(i,'correctAnswer',String(o.id))} style={{accentColor:'#6366f1'}}/>
                                        <input style={{...styles.input, marginBottom:0, fontSize:13, padding:8}} placeholder={`Вариант ${oi+1}`} value={o.text} onChange={e=>updOpt(i,oi,e.target.value)}/>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                    <button onClick={addQ} style={styles.btnAddDashed}>+ Добавить вопрос</button>
                </div>

                <div style={styles.modalFooter}>
                    <button onClick={onClose} style={styles.btnSecondary}>Отмена</button>
                    <button onClick={()=>onSave({...meta, questions:qs})} style={styles.btnPrimary}>Сохранить тест</button>
                </div>
            </div>
        </div>
    )
}

// === HELPERS ===
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: `${color}20`, color }}>{icon}</div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statSubtitle}>{subtitle}</div>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick, collapsed, badge, badgeColor = "#6366f1" }) => (
  <div onClick={onClick} style={{...styles.navItem, ...(active ? styles.navItemActive : {})}}>
    <div style={styles.navIcon}>{icon}</div>
    {!collapsed && <span style={styles.navLabel}>{label}</span>}
    {!collapsed && badge > 0 && <span style={{ ...styles.navBadge, background: badgeColor }}>{badge}</span>}
  </div>
);

const StatusBadge = ({ status }) => ( 
    <span style={{...styles.badge, background: status==='completed' ? '#10b98120' : '#f59e0b20', color: status==='completed' ? '#10b981' : '#f59e0b'}}>
        {status === 'completed' ? 'Завершен' : 'Активен'}
    </span> 
);

// === ICONS ===
const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
const AnalyticsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const TestsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
const SessionsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const ViolationsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

// === GLOBAL & STYLES ===
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); min-height: 100vh; overflow-x: hidden; color: #e2e8f0; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-option:hover { background: rgba(99, 102, 241, 0.15) !important; color: white !important; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); borderRadius: 4px; }
  `}</style>
);

const styles = {
  container: { display: "flex", minHeight: "100vh" },
  sidebar: { background: "rgba(15, 12, 41, 0.95)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 16px", height: "100vh", position: "sticky", top: 0, transition: "width 0.3s ease", zIndex: 50 },
  nav: { display: "flex", flexDirection: "column", gap: "6px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", color: "#94a3b8", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "all 0.2s" },
  navItemActive: { background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" },
  navIcon: { display: "flex", alignItems: "center", justifyContent: "center", width: "24px" },
  navBadge: { marginLeft: "auto", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", color: "#fff" },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: "10px" },
  collapseBtn: { width: "100%", padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", color: "#64748b", cursor: "pointer" },
  logoutBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", color: "#ef4444", fontWeight: "600", fontSize: "14px", cursor: "pointer", transition: "0.2s" },
  divider: { height:1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' },
  main: { flexGrow: 1, padding: "32px 40px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  pageTitle: { fontSize: "28px", fontWeight: "800", color: "#fff", marginBottom: "6px" },
  pageSubtitle: { color: "#94a3b8", fontSize: "15px" },
  adminBadge: { background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "8px 16px", borderRadius: "20px", color: "#a5b4fc", fontWeight: "600", fontSize: "13px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" },
  statCard: { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "20px" },
  statIcon: { width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize:20 },
  statValue: { fontSize: "28px", fontWeight: "800", color: "#fff" },
  statTitle: { fontSize: "14px", color: "#94a3b8", marginTop: "2px" },
  statSubtitle: { fontSize: "12px", color: "#64748b" },
  card: { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px", display:'flex', flexDirection:'column' },
  cardTitle: { fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "20px" },
  gridTwo: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  td: { padding: "16px 16px", fontSize: "14px", color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.03)" },
  badge: { padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" },
  badgeStudent: { background: 'rgba(99,102,241,0.15)', color:'#818cf8', padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:600 },
  badgeAdmin: { background: 'rgba(168, 85, 247, 0.15)', color:'#c084fc', padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:600 },
  scoreBadge: { background: '#1e293b', padding:'4px 10px', borderRadius:6, fontWeight:'bold', border:'1px solid #334155' },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  searchBox: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "white", width: 300, outline:'none' },
  addBtn: { background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", borderRadius: "10px", padding: "10px 20px", color: "#fff", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
  filterBar: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap:'wrap', gap:10 },
  filterSelect: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '10px 14px', borderRadius: 8, outline: 'none', cursor:'pointer' },
  btnExport: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, transition:'0.2s', fontSize:13 },
  btnExportOutline: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: '#64748b', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize:13 },
  chartContainer: { height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px 0' },
  barChart: { display: 'flex', gap: 40, alignItems: 'flex-end', height: '100%' },
  barColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height:'100%', justifyContent:'flex-end' },
  bar: { width: 50, borderRadius: '8px 8px 0 0', position: 'relative', transition: 'height 0.5s ease', cursor:'pointer' },
  barLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },
  barTooltip: { position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 'bold', whiteSpace:'nowrap' },
  testsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
  testCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px" },
  testCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  typeBadge: { padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%" },
  testCardTitle: { fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "4px" },
  testCardSubject: { fontSize: "13px", color: "#94a3b8", marginBottom: "20px" },
  testCardActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
  btnStatus: { padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", flex: 1, marginRight: 10 },
  btnIconAction: { background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", width: 34, height: 34, color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" },
  btnPrimary: { background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", borderRadius: "10px", padding: "10px 20px", color: "#fff", fontWeight: "600", cursor: "pointer" },
  btnSecondary: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 20px", color: "#e2e8f0", fontWeight: "600", cursor: "pointer" },
  btnPrimaryOutline: { background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "8px", padding: "8px 16px", color: "#a5b4fc", cursor: "pointer", fontSize: 13 },
  btnLink: { background: 'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:13, fontWeight:'600'},
  btnLinkRed: { background: 'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:13 },
  iconBtnDel: { background: "rgba(239, 68, 68, 0.15)", border: "none", borderRadius: "8px", width:30, height:30, color: "#f87171", cursor: "pointer", display:'flex', alignItems:'center', justifyContent:'center' },
  violationBtn: { background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "4px 8px", color: "#f87171", fontWeight:'bold', fontSize:12, cursor:'pointer' },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "32px", width: "450px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" },
  modalTitle: { fontSize: "22px", fontWeight: "700", color: "#fff", marginBottom: "24px" },
  modalFooter: { display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: 24 },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "8px", fontWeight: "600" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none" },
  select: { width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "14px", outline: "none" },
  questionCard: { background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 15 },
  optionRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  btnAddDashed: { width: '100%', padding: 12, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: '#94a3b8', borderRadius: 10, cursor: 'pointer', marginTop: 10 },
  toast: { position: 'fixed', bottom: 30, right: 30, background: '#1e293b', border: '1px solid #334155', padding: '15px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999, animation: 'slideIn 0.3s ease-out' },
  mediaOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 },
  mediaContainer: { width: '90%', maxWidth: '1000px', background: '#0f0c29', border: '1px solid #334155', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  mediaHeader: { padding: '16px 24px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  mediaCloseBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: 24, cursor: 'pointer' },
  mediaContentWrapper: { padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black', minHeight: 400 },
  mediaContent: { maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, boxShadow: '0 0 30px rgba(0,0,0,0.5)' }
};

const CustomSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => String(o.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.custom-select-container')) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="custom-select-container" style={{position: 'relative', width: '100%'}}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...styles.input, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderColor: isOpen ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'
                }}
            >
                <span style={{color: selectedOption ? 'white' : '#94a3b8', fontSize:13, fontWeight:500}}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span style={{transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', fontSize: 10, opacity: 0.7, color:'#94a3b8'}}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    maxHeight: 250,
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: 4
                }}>
                    {options.length > 0 ? options.map(opt => (
                        <div 
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className="custom-option"
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: String(value) === String(opt.value) ? '#818cf8' : '#e2e8f0',
                                borderRadius: 6,
                                marginBottom: 2,
                                fontWeight: String(value) === String(opt.value) ? 600 : 400,
                                background: String(value) === String(opt.value) ? 'rgba(99,102,241,0.1)' : 'transparent'
                            }}
                        >
                            {opt.label}
                        </div>
                    )) : (
                        <div style={{padding: 10, color:'#64748b', textAlign:'center', fontSize:13}}>Нет данных</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;