import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "katex/dist/katex.min.css"; // Стили для формул
import { InlineMath } from "react-katex"; // Компонент для формул

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
  const [schools, setSchools] = useState([]);

  // АНАЛИТИКА STATE
  const [reportsData, setReportsData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "week",
    schoolId: "all",
    type: "all",
  });

  // === UI STATE ===
  const [toast, setToast] = useState(null);

  // === MODALS STATE ===
  const [showUserModal, setShowUserModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);

  // === MEDIA PREVIEW STATE ===
  const [mediaPreview, setMediaPreview] = useState(null);

  const notify = (msg, type = "success") => {
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

      if (activeTab === "users") setUsers(await fetcher(`/users?t=${time}`));
      if (activeTab === "tests") setTests(await fetcher(`/tests?t=${time}`));
      if (activeTab === "sessions")
        setSessions(await fetcher(`/sessions?t=${time}`));

      if (activeTab === "analytics") {
        const queryParams = new URLSearchParams({
          dateRange: filters.dateRange,
          schoolId: filters.schoolId,
          type: filters.type,
        }).toString();

        try {
          const data = await fetcher(`/reports?${queryParams}`);
          setReportsData(data);
        } catch (e) {
          console.error("Ошибка аналитики", e);
          setReportsData({
            kpi: { avgScore: 0, passRate: 0, cheatingIndex: 0, totalExams: 0 },
            distribution: [],
            difficultQuestions: [],
            heatmap: [],
          });
        }
      }

      if (activeTab === "dashboard") {
        const sess = await fetcher(`/sessions?t=${time}`);
        setSessions(sess.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  // === HANDLERS ===
  const deleteItem = async (type, id) => {
    if (!window.confirm("Подтвердите удаление")) return;
    try {
      await fetcher(`/${type}/${id}`, { method: "DELETE" });
      notify("Успешно удалено");
      loadData();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const toggleTest = async (test) => {
    const newValue = !test.published;
    try {
      await fetcher(`/tests/${test.id}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newValue }),
      });
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, published: newValue } : t))
      );
      notify(newValue ? "Тест опубликован" : "Тест скрыт");
    } catch (e) {
      notify(e.message, "error");
      loadData();
    }
  };

  const saveUser = async (data) => {
    try {
      await fetcher("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowUserModal(false);
      notify("Пользователь создан");
      loadData();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const saveTest = async (data) => {
    try {
      const url = editingTestId ? `/tests/${editingTestId}` : "/tests";
      const method = editingTestId ? "PUT" : "POST";
      await fetcher(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowTestModal(false);
      setEditingTestId(null);
      notify(editingTestId ? "Тест обновлен" : "Тест создан");
      loadData();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const openTestEditor = (id) => {
    setEditingTestId(id);
    setShowTestModal(true);
  };

  const handleLogout = () => {
    if (window.confirm("Выйти из системы?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab stats={stats} sessions={sessions} />;
      case "users":
        return (
          <UsersTab
            users={users}
            onDelete={(id) => deleteItem("users", id)}
            onAdd={() => setShowUserModal(true)}
          />
        );
      case "tests":
        return (
          <TestsTab
            tests={tests}
            onDelete={(id) => deleteItem("tests", id)}
            onToggle={toggleTest}
            onEdit={openTestEditor}
            onAdd={() => {
              setEditingTestId(null);
              setShowTestModal(true);
            }}
          />
        );
      case "sessions":
        return (
          <SessionsTab
            sessions={sessions}
            onVideo={(src) => setMediaPreview({ type: "video", src })}
          />
        );
      case "analytics":
        return (
          <AnalyticsTab
            data={reportsData}
            filters={filters}
            setFilters={setFilters}
            schools={schools}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <GlobalStyles />
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? "80px" : "280px",
        }}
      >
        <div>
          <nav style={styles.nav}>
            <NavItem
              icon={<DashboardIcon />}
              label="Дашборд"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              collapsed={sidebarCollapsed}
            />
            <NavItem
              icon={<AnalyticsIcon />}
              label="Аналитика"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              collapsed={sidebarCollapsed}
            />
            <div style={styles.divider} />
            <NavItem
              icon={<UsersIcon />}
              label="Пользователи"
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              collapsed={sidebarCollapsed}
              badge={stats.users?.students}
            />
            <NavItem
              icon={<TestsIcon />}
              label="Тесты"
              active={activeTab === "tests"}
              onClick={() => setActiveTab("tests")}
              collapsed={sidebarCollapsed}
              badge={stats.tests?.active}
            />
            <NavItem
              icon={<SessionsIcon />}
              label="Сессии"
              active={activeTab === "sessions"}
              onClick={() => setActiveTab("sessions")}
              collapsed={sidebarCollapsed}
            />
          </nav>
        </div>
        <div style={styles.sidebarBottom}>
          <button
            style={styles.collapseBtn}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: sidebarCollapsed ? "rotate(180deg)" : "none",
              }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === "analytics"
                ? "Отчеты и Аналитика"
                : "Панель управления"}
            </h1>
            <p style={styles.pageSubtitle}>Система тестирования JANA TEST</p>
          </div>
          <div style={styles.adminBadge}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
              }}
            ></div>
            Администратор
          </div>
        </header>
        {renderContent()}
      </main>

      {toast && (
        <div
          style={{
            ...styles.toast,
            borderLeft:
              toast.type === "error"
                ? "4px solid #ef4444"
                : "4px solid #10b981",
          }}
        >
          <div style={{ marginRight: 10 }}>
            {toast.type === "error" ? "🚫" : "✅"}
          </div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 14 }}>
              {toast.type === "error" ? "Ошибка" : "Успешно"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{toast.msg}</div>
          </div>
        </div>
      )}

      {showUserModal && (
        <UserModal
          schools={schools}
          onClose={() => setShowUserModal(false)}
          onSave={saveUser}
        />
      )}

      {showTestModal && (
        <TestModal
          testId={editingTestId}
          onClose={() => setShowTestModal(false)}
          onSave={saveTest}
        />
      )}

      {mediaPreview && (
        <div style={styles.mediaOverlay} onClick={() => setMediaPreview(null)}>
          <div
            style={styles.mediaContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.mediaHeader}>
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {mediaPreview.type === "video"
                  ? "📹 Запись сессии"
                  : "📸 Снимок"}
              </span>
              <button
                onClick={() => setMediaPreview(null)}
                style={styles.mediaCloseBtn}
              >
                ✕
              </button>
            </div>
            <div style={styles.mediaContentWrapper}>
              {mediaPreview.type === "video" ? (
                <video
                  src={`${VIDEOS_URL}/${mediaPreview.src}`}
                  controls
                  autoPlay
                  style={styles.mediaContent}
                />
              ) : (
                <img
                  src={`${UPLOADS_URL}/${mediaPreview.src}`}
                  style={styles.mediaContent}
                  alt="Evidence"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// === TAB COMPONENTS ===

const TestsTab = ({ tests, onDelete, onToggle, onEdit, onAdd }) => {
  return (
    <div className="fade-in">
      <div style={styles.toolbar}>
        <div style={{ color: "#64748b" }}>
          Всего тестов: <b>{tests.length}</b>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.addBtn} onClick={onAdd}>
            + Создать тест
          </button>
        </div>
      </div>
      <div style={styles.testsGrid}>
        {tests.map((t) => (
          <div key={t.id} style={styles.testCard}>
            <div style={styles.testCardHeader}>
              <span
                style={{
                  ...styles.typeBadge,
                  background: t.type === "ENT" ? "#eef2ff" : "#ecfdf5",
                  color: t.type === "ENT" ? "#6366f1" : "#10b981",
                }}
              >
                {t.type}
              </span>
              <div
                style={{
                  ...styles.statusDot,
                  background: t.published ? "#10b981" : "#cbd5e1",
                }}
              ></div>
            </div>
            <h3 style={styles.testCardTitle}>{t.name}</h3>
            <p style={styles.testCardSubject}>
              {t.subject} • {t.duration_minutes} мин
            </p>
            <div style={styles.testCardActions}>
              <button
                style={{
                  ...styles.btnStatus,
                  background: t.published ? "#f0fdf4" : "#f1f5f9",
                  color: t.published ? "#15803d" : "#64748b",
                }}
                onClick={() => onToggle(t)}
              >
                {t.published ? "Активен" : "Скрыт"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={styles.btnIconAction}
                  onClick={() => onEdit(t.id)}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  style={{
                    ...styles.btnIconAction,
                    color: "#ef4444",
                    background: "#fef2f2",
                  }}
                  onClick={() => onDelete(t.id)}
                  title="Удалить"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// === TEST MODAL (С ФОТО В ВОПРОСАХ И ОТВЕТАХ) ===
const LatexKeyboard = ({ open, onClose, onInsert }) => {
  const [tab, setTab] = useState("ALG");
  if (!open) return null;

  const TABS = [
    { id: "ALG", label: "Алгебра" },
    { id: "CHEM", label: "Химия" },
    { id: "PHYS", label: "Физика" },
  ];

  const KEYS = {
    ALG: [
      { label: "√", tex: "\\sqrt{▯}" },
      { label: "x²", tex: "^{▯}" },
      { label: "xₙ", tex: "_{▯}" },
      { label: "a/b", tex: "\\frac{▯}{}" },
      { label: "∑", tex: "\\sum_{▯}^{}" },
      { label: "∫", tex: "\\int_{▯}^{}" },
      { label: "lim", tex: "\\lim_{▯}" },
      { label: "∞", tex: "\\infty" },
      { label: "π", tex: "\\pi" },
      { label: "≤", tex: "\\leq " },
      { label: "≥", tex: "\\geq " },
      { label: "≠", tex: "\\neq " },
      { label: "≈", tex: "\\approx " },
    ],
    CHEM: [
      { label: "₂", tex: "_{2}" },
      { label: "ₙ", tex: "_{▯}" },
      { label: "→", tex: "\\rightarrow " },
      { label: "⇌", tex: "\\rightleftharpoons " },
      { label: "H₂O", tex: "H_2O" },
      { label: "CO₂", tex: "CO_2" },
      { label: "H⁺", tex: "H^{+}" },
      { label: "OH⁻", tex: "OH^{-}" },
    ],
    PHYS: [
      { label: "→в", tex: "\\vec{▯}" },
      { label: "Δ", tex: "\\Delta " },
      { label: "λ", tex: "\\lambda" },
      { label: "ω", tex: "\\omega" },
      { label: "Ω", tex: "\\Omega" },
      { label: "∂", tex: "\\partial " },
      { label: "∇", tex: "\\nabla " },
      { label: "≈", tex: "\\approx " },
      { label: "±", tex: "\\pm " },
      { label: "°", tex: "^{\\circ}" },
    ],
  };

  const insertKey = (tex) => onInsert(tex);

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 50,
        background: "#fff",
        borderTop: "1px solid #e2e8f0",
        padding: 12,
        marginTop: 12,
        borderRadius: 12,
        boxShadow: "0 -6px 20px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                border: "1px solid #cbd5e1",
                background: tab === t.id ? "#eef2ff" : "#fff",
                color: tab === t.id ? "#4f46e5" : "#334155",
                padding: "6px 10px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#334155",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {KEYS[tab].map((k, idx) => (
          <button
            key={idx}
            onClick={() => insertKey(k.tex)}
            style={{
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#0f172a",
              padding: "8px 10px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
            title={k.tex}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const TestModal = ({ testId, onClose, onSave }) => {
  const [meta, setMeta] = useState({
    name: "",
    subject: "",
    type: "ENT",
    duration_minutes: 60,
    published: true,
  });

  const [kbOpen, setKbOpen] = useState(false);
  const activeFieldRef = useRef(null);
  const caretRef = useRef({ start: 0, end: 0 });

  // ✅ ВАЖНО: один общий groupId для первого текста и первого вопроса
  const initialPid = `p-${Date.now()}`;

  // Структура вопроса: text, points, image, options:[{id, text, image}]
  // ДОБАВЛЕНО: в qs могут быть элементы "пассаж/текст" (isPassage: true)
  const [qs, setQs] = useState([
    {
      isPassage: true,
      text: "",
      image: null,
      groupId: initialPid,
    },
    {
      text: "",
      points: 1,
      image: null,
      groupId: initialPid, // ✅ чтобы сразу было "Вопрос 1"
      options: Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        text: "",
        image: null,
      })),
      correctAnswer: "1",
    },
  ]);

  const [uploadingId, setUploadingId] = useState(null);

  // ✅ нормализатор: вопросы без groupId привязываем к последнему тексту сверху
  const normalizeGroups = (arr) => {
    let currentPid = null;
    return arr.map((item) => {
      if (item?.isPassage) {
        currentPid = item.groupId || `p-${Date.now()}`;
        return { ...item, groupId: currentPid };
      }
      if (!item?.isPassage) {
        if (currentPid && !item.groupId) return { ...item, groupId: currentPid };
        return item;
      }
      return item;
    });
  };

  useEffect(() => {
    if (testId) {
      fetcher(`/tests/${testId}/full`).then((d) => {
        setMeta(d.test);

        const loadedQs = d.questions.map((q) => ({
          text: q.text,
          points: q.points || 1,
          image: q.image || null,
          groupId: q.groupId || null,
          isPassage: q.isPassage || false,
          options: (Array.isArray(q.options) ? q.options : JSON.parse(q.options)).map(
            (opt, idx) => ({
              id: String(opt.id ?? idx + 1),
              text: opt.text ?? "",
              image: opt.image || null,
            })
          ),
          correctAnswer: String(q.correct_answers).replace(/['"]+/g, ""),
        }));

        const hasPassage = loadedQs.some((x) => x?.isPassage);

        if (!hasPassage) {
          const pid = `p-${Date.now()}`;
          const patched = [
            { isPassage: true, text: "", image: null, groupId: pid },
            ...loadedQs.map((x) => ({ ...x, groupId: x.groupId || pid })),
          ];
          setQs(patched.length ? patched : qs);
        } else {
          setQs(loadedQs.length ? normalizeGroups(loadedQs) : qs);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const setActiveField = (meta) => (e) => {
    activeFieldRef.current = meta;
    const el = e.target;
    if (typeof el.selectionStart === "number") {
      caretRef.current = { start: el.selectionStart, end: el.selectionEnd };
    } else {
      caretRef.current = { start: 0, end: 0 };
    }
  };

  const updateCaret = (e) => {
    const el = e.target;
    if (typeof el.selectionStart === "number") {
      caretRef.current = { start: el.selectionStart, end: el.selectionEnd };
    }
  };

  const insertLatexToActive = (rawTex) => {
    const active = activeFieldRef.current;
    if (!active) return;

    const marker = "▯";
    const markerPos = rawTex.indexOf(marker);
    const tex = rawTex.replace(marker, "");

    const { start, end } = caretRef.current;

    // passage
    if (active.kind === "p") {
      const cur = qs[active.pi]?.text ?? "";
      const next = cur.slice(0, start) + tex + cur.slice(end);

      const n = [...qs];
      n[active.pi].text = next;
      setQs(n);

      requestAnimationFrame(() => {
        const el = document.querySelector(active.selector);
        if (!el) return;
        el.focus();
        const nextPos = markerPos >= 0 ? start + markerPos : start + tex.length;
        el.setSelectionRange(nextPos, nextPos);
        caretRef.current = { start: nextPos, end: nextPos };
      });
      return;
    }

    // question
    if (active.kind === "q") {
      const cur = qs[active.qi]?.text ?? "";
      const next = cur.slice(0, start) + tex + cur.slice(end);

      const n = [...qs];
      n[active.qi].text = next;
      setQs(n);

      requestAnimationFrame(() => {
        const el = document.querySelector(active.selector);
        if (!el) return;
        el.focus();
        const nextPos = markerPos >= 0 ? start + markerPos : start + tex.length;
        el.setSelectionRange(nextPos, nextPos);
        caretRef.current = { start: nextPos, end: nextPos };
      });
      return;
    }

    // option
    if (active.kind === "o") {
      const cur = qs[active.qi]?.options?.[active.oi]?.text ?? "";
      const next = cur.slice(0, start) + tex + cur.slice(end);

      const n = [...qs];
      n[active.qi].options[active.oi].text = next;
      setQs(n);

      requestAnimationFrame(() => {
        const el = document.querySelector(active.selector);
        if (!el) return;
        el.focus();
        const nextPos = markerPos >= 0 ? start + markerPos : start + tex.length;
        el.setSelectionRange(nextPos, nextPos);
        caretRef.current = { start: nextPos, end: nextPos };
      });
    }
  };

  // последний passage сверху вниз
  const getCurrentGroupId = () => {
  for (let i = qs.length - 1; i >= 0; i--) {
    if (qs[i]?.isPassage) {
      // ✅ если почему-то groupId потерялся — восстановим
      if (!qs[i].groupId) {
        const pid = `p-${Date.now()}`;
        const n = [...qs];
        n[i] = { ...n[i], groupId: pid };
        setQs(n);
        return pid;
      }
      return qs[i].groupId;
    }
  }
  // ✅ если текста вообще нет — создаём новый текст автоматически (чтобы не было “сиротских” вопросов)
  const pid = `p-${Date.now()}`;
  setQs([
    { isPassage: true, text: "", image: null, groupId: pid },
    ...qs.map((x) => (x?.isPassage ? x : { ...x, groupId: x.groupId || pid })),
  ]);
  return pid;
};


  const addPassage = () => {
  const pid = `p-${Date.now()}`;
  setQs([
    ...qs,
    {
      isPassage: true,
      text: "",
      image: null,
      groupId: pid,
    },
  ]);
};


  const addQ = () =>
    setQs([
      ...qs,
      {
        text: "",
        points: 1,
        image: null,
        groupId: getCurrentGroupId(),
        options: Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          text: "",
          image: null,
        })),
        correctAnswer: "1",
      },
    ]);

  const updQ = (i, f, v) => {
    const n = [...qs];
    n[i][f] = v;
    setQs(n);
  };

  const updOpt = (qi, oi, field, val) => {
    const n = [...qs];
    n[qi].options[oi][field] = val;
    setQs(n);
  };

  const handleQuestionImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(`${index}`);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Ошибка");
      const data = await res.json();
      updQ(index, "image", data.url);
    } catch (e) {
      alert("Не удалось загрузить фото");
    } finally {
      setUploadingId(null);
    }
  };

  const handleOptionImageUpload = async (e, qIndex, oIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(`${qIndex}-${oIndex}`);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Ошибка");
      const data = await res.json();
      updOpt(qIndex, oIndex, "image", data.url);
    } catch (e) {
      alert("Не удалось загрузить фото ответа");
    } finally {
      setUploadingId(null);
    }
  };

  // ✅ НУМЕРАЦИЯ: тексты 1..N, вопросы 1..N внутри каждого текста
  const questionIndexByGroup = {};
  let passageCounter = 0;
  let looseQuestionCounter = 0;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          width: "950px",
          maxWidth: "95vw",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={styles.modalTitle}>
            {testId ? "Редактирование" : "Создание"} теста
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 15,
            }}
          >
            <input
              style={styles.input}
              placeholder="Название"
              value={meta.name}
              onChange={(e) => setMeta({ ...meta, name: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Предмет"
              value={meta.subject}
              onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
            />
            <select
              style={styles.select}
              value={meta.type}
              onChange={(e) => setMeta({ ...meta, type: e.target.value })}
            >
              <option value="ENT">ENT</option>
              <option value="MODO">MODO</option>
              <option value="PISA">PISA</option>
            </select>
            <input
              style={styles.input}
              type="number"
              placeholder="Мин"
              value={meta.duration_minutes}
              onChange={(e) =>
                setMeta({ ...meta, duration_minutes: e.target.value })
              }
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: 10 }}>
          <div
            style={{
              background: "#eef2ff",
              padding: "10px 15px",
              borderRadius: 8,
              marginBottom: 15,
              fontSize: 13,
              color: "#4f46e5",
              border: "1px solid #c7d2fe",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              💡 <b>Формулы:</b> Используйте LaTeX. Пример: <code>H_2O</code> →{" "}
              <InlineMath math="H_2O" />, <code>\sqrt&#123;x^2&#125;</code> →{" "}
              <InlineMath math="\sqrt{x^2}" />. Картинки можно добавлять и к
              вопросам, и к ответам.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setKbOpen((v) => !v)}
                style={{
                  border: "1px solid #c7d2fe",
                  background: kbOpen ? "#4f46e5" : "#ffffff",
                  color: kbOpen ? "#ffffff" : "#4f46e5",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                }}
                title="Открыть виртуальную клавиатуру формул"
              >
                ⌨️ Формулы
              </button>

              <button
                onClick={addPassage}
                style={{
                  border: "1px solid #c7d2fe",
                  background: "#ffffff",
                  color: "#4f46e5",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                }}
                title="Добавить общий текст (пассаж)"
              >
                + Текст
              </button>

              <button
                onClick={addQ}
                style={{
                  border: "1px solid #c7d2fe",
                  background: "#ffffff",
                  color: "#4f46e5",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                }}
                title="Добавить вопрос (к последнему тексту сверху)"
              >
                + Вопрос
              </button>
            </div>
          </div>

          {qs.map((q, i) => {
            // PASSAGE
            if (q?.isPassage) {
              const gid = q.groupId || `p-${i}`;
              passageCounter += 1;
              questionIndexByGroup[gid] = 0; // сброс вопросов для этого текста

              return (
                <div
                  key={i}
                  style={{
                    ...styles.questionCard,
                    border: "2px solid #c7d2fe",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#334155", fontSize: 13 }}>
                      Текст {passageCounter}
                    </div>

                    <button
                      onClick={() => setQs(qs.filter((_, idx) => idx !== i))}
                      style={styles.btnLinkRed}
                    >
                      Удалить
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 15 }}>
                    <div style={{ flex: 1 }}>
                      <textarea
                        style={{
                          ...styles.input,
                          minHeight: 90,
                          fontFamily: "inherit",
                          resize: "vertical",
                          background: "#fff",
                        }}
                        placeholder="Текст (пассаж/условие) для нескольких вопросов ниже"
                        value={q.text}
                        onChange={(e) => updQ(i, "text", e.target.value)}
                        data-latex-id={`p-${i}`}
                        onFocus={setActiveField({
                          kind: "p",
                          pi: i,
                          selector: `[data-latex-id="p-${i}"]`,
                        })}
                        onClick={updateCaret}
                        onKeyUp={updateCaret}
                      />

                      {(q.text?.includes("\\") ||
                        q.text?.includes("_") ||
                        q.text?.includes("^")) && (
                        <div
                          style={{
                            marginTop: 6,
                            padding: 8,
                            background: "#fff",
                            borderRadius: 8,
                            border: "1px dashed #cbd5e1",
                            fontSize: 14,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Предпросмотр:
                          </span>
                          <InlineMath math={q.text} />
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        width: 180,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          border: "1px dashed #cbd5e1",
                          borderRadius: 12,
                          height: 100,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: q.image ? "#f1f5f9" : "#fff",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {q.image ? (
                          <>
                            <img
                              src={`${UPLOADS_URL}/${q.image}`}
                              alt="P"
                              style={{ maxWidth: "100%", maxHeight: "100%" }}
                            />
                            <button
                              onClick={() => updQ(i, "image", null)}
                              style={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                background: "#ef4444",
                                color: "#fff",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                              }}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <label
                            style={{
                              cursor: "pointer",
                              textAlign: "center",
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ fontSize: 24 }}>📷</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              {uploadingId === `${i}` ? "..." : "Фото"}
                            </span>
                            <input
                              type="file"
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={(e) => handleQuestionImageUpload(e, i)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // QUESTION
            const gid = q.groupId || null;

            let displayNum = 0;
            if (gid) {
              questionIndexByGroup[gid] = (questionIndexByGroup[gid] || 0) + 1;
              displayNum = questionIndexByGroup[gid];
            } else {
              looseQuestionCounter += 1;
              displayNum = looseQuestionCounter;
            }

            return (
              <div key={i} style={styles.questionCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#475569", fontSize: 13 }}>
                    Вопрос {displayNum}
                  </div>

                  <button
                    onClick={() => setQs(qs.filter((_, idx) => idx !== i))}
                    style={styles.btnLinkRed}
                  >
                    Удалить
                  </button>
                </div>

                {/* СЕКЦИЯ ВОПРОСА */}
                <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
                  <div style={{ flex: 1 }}>
                    <textarea
                      style={{
                        ...styles.input,
                        minHeight: 80,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                      placeholder="Текст вопроса"
                      value={q.text}
                      onChange={(e) => updQ(i, "text", e.target.value)}
                      data-latex-id={`q-${i}`}
                      onFocus={setActiveField({
                        kind: "q",
                        qi: i,
                        selector: `[data-latex-id="q-${i}"]`,
                      })}
                      onClick={updateCaret}
                      onKeyUp={updateCaret}
                    />

                    {(q.text.includes("\\") ||
                      q.text.includes("_") ||
                      q.text.includes("^")) && (
                      <div
                        style={{
                          marginTop: 5,
                          padding: 8,
                          background: "#fff",
                          borderRadius: 8,
                          border: "1px dashed #cbd5e1",
                          fontSize: 14,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          Предпросмотр:
                        </span>
                        <InlineMath math={q.text} />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      width: 180,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <input
                      style={{ ...styles.input, textAlign: "center" }}
                      type="number"
                      value={q.points}
                      onChange={(e) => updQ(i, "points", e.target.value)}
                      placeholder="Балл"
                    />

                    <div
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 12,
                        height: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: q.image ? "#f1f5f9" : "#fff",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {q.image ? (
                        <>
                          <img
                            src={`${UPLOADS_URL}/${q.image}`}
                            alt="Q"
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                          />
                          <button
                            onClick={() => updQ(i, "image", null)}
                            style={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              background: "#ef4444",
                              color: "#fff",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <label
                          style={{
                            cursor: "pointer",
                            textAlign: "center",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 24 }}>📷</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {uploadingId === `${i}` ? "..." : "Фото"}
                          </span>
                          <input
                            type="file"
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={(e) => handleQuestionImageUpload(e, i)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* СЕКЦИЯ ОТВЕТОВ */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {q.options.map((o, oi) => (
                    <div key={oi} style={styles.optionRow}>
                      <input
                        type="radio"
                        checked={String(q.correctAnswer) === String(o.id)}
                        onChange={() => updQ(i, "correctAnswer", String(o.id))}
                        style={{ accentColor: "#6366f1" }}
                      />

                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            alignItems: "center",
                          }}
                        >
                          <input
                            style={{
                              ...styles.input,
                              marginBottom: 0,
                              fontSize: 13,
                              padding: 8,
                              flex: 1,
                            }}
                            placeholder={`Вариант ${oi + 1}`}
                            value={o.text}
                            onChange={(e) => updOpt(i, oi, "text", e.target.value)}
                            data-latex-id={`o-${i}-${oi}`}
                            onFocus={setActiveField({
                              kind: "o",
                              qi: i,
                              oi: oi,
                              selector: `[data-latex-id="o-${i}-${oi}"]`,
                            })}
                            onClick={updateCaret}
                            onKeyUp={updateCaret}
                          />

                          <div
                            style={{
                              position: "relative",
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                            }}
                          >
                            {o.image ? (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 6,
                                  overflow: "hidden",
                                  position: "relative",
                                }}
                              >
                                <img
                                  src={`${UPLOADS_URL}/${o.image}`}
                                  alt="opt"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                                <button
                                  onClick={() => updOpt(i, oi, "image", null)}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0,
                                    background: "rgba(0,0,0,0.5)",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 14,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <label
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  border: "1px dashed #cbd5e1",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  background: "#fff",
                                }}
                                title="Добавить фото"
                              >
                                <span style={{ fontSize: 16 }}>
                                  {uploadingId === `${i}-${oi}` ? ".." : "📷"}
                                </span>
                                <input
                                  type="file"
                                  style={{ display: "none" }}
                                  accept="image/*"
                                  onChange={(e) => handleOptionImageUpload(e, i, oi)}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {(o.text.includes("\\") ||
                          o.text.includes("_") ||
                          o.text.includes("^")) && (
                          <div
                            style={{
                              paddingLeft: 10,
                              fontSize: 13,
                              color: "#475569",
                            }}
                          >
                            <InlineMath math={o.text} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button onClick={addQ} style={styles.btnAddDashed}>
            + Добавить вопрос
          </button>
        </div>

        <LatexKeyboard
          open={kbOpen}
          onClose={() => setKbOpen(false)}
          onInsert={insertLatexToActive}
        />

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Отмена
          </button>
          <button
            onClick={() => onSave({ ...meta, questions: qs })}
            style={styles.btnPrimary}
          >
            Сохранить тест
          </button>
        </div>
      </div>
    </div>
  );
};


// === ANALYTICS & DASHBOARD & USERS TABS ===
// (Код этих табов не менялся, но я включил его сюда для целостности)

const AnalyticsTab = ({ data, filters, setFilters, schools }) => {
  if (!data)
    return (
      <div style={{ color: "#64748b", padding: 20 }}>Загрузка аналитики...</div>
    );
  const dateOptions = [
    { value: "week", label: "Последняя неделя" },
    { value: "month", label: "Последний месяц" },
    { value: "quarter", label: "Квартал" },
    { value: "year", label: "Год" },
  ];
  const typeOptions = [
    { value: "all", label: "Все типы" },
    { value: "ENT", label: "ЕНТ" },
    { value: "MODO", label: "МОДО" },
    { value: "PISA", label: "PISA" },
  ];
  const schoolOptions = [
    { value: "all", label: "Все школы" },
    ...schools.map((s) => ({ value: s.id, label: s.name })),
  ];

  const handleExportExcel = () => {
    if (!data || !data.kpi) return alert("Нет данных для экспорта");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Метрика,Значение\n";
    csvContent += `Всего экзаменов,${data.kpi.totalExams}\n`;
    csvContent += `Средний балл,${data.kpi.avgScore}\n`;
    csvContent += `Успеваемость (%),${data.kpi.passRate}\n\n`;
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 200, zIndex: 30 }}>
            <CustomSelect
              options={dateOptions}
              value={filters.dateRange}
              onChange={(v) => setFilters({ ...filters, dateRange: v })}
              placeholder="Период"
            />
          </div>
          <div style={{ width: 250, zIndex: 29 }}>
            <CustomSelect
              options={schoolOptions}
              value={filters.schoolId}
              onChange={(v) => setFilters({ ...filters, schoolId: v })}
              placeholder="Школа"
            />
          </div>
          <div style={{ width: 200, zIndex: 28 }}>
            <CustomSelect
              options={typeOptions}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              placeholder="Тип экзамена"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button style={styles.btnExport} onClick={handleExportExcel}>
            Скачать Excel (CSV)
          </button>
          <button
            style={styles.btnExportOutline}
            onClick={() => window.print()}
          >
            Печать / PDF
          </button>
        </div>
      </div>
      <div style={styles.statsGrid}>
        <StatCard
          title="Средний балл"
          value={data.kpi.avgScore}
          subtitle="По выбранным фильтрам"
          icon="📊"
          color="#6366f1"
        />
        <StatCard
          title="Успеваемость"
          value={`${data.kpi.passRate}%`}
          subtitle="Преодолели порог"
          icon="🎓"
          color="#10b981"
        />
        <StatCard
          title="Индекс списывания"
          value={`${data.kpi.cheatingIndex}%`}
          subtitle="Сессии с нарушениями"
          icon="👁️"
          color="#ef4444"
        />
        <StatCard
          title="Всего экзаменов"
          value={data.kpi.totalExams}
          subtitle="За период"
          icon="📝"
          color="#f59e0b"
        />
      </div>
      <div style={styles.gridTwo}>
        <div style={styles.card} className="card">
          <h3 style={styles.cardTitle}>Распределение баллов</h3>
          <div style={styles.chartContainer}>
            <div style={styles.barChart}>
              {data.distribution.map((item, idx) => (
                <div key={idx} style={styles.barColumn}>
                  <div
                    style={{
                      height: `${
                        item.count > 0
                          ? (item.count / (data.kpi.totalExams || 1)) * 200
                          : 5
                      }px`,
                      background: item.color,
                      ...styles.bar,
                      minHeight: 5,
                    }}
                  >
                    <div style={styles.barTooltip}>{item.count}</div>
                  </div>
                  <span style={styles.barLabel}>{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.card} className="card">
          <h3 style={styles.cardTitle}>Трудные вопросы (Топ 5)</h3>
          <div style={{ overflowY: "auto", maxHeight: 250 }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Вопрос</th>
                  <th style={{ ...styles.th, width: 80 }}>Верно</th>
                </tr>
              </thead>
              <tbody>
                {data.difficultQuestions &&
                data.difficultQuestions.length > 0 ? (
                  data.difficultQuestions.map((q) => (
                    <tr key={q.id}>
                      <td style={styles.td}>{q.text}</td>
                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              background: "#e2e8f0",
                              borderRadius: 3,
                              overflow: "hidden",
                              width: 50,
                            }}
                          >
                            <div
                              style={{
                                width: `${q.correctRate}%`,
                                background:
                                  q.correctRate < 30 ? "#ef4444" : "#f59e0b",
                                height: "100%",
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: "bold",
                              color: "#64748b",
                            }}
                          >
                            {q.correctRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="2"
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        color: "#64748b",
                        padding: 20,
                      }}
                    >
                      Нет данных о прохождении тестов
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{ ...styles.card, marginTop: 24 }} className="card">
        <h3 style={styles.cardTitle}>Матрица ответов (Heatmap)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.heatmap && data.heatmap.length > 0 ? (
            data.heatmap.map((h, i) => (
              <div
                key={i}
                title={`Вопрос ID:${h.q} | Верно: ${h.val}%`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#fff",
                  background:
                    h.val > 70 ? "#10b981" : h.val > 40 ? "#f59e0b" : "#ef4444",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {i + 1}
              </div>
            ))
          ) : (
            <div style={{ color: "#64748b" }}>Нет данных для отображения</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardTab = ({ stats, sessions }) => (
  <div className="fade-in">
    <div style={styles.statsGrid}>
      <StatCard
        title="Студенты"
        value={stats.users?.students || 0}
        subtitle="Всего в базе"
        icon={<UsersIcon />}
        color="#6366f1"
      />
      <StatCard
        title="Активные тесты"
        value={stats.tests?.active || 0}
        subtitle="Доступно сейчас"
        icon={<TestsIcon />}
        color="#10b981"
      />
      <StatCard
        title="Нарушения"
        value={stats.violations?.total || 0}
        subtitle="За все время"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        }
        color="#ef4444"
      />
      <StatCard
        title="Сессии"
        value={stats.sessions?.total || 0}
        subtitle="Проведенных экзаменов"
        icon={<SessionsIcon />}
        color="#f59e0b"
      />
    </div>
    <div style={{ ...styles.card, width: "100%" }}>
      <h3 style={styles.cardTitle}>Последние сессии</h3>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Студент</th>
              <th style={styles.th}>Тест</th>
              <th style={styles.th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.user_name}</td>
                <td style={styles.td}>{s.test_name}</td>
                <td style={styles.td}>
                  {s.end_time ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <StatusBadge status="active" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const UsersTab = ({ users, onDelete, onAdd }) => (
  <div className="fade-in">
    <div style={styles.toolbar}>
      <input
        type="text"
        placeholder="Поиск пользователей..."
        style={styles.searchBox}
      />
      <button style={styles.addBtn} onClick={onAdd}>
        + Добавить пользователя
      </button>
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
            {users.map((u) => (
              <tr key={u.id}>
                <td style={styles.td}>{u.id}</td>
                <td
                  style={{
                    ...styles.td,
                    fontWeight: "600",
                    color: "#0f172a",
                  }}
                >
                  {u.full_name}
                </td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  <span
                    style={
                      u.role === "admin"
                        ? styles.badgeAdmin
                        : styles.badgeStudent
                    }
                  >
                    {u.role === "admin" ? "Админ" : "Студент"}
                  </span>
                </td>
                <td style={styles.td}>
                  {u.school || "-"} {u.class ? `(${u.class})` : ""}
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.iconBtnDel}
                    onClick={() => onDelete(u.id)}
                    title="Удалить"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const SessionsTab = ({ sessions, onVideo }) => (
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
              <th style={styles.th}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={styles.td}>{s.id}</td>
                <td style={styles.td}>
                  <div style={{ fontWeight: "bold", color: "#0f172a" }}>
                    {s.user_name}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    ID: {s.user_id}
                  </div>
                </td>
                <td style={styles.td}>{s.test_name}</td>
                <td style={styles.td}>
                  <span style={styles.scoreBadge}>{s.score}</span>
                </td>
                
                
                <td style={styles.td}>
                  {s.end_time ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <StatusBadge status="active" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const UserModal = ({ onClose, onSave, schools = [] }) => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    telegram_id: "",
    school: "",
    className: "",
  });
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Новый пользователь</h3>
        <div style={styles.formGroup}>
          <label style={styles.label}>ФИО</label>
          <input
            style={styles.input}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Имя Фамилия"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@mail.com"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Пароль</label>
          <input
            style={{ ...styles.input, borderColor: "#6366f1" }}
            placeholder="Обязательно"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Роль</label>
          <select
            style={styles.select}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="student">Студент</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        {form.role === "student" && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <CustomSelect
                placeholder="Выберите школу"
                options={schools.map((s) => ({
                  value: s.name,
                  label: s.name,
                }))}
                value={form.school}
                onChange={(val) => setForm({ ...form, school: val })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                inputMode="numeric"
                style={styles.input}
                placeholder="Класс"
                value={form.className || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    className: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>
          </div>
        )}
        {form.role === "admin" && (
          <input
            style={styles.input}
            placeholder="Telegram ID"
            onChange={(e) => setForm({ ...form, telegram_id: e.target.value })}
          />
        )}
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Отмена
          </button>
          <button onClick={() => onSave(form)} style={styles.btnPrimary}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// === GLOBAL & STYLES ===
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    :root { --primary: #6366f1; --primary-dark: #4f46e5; --text-main: #0f172a; --text-secondary: #64748b; --bg: #f8fafc; --border: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: var(--bg); min-height: 100vh; overflow-x: hidden; color: var(--text-main); }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-option:hover { background: #eef2ff !important; color: var(--primary) !important; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    input::placeholder, textarea::placeholder { color: #cbd5e1; }
  `}</style>
);

const styles = {
  container: { display: "flex", minHeight: "100vh" },
  sidebar: {
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    height: "100vh",
    position: "sticky",
    top: 0,
    transition: "width 0.3s ease",
    zIndex: 50,
    boxShadow: "2px 0 10px rgba(0,0,0,0.02)",
  },
  logoArea: {
    padding: "0 10px 30px 10px",
    height: 40,
    display: "flex",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: 800,
    color: "#6366f1",
    letterSpacing: -0.5,
  },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    color: "#64748b",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  navItemActive: { background: "#eef2ff", color: "#6366f1" },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
  },
  navBadge: {
    marginLeft: "auto",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#fff",
  },
  sidebarBottom: { display: "flex", flexDirection: "column", gap: "10px" },
  collapseBtn: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#64748b",
    cursor: "pointer",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: "10px",
    color: "#ef4444",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "0.2s",
  },
  divider: { height: 1, background: "#e2e8f0", margin: "10px 0" },
  main: {
    flexGrow: 1,
    padding: "32px 40px",
    overflowY: "auto",
    background: "#f8fafc",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
    letterSpacing: -1,
  },
  pageSubtitle: { color: "#64748b", fontSize: "15px", fontWeight: 500 },
  adminBadge: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "8px 16px",
    borderRadius: "50px",
    color: "#0f172a",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  statIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
  statValue: { fontSize: "28px", fontWeight: "800", color: "#0f172a" },
  statTitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "2px",
    fontWeight: 600,
  },
  statSubtitle: { fontSize: "12px", color: "#94a3b8" },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "20px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "24px",
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "16px 16px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
  },
  badgeStudent: {
    background: "#eef2ff",
    color: "#6366f1",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  badgeAdmin: {
    background: "#f3e8ff",
    color: "#a855f7",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  scoreBadge: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "4px 10px",
    borderRadius: 8,
    fontWeight: "700",
    border: "1px solid #e2e8f0",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  searchBox: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px 16px",
    color: "#0f172a",
    width: 300,
    outline: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  addBtn: {
    background: "var(--primary)",
    border: "none",
    borderRadius: "14px",
    padding: "12px 24px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
    fontSize: 14,
    transition: "0.2s",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  btnExport: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    padding: "10px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    transition: "0.2s",
    fontSize: 13,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  btnExportOutline: {
    background: "transparent",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    padding: "10px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  chartContainer: {
    height: 250,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "20px 0",
  },
  barChart: {
    display: "flex",
    gap: 40,
    alignItems: "flex-end",
    height: "100%",
  },
  barColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: 50,
    borderRadius: "8px 8px 0 0",
    position: "relative",
    transition: "height 0.5s ease",
    cursor: "pointer",
  },
  barLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "bold" },
  barTooltip: {
    position: "absolute",
    top: -25,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0f172a",
    color: "white",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  testsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  testCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
  },
  testCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  typeBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusDot: { width: "10px", height: "10px", borderRadius: "50%" },
  testCardTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
  },
  testCardSubject: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "24px",
    fontWeight: 500,
  },
  testCardActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  btnStatus: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    flex: 1,
    marginRight: 10,
  },
  btnIconAction: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    width: 36,
    height: 36,
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "0.2s",
  },
  btnPrimary: {
    background: "var(--primary)",
    border: "none",
    borderRadius: "12px",
    padding: "10px 24px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: 14,
  },
  btnSecondary: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px 24px",
    color: "#0f172a",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: 14,
  },
  btnPrimaryOutline: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    padding: "6px 14px",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnLink: {
    background: "none",
    border: "none",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "700",
  },
  btnLinkRed: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  iconBtnDel: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    width: 64,
    height: 32,
    color: "#ef4444",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  violationBtn: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    padding: "4px 10px",
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 12,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "32px",
    width: "450px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "24px",
    letterSpacing: -0.5,
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  formGroup: { marginBottom: "16px" },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
    transition: "0.2s",
  },
  select: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
  },
  questionCard: {
    background: "#f8fafc",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    marginBottom: 15,
  },
  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  btnAddDashed: {
    width: "100%",
    padding: 12,
    border: "2px dashed #cbd5e1",
    background: "transparent",
    color: "#64748b",
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 10,
    fontWeight: 600,
    fontSize: 13,
  },
  toast: {
    position: "fixed",
    bottom: 30,
    right: 30,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "16px 20px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease-out",
  },
  mediaOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
  },
  mediaContainer: {
    width: "90%",
    maxWidth: "1000px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  mediaHeader: {
    padding: "16px 24px",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
  },
  mediaCloseBtn: {
    background: "#f1f5f9",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    color: "#64748b",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaContentWrapper: {
    padding: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    minHeight: 400,
  },
  mediaContent: {
    maxWidth: "100%",
    maxHeight: "70vh",
    borderRadius: 12,
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  },
};

