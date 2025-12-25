require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const pool = require("./db");

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ПАПКИ ДЛЯ ФАЙЛОВ ---
const SCREENSHOTS_DIR = path.join(__dirname, "upload-screenshot");
const VIDEOS_DIR = path.join(__dirname, "upload-video");
[SCREENSHOTS_DIR, VIDEOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- СТАТИЧЕСКИЕ ФАЙЛЫ ---
app.use("/uploads", express.static(SCREENSHOTS_DIR));
app.use("/videos", express.static(VIDEOS_DIR));

// --- РОУТЫ ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "screenshot" ? SCREENSHOTS_DIR : VIDEOS_DIR);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// --- TELEGRAM BOT ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("Ошибка отправки Telegram-сообщения:", err);
  }
}

let offset = 0;

async function pollUpdates() {
  try {
    const res = await fetch(
      `${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=10`
    );
    const data = await res.json();

    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        if (update.message && update.message.text === "/start") {
          const chatId = update.message.chat.id;
          await sendMessage(chatId, `Ваш Telegram ID: ${chatId}`);
        }
      }
    }
  } catch (err) {
    console.error("Ошибка Telegram polling:", err);
  } finally {
    setTimeout(pollUpdates, 1000);
  }
}

async function initTelegram() {
  try {
    const res = await fetch(`${TELEGRAM_API}/getUpdates`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      offset = data.result[data.result.length - 1].update_id + 1;
    }
  } catch (err) {
    console.error("Ошибка инициализации Telegram:", err);
  }
  pollUpdates();
}

if (TELEGRAM_BOT_TOKEN) {
  initTelegram();
} else {
  console.log("Telegram token не найден, бот не запущен.");
}

// ==========================================
// 👇 ИСПРАВЛЕННЫЙ РОУТ ДЛЯ ПРОФИЛЯ 👇
// ==========================================
app.get("/api/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;

  // Проверка на "null" или "undefined"
  if (!userId || userId === "null" || userId === "undefined") {
    return res.status(400).json({ error: "Некорректный ID пользователя" });
  }

  try {
    // 1. Получаем данные пользователя. "class" в кавычках!
    const userResult = await pool.query(
      `SELECT id, full_name, role, school, "class" as "className", email 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден в БД" });
    }

    // 2. Получаем тесты (УБРАЛ t.type)
    const testsResult = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.subject, 
        t.type, 
        t.duration_minutes, 
        t.published,  -- <--- !!! ВОТ ЭТОГО НЕ ХВАТАЛО !!!
        (SELECT count(*) FROM questions q WHERE q.test_id = t.id) as q_count,
        s.start_time, s.end_time, s.score
      FROM tests t
      LEFT JOIN test_sessions s ON t.id = s.test_id AND s.user_id = $1
    `, [userId]);

    res.json({ user: userResult.rows[0], tests: testsResult.rows });
  } catch (err) {
    console.error("ОШИБКА В БАЗЕ ДАННЫХ:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ==========================================

// --- ЗАГРУЗКА СКРИНШОТОВ ---
app.post("/upload-screenshot", upload.single("screenshot"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не загружен" });
  res.json({ status: "ok", filename: req.file.filename });
});

// --- ЗАГРУЗКА ВИДЕО ---
app.post("/upload-video", upload.single("session_video"), async (req, res) => {
  const { sessionId } = req.body;
  if (!req.file) return res.status(400).json({ error: "Файл не получен" });

  const fileName = req.file.filename;
  try {
    if (sessionId) {
      const result = await pool.query(
        "UPDATE test_sessions SET recording_links = $1 WHERE id = $2",
        [[fileName], sessionId]
      );
      if (result.rowCount === 0)
        return res.status(404).json({ error: "Сессия не найдена" });
      res.json({ status: "ok", filename: fileName, sessionId });
    } else {
      res.status(400).json({ error: "sessionId обязателен" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
 app.post('/api/tests/start', async (req, res) => {
    const { user_id, test_id } = req.body;
    if (!user_id || !test_id) return res.status(400).json({ error: "user_id и test_id обязателен" });

    try {
      const existingSession = await pool.query(
        'SELECT id FROM test_sessions WHERE user_id = $1 AND test_id = $2 AND end_time IS NULL',
        [user_id, test_id]
      );
      if (existingSession.rows.length > 0) return res.json({ sessionId: existingSession.rows[0].id });

      const newSession = await pool.query(
        'INSERT INTO test_sessions (user_id, test_id, start_time) VALUES ($1, $2, NOW()) RETURNING id',
        [user_id, test_id]
      );
      res.json({ sessionId: newSession.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка базы данных' });
    }
  });

  // --- GET QUESTIONS ---
  app.get('/api/tests/:testId/questions', async (req, res) => {
    const { testId } = req.params;
    try {
      const result = await pool.query('SELECT id, text, type, points, options FROM questions WHERE test_id = $1 ORDER BY id ASC', [testId]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // --- SUBMIT TEST ---
  app.post('/api/tests/submit', async (req, res) => {
    const { user_id, test_id, answers, session_id } = req.body;
    if (!user_id || !test_id || !answers) return res.status(400).json({ error: "Недостаточно данных" });

    try {
      await pool.query('BEGIN');
      const questionsDb = await pool.query('SELECT id, points, correct_answers FROM questions WHERE test_id = $1', [test_id]);
      const questionsMap = new Map();
      let maxTotalPoints = 0;
      questionsDb.rows.forEach(q => { questionsMap.set(q.id, q); maxTotalPoints += q.points || 1; });

      let currentScore = 0;
      const resultDetails = {};

      for (const ans of answers) {
        const dbQ = questionsMap.get(ans.question_id);
        let pointsAwarded = 0, isCorrect = false, correctAnswer = null;
        if (dbQ) {
          correctAnswer = dbQ.correct_answers;
          if (String(ans.answer_text).trim() === String(correctAnswer).trim()) {
            pointsAwarded = dbQ.points || 1;
            currentScore += pointsAwarded;
            isCorrect = true;
          }
          resultDetails[ans.question_id] = { correct_answer: correctAnswer, is_correct: isCorrect };
        }
        await pool.query(
          'INSERT INTO answers (user_id, test_id, question_id, answer_text, answer_time, points_awarded, checked) VALUES ($1,$2,$3,$4,NOW(),$5,true)',
          [user_id, test_id, ans.question_id, ans.answer_text, pointsAwarded]
        );
      }

      if (session_id) await pool.query('UPDATE test_sessions SET end_time = NOW(), score = $1 WHERE id = $2', [currentScore, session_id]);
      await pool.query('COMMIT');

      res.json({ message: "Тест завершен", score: currentScore, total_points: maxTotalPoints, details: resultDetails });
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: "Ошибка сервера при сохранении" });
    }
  });
  // --- START SERVER ---
  const PORT = 5000;
  app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));



