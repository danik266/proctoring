require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const mammoth = require("mammoth"); // Для Word
const pool = require("./db"); // Твой файл подключения к БД

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ПАПКИ ДЛЯ ФАЙЛОВ ---
// Используем одну папку для скриншотов и картинок вопросов
const SCREENSHOTS_DIR = path.join(__dirname, "upload-screenshot");
const VIDEOS_DIR = path.join(__dirname, "upload-video");

[SCREENSHOTS_DIR, VIDEOS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- СТАТИЧЕСКИЕ ФАЙЛЫ ---
app.use("/uploads", express.static(SCREENSHOTS_DIR));
app.use("/videos", express.static(VIDEOS_DIR));

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "session_video" ? VIDEOS_DIR : SCREENSHOTS_DIR);
  },
  filename: (req, file, cb) => {
    // Убираем пробелы и добавляем уникальный суффикс
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, uniqueSuffix + "-" + sanitizedName);
  },
});
const upload = multer({ storage });
const uploadMemory = multer({ storage: multer.memoryStorage() }); // Для Word

// ==========================================
// 🔥 СПЕЦИАЛЬНЫЕ РОУТЫ (ДОЛЖНЫ БЫТЬ ВЫШЕ app.use("/api/admin"))
// ==========================================

// 1. ЗАГРУЗКА КАРТИНКИ
app.post("/api/admin/upload/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Файл не загружен" });
    // Возвращаем имя файла
    res.json({ url: req.file.filename });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 2. ИМПОРТ WORD
const parseQuestionsFromDocx = (text) => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const questions = [];
  let currentQ = null;

  const questionRegex = /^(\d+)\.\s+(.*)/;
  const optionRegex = /^([A-EА-Еa-eа-е])[\.\)]\s+(.*)/;
  const scoreRegex = /\s*\[\d+\]$/;

  lines.forEach((line) => {
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQ) {
      let optText = optMatch[2].replace(scoreRegex, "").trim();
      currentQ.options.push({
        id: String(currentQ.options.length + 1),
        text: optText,
        image: null, // Добавляем поле для картинки
      });
      return;
    }

    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
      let qText = qMatch[2].replace(scoreRegex, "").trim();
      currentQ = {
        text: qText,
        points: 1,
        image: null,
        options: [],
        correctAnswer: "1",
      };
    } else {
      if (currentQ && currentQ.options.length === 0)
        currentQ.text += " " + line;
    }
  });

  if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
  return questions;
};

