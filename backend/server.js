const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// --- ИМПОРТЫ ТВОИХ ФАЙЛОВ ---
const authRoutes = require('./routes/auth'); 
const pool = require('./db'); // Твой файл подключения к БД

const app = express();

// --- МИДДЛВЕРЫ ---
app.use(cors());
app.use(express.json());

// --- МАРШРУТ ДЛЯ ДАШБОРДА ---
app.get('/api/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log(`Получен запрос дашборда для юзера: ${userId}`);

  try {
    const userResult = await pool.query(
      'SELECT full_name, role, school, class FROM public.users WHERE id = $1', 
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const testsResult = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.subject, 
        t.duration_minutes,
        (SELECT count(*) FROM public.questions q WHERE q.test_id = t.id) as q_count,
        s.start_time,
        s.end_time,
        s.score -- Добавил вывод балла, если он есть
      FROM public.tests t
      LEFT JOIN public.test_sessions s ON t.id = s.test_id AND s.user_id = $1
    `, [userId]);

    res.json({
      user: userResult.rows[0],
      tests: testsResult.rows
    });
    
  } catch (err) {
    console.error('Ошибка в SQL-запросе:', err);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// --- ПАПКИ ДЛЯ ФАЙЛОВ ---
const SCREENSHOTS_DIR = path.join(__dirname, 'upload-screenshot');
const VIDEOS_DIR = path.join(__dirname, 'upload-video');

[SCREENSHOTS_DIR, VIDEOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- НАСТРОЙКА MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "screenshot") cb(null, SCREENSHOTS_DIR);
    else cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.use('/api/auth', authRoutes);

// 2. Скриншоты
app.post('/upload-screenshot', upload.single('screenshot'), (req, res) => {
  res.send({ status: 'ok', filename: req.file.filename });
});

// Маршрут для загрузки видео и записи ссылки в БД
app.post('/upload-video', upload.single('session_video'), async (req, res) => {
  const { sessionId } = req.body; // Получаем из FormData

  if (!req.file) {
    return res.status(400).json({ error: "Файл видео не получен" });
  }

  const fileName = req.file.filename; // Имя файла, уже сохраненное в папку uploads

  try {
    if (sessionId) {
      // Обновляем таблицу test_sessions, записываем имя файла в recording_links
      const updateQuery = `
        UPDATE public.test_sessions 
        SET recording_links = $1 
        WHERE id = $2
      `;
      
      const result = await pool.query(updateQuery, [fileName, sessionId]);

      if (result.rowCount === 0) {
        console.warn(`⚠️ Сессия с ID ${sessionId} не найдена в базе.`);
        return res.status(404).json({ error: "Сессия не найдена" });
      }

      console.log(`✅ Видео ${fileName} привязано к сессии ${sessionId}`);
      res.json({ status: 'ok', filename: fileName, sessionId });
    } else {
      console.warn("⚠️ Видео получено, но sessionId отсутствует в запросе.");
      res.status(400).json({ error: "sessionId is required" });
    }
  } catch (err) {
    console.error("❌ Ошибка при обновлении записи в БД:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// --- СТАРТ ТЕСТА ---
app.post('/api/tests/start', async (req, res) => {
  console.log("📥 Пришел запрос START. Тело:", req.body); 

  const user_id = req.body.user_id || req.body.userId;
  const test_id = req.body.test_id || req.body.testId;

  if (!user_id || !test_id) {
    console.error("❌ Ошибка: не переданы ID");
    return res.status(400).json({ error: "Не получен user_id или test_id" });
  }

  try {
    const existingSession = await pool.query(
      'SELECT id FROM public.test_sessions WHERE user_id = $1 AND test_id = $2 AND end_time IS NULL',
      [user_id, test_id]
    );

    if (existingSession.rows.length > 0) {
      console.log("♻️ Найдена активная сессия:", existingSession.rows[0].id);
      return res.json({ sessionId: existingSession.rows[0].id, message: 'Сессия уже существует' });
    }

    const newSession = await pool.query(
      'INSERT INTO public.test_sessions (user_id, test_id, start_time) VALUES ($1, $2, NOW()) RETURNING id',
      [user_id, test_id]
    );

    console.log(`🚀 Создана новая сессия: ${newSession.rows[0].id}`);
    res.json({ sessionId: newSession.rows[0].id });

  } catch (err) {
    console.error('❌ ОШИБКА SQL:', err);
    res.status(500).json({ error: 'Ошибка базы данных', details: err.message });
  }
});

// --- ПОЛУЧЕНИЕ ВОПРОСОВ ---
app.get('/api/tests/:testId/questions', async (req, res) => {
  const { testId } = req.params;
  console.log(`🔎 Запрос вопросов для теста ID: ${testId}`);

  try {
    // ВАЖНО: Мы НЕ выбираем поле correct_answer, чтобы не отправлять его на фронтенд заранее
    const result = await pool.query(
      'SELECT id, text, type, points, options FROM public.questions WHERE test_id = $1 ORDER BY id ASC',
      [testId]
    );
    res.json(result.rows); 
  } catch (err) {
    console.error('❌ Ошибка выполнения SQL:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/api/tests/submit', async (req, res) => {
  const { user_id, test_id, answers } = req.body;
  const session_id = req.body.session_id || req.body.sessionId;

  if (!user_id || !test_id || !answers) {
    return res.status(400).json({ error: "Недостаточно данных" });
  }

  try {
    await pool.query('BEGIN'); // Старт транзакции

    // 1. ПОЛУЧАЕМ ПРАВИЛЬНЫЕ ОТВЕТЫ (Исправлено название колонки!)
    const questionsDb = await pool.query(
      'SELECT id, points, correct_answers FROM public.questions WHERE test_id = $1',
      [test_id]
    );

    // Создаем Map для быстрого поиска
    const questionsMap = new Map();
    let maxTotalPoints = 0;
    
    questionsDb.rows.forEach(q => {
      questionsMap.set(q.id, q);
      maxTotalPoints += (q.points || 1);
    });

    let currentScore = 0;
    const resultDetails = {}; 

    const queryInsertAnswer = `
      INSERT INTO answers 
      (user_id, test_id, question_id, answer_text, answer_time, points_awarded, checked)
      VALUES ($1, $2, $3, $4, NOW(), $5, true)
    `;

    for (const ans of answers) {
      const dbQuestion = questionsMap.get(ans.question_id);
      
      let pointsAwarded = 0;
      let isCorrect = false;
      let correctAnswerDb = null;

      if (dbQuestion) {
        // --- ИСПРАВЛЕНО: Берем значение из твоей колонки correct_answers ---
        correctAnswerDb = dbQuestion.correct_answers;
        
        // Сравниваем как строки (чтобы "1" было равно 1)
        // Trim() убирает лишние пробелы, если они случайно попали в базу
        if (String(ans.answer_text).trim() === String(correctAnswerDb).trim()) {
          pointsAwarded = dbQuestion.points || 1;
          isCorrect = true;
          currentScore += pointsAwarded;
        }

        // Сохраняем для фронтенда (чтобы подсветить зеленым/красным)
        resultDetails[ans.question_id] = {
          correct_answer: correctAnswerDb,
          is_correct: isCorrect
        };
      }

      // Сохраняем ответ пользователя
      await pool.query(queryInsertAnswer, [
        user_id,
        test_id,
        ans.question_id,
        ans.answer_text,
        pointsAwarded
      ]);
    }

    // Обновляем сессию
    if (session_id) {
      await pool.query(
        'UPDATE public.test_sessions SET end_time = NOW(), score = $1 WHERE id = $2',
        [currentScore, session_id]
      );
    }

    await pool.query('COMMIT'); 

    res.json({ 
      message: "Тест завершен",
      score: currentScore,
      total_points: maxTotalPoints,
      details: resultDetails 
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Ошибка сохранения ответов:", err);
    res.status(500).json({ error: "Ошибка сервера при сохранении" });
  }
});
// --- ЛОГИРОВАНИЕ ---
app.post('/api/audit/log', async (req, res) => {
  const { event, user_id, event_time, data } = req.body;
  console.log("📥 Попытка записи лога:", req.body);

  try {
    const query = `
      INSERT INTO public.audit_logs (event, user_id, event_time, data)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    
    const values = [
      event || 'UNKNOWN_EVENT', 
      user_id, 
      event_time || new Date(), 
      data ? JSON.stringify(data) : '{}'
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ ОШИБКА БД:", err.message); 
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер на порту ${PORT}`);
});