const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".custom-select-container")) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div
      className="custom-select-container"
      style={{ position: "relative", width: "100%" }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.input,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderColor: isOpen ? "#6366f1" : "#cbd5e1",
          background: "#fff",
        }}
      >
        <span
          style={{
            color: selectedOption ? "#0f172a" : "#94a3b8",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.2s",
            fontSize: 10,
            opacity: 0.7,
            color: "#64748b",
          }}
        >
          ▼
        </span>
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            maxHeight: 250,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
            padding: 4,
          }}
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="custom-option"
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                  color:
                    String(value) === String(opt.value) ? "#6366f1" : "#334155",
                  borderRadius: 8,
                  marginBottom: 2,
                  fontWeight: String(value) === String(opt.value) ? 600 : 500,
                  background:
                    String(value) === String(opt.value)
                      ? "#eef2ff"
                      : "transparent",
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: 10,
                color: "#94a3b8",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              Нет данных
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span
    style={{
      ...styles.badge,
      background: status === "completed" ? "#dcfce7" : "#fef3c7",
      color: status === "completed" ? "#166534" : "#b45309",
    }}
  >
    {status === "completed" ? "Завершен" : "Активен"}
  </span>
);
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: `${color}15`, color }}>
      {icon}
    </div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statSubtitle}>{subtitle}</div>
    </div>
  </div>
);
const NavItem = ({
  icon,
  label,
  active,
  onClick,
  collapsed,
  badge,
  badgeColor = "#6366f1",
}) => (
  <div
    onClick={onClick}
    style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
  >
    <div style={{ ...styles.navIcon, color: active ? "#6366f1" : "#94a3b8" }}>
      {icon}
    </div>
    {!collapsed && <span style={styles.navLabel}>{label}</span>}
    {!collapsed && badge > 0 && (
      <span style={{ ...styles.navBadge, background: badgeColor }}>
        {badge}
      </span>
    )}
  </div>
);
const DashboardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const TestsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const SessionsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default AdminPanel;