app.post(
  "/api/admin/tests/import",
  uploadMemory.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Нет файла" });
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      const questions = parseQuestionsFromDocx(result.value);
      if (questions.length === 0)
        return res.status(400).json({ error: "Вопросы не найдены" });
      res.json({ questions });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

// 3. СОЗДАНИЕ ТЕСТА (С СОХРАНЕНИЕМ КАРТИНОК)
app.post("/api/admin/tests", async (req, res) => {
  const { name, subject, type, duration_minutes, questions } = req.body;
  try {
    await pool.query("BEGIN");
    const testRes = await pool.query(
      "INSERT INTO tests (name, subject, type, duration_minutes, published) VALUES ($1, $2, $3, $4, true) RETURNING id",
      [name, subject, type, duration_minutes]
    );
    const testId = testRes.rows[0].id;

    for (const q of questions) {
      await pool.query(
        "INSERT INTO questions (test_id, type, text, points, correct_answers, options, image) VALUES ($1, 'single', $2, $3, $4, $5, $6)",
        [
          testId,
          q.text,
          q.points,
          JSON.stringify(q.correctAnswer),
          JSON.stringify(q.options),
          q.image,
        ]
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Тест создан", id: testId });
  } catch (e) {
    await pool.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 4. ОБНОВЛЕНИЕ ТЕСТА (С СОХРАНЕНИЕМ КАРТИНОК)
app.put("/api/admin/tests/:id", async (req, res) => {
  const { id } = req.params;
  const { name, subject, type, duration_minutes, questions, published } =
    req.body;

  // Если это просто переключение статуса
  if (questions === undefined && published !== undefined) {
    try {
      await pool.query("UPDATE tests SET published=$1 WHERE id=$2", [
        published,
        id,
      ]);
      return res.json({ message: "Статус обновлен" });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    await pool.query("BEGIN");
    await pool.query(
      "UPDATE tests SET name=$1, subject=$2, type=$3, duration_minutes=$4 WHERE id=$5",
      [name, subject, type, duration_minutes, id]
    );

    // Перезаписываем вопросы
    await pool.query("DELETE FROM questions WHERE test_id=$1", [id]);

    for (const q of questions) {
      await pool.query(
        "INSERT INTO questions (test_id, type, text, points, correct_answers, options, image) VALUES ($1, 'single', $2, $3, $4, $5, $6)",
        [
          id,
          q.text,
          q.points,
          JSON.stringify(q.correctAnswer),
          JSON.stringify(q.options),
          q.image,
        ]
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Тест обновлен" });
  } catch (e) {
    await pool.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 5. ПОЛУЧЕНИЕ ПОЛНОГО ТЕСТА (ДЛЯ РЕДАКТОРА)
app.get("/api/admin/tests/:id/full", async (req, res) => {
  const { id } = req.params;
  try {
    const testRes = await pool.query("SELECT * FROM tests WHERE id = $1", [id]);
    if (testRes.rows.length === 0)
      return res.status(404).json({ error: "Тест не найден" });

    const qRes = await pool.query(
      "SELECT * FROM questions WHERE test_id = $1 ORDER BY id",
      [id]
    );

    res.json({ test: testRes.rows[0], questions: qRes.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 👇 ПОДКЛЮЧЕНИЕ ОБЩИХ РОУТЕРОВ
// ==========================================
app.use("/api/admin", adminRoutes); // Остальные админские ручки
app.use("/api/auth", authRoutes); // Авторизация

// ==========================================
// 👇 РОУТЫ ДЛЯ СТУДЕНТА (ПРОХОЖДЕНИЕ)
// ==========================================

// СТАРТ ТЕСТА
app.post("/api/tests/start", async (req, res) => {
  const { user_id, test_id } = req.body;
  if (!user_id || !test_id)
    return res.status(400).json({ error: "user_id и test_id обязателен" });

  try {
    const existingSession = await pool.query(
      "SELECT id FROM test_sessions WHERE user_id = $1 AND test_id = $2 AND end_time IS NULL",
      [user_id, test_id]
    );
    if (existingSession.rows.length > 0)
      return res.json({ sessionId: existingSession.rows[0].id });

    const newSession = await pool.query(
      "INSERT INTO test_sessions (user_id, test_id, start_time) VALUES ($1, $2, NOW()) RETURNING id",
      [user_id, test_id]
    );
    res.json({ sessionId: newSession.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка базы данных" });
  }
});

// ПОЛУЧЕНИЕ ВОПРОСОВ (ВАЖНО: ДОБАВЛЕНО image)
app.get("/api/tests/:testId/questions", async (req, res) => {
  const { testId } = req.params;
  try {
    // 🔥🔥🔥 ВОТ ЗДЕСЬ ДОБАВЛЕНО image В ЗАПРОС 🔥🔥🔥
    const result = await pool.query(
      "SELECT id, text, type, points, options, image FROM questions WHERE test_id = $1 ORDER BY id ASC",
      [testId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ЗАВЕРШЕНИЕ ТЕСТА
app.post("/api/tests/submit", async (req, res) => {
  const { user_id, test_id, answers, session_id } = req.body;
  if (!user_id || !test_id || !answers)
    return res.status(400).json({ error: "Недостаточно данных" });

  try {
    await pool.query("BEGIN");
    const questionsDb = await pool.query(
      "SELECT id, points, correct_answers FROM questions WHERE test_id = $1",
      [test_id]
    );
    const questionsMap = new Map();
    let maxTotalPoints = 0;
    questionsDb.rows.forEach((q) => {
      questionsMap.set(q.id, q);
      maxTotalPoints += q.points || 1;
    });

    let currentScore = 0;
    const resultDetails = {};

    for (const ans of answers) {
      const dbQ = questionsMap.get(ans.question_id);
      let pointsAwarded = 0,
        isCorrect = false,
        correctAnswer = null;
      if (dbQ) {
        correctAnswer = dbQ.correct_answers;
        if (String(ans.answer_text).trim() === String(correctAnswer).trim()) {
          pointsAwarded = dbQ.points || 1;
          currentScore += pointsAwarded;
          isCorrect = true;
        }
        resultDetails[ans.question_id] = {
          correct_answer: correctAnswer,
          is_correct: isCorrect,
        };
      }
      await pool.query(
        "INSERT INTO answers (user_id, test_id, question_id, answer_text, answer_time, points_awarded, checked) VALUES ($1,$2,$3,$4,NOW(),$5,true)",
        [user_id, test_id, ans.question_id, ans.answer_text, pointsAwarded]
      );
    }

    if (session_id)
      await pool.query(
        "UPDATE test_sessions SET end_time = NOW(), score = $1 WHERE id = $2",
        [currentScore, session_id]
      );
    await pool.query("COMMIT");

    res.json({
      message: "Тест завершен",
      score: currentScore,
      total_points: maxTotalPoints,
      details: resultDetails,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера при сохранении" });
  }
});

// ДАШБОРД ПРОФИЛЬ
app.get("/api/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId === "null")
    return res.status(400).json({ error: "No User ID" });
  try {
    const user = await pool.query(
      `SELECT id, full_name, role, school, "class" as "className", email FROM users WHERE id = $1`,
      [userId]
    );
    if (user.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const tests = await pool.query(
      `
            SELECT t.id, t.name, t.subject, t.type, t.duration_minutes, t.published,
            (SELECT count(*) FROM questions q WHERE q.test_id = t.id) as q_count,
            s.start_time, s.end_time, s.score
            FROM tests t LEFT JOIN test_sessions s ON t.id = s.test_id AND s.user_id = $1
        `,
      [userId]
    );
    res.json({ user: user.rows[0], tests: tests.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ЗАГРУЗКА ВИДЕО
app.post("/upload-video", upload.single("session_video"), async (req, res) => {
  const { sessionId } = req.body;
  if (!req.file) return res.status(400).json({ error: "Файл не получен" });
  const fileName = req.file.filename;
  try {
    if (sessionId) {
      await pool.query(
        "UPDATE test_sessions SET recording_links = $1 WHERE id = $2",
        [[fileName], sessionId]
      );
      res.json({ status: "ok", filename: fileName, sessionId });
    } else {
      res.status(400).json({ error: "No Session ID" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error saving video" });
  }
});

// ЗАГРУЗКА СКРИНШОТОВ (ДЛЯ ПРОКТОРИНГА)
app.post("/upload-screenshot", upload.single("screenshot"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Error" });
  res.json({ status: "ok", filename: req.file.filename });
});

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
    console.error("Telegram Error:", err);
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
          await sendMessage(
            update.message.chat.id,
            `Ваш Telegram ID: ${update.message.chat.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("Telegram Polling Error:", err);
  } finally {
    setTimeout(pollUpdates, 1000);
  }
}

if (TELEGRAM_BOT_TOKEN) pollUpdates();

// --- START SERVER ---
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
