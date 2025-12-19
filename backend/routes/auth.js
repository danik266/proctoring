const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); 
const fetch = require('node-fetch');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_2025";
const TWOFA_SECRET = process.env.TWOFA_SECRET || "twofa_secret_2025";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ================= Функция отправки сообщения в Telegram =================
async function sendTelegramMessage(chat_id, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text })
    });
  } catch (err) {
    console.error(`Ошибка отправки ${chat_id}:`, err);
  }
}

// ================= Регистрация пользователя =================
router.post("/register", async (req, res) => {
  const { full_name, email, password, phone, role, school, className, consent_pdn, telegram_id } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: "Пользователь уже существует" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users 
      (full_name,email,password,phone,role,school,class,consent_pdn,telegram_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id,email,full_name,role`,
      [full_name,email,hashedPassword,phone,role || "student",school,className,consent_pdn || false,telegram_id]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error("Ошибка регистрации:", err);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

// ================= Логин =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: "Неверный email или пароль" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Неверный email или пароль" });

    // --- Админы с 2FA ---
    if (user.role === "admin" || user.role === "superadmin") {
      const code = Math.floor(100000 + Math.random() * 900000);
      const hashedCode = await bcrypt.hash(code.toString(), 10);
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

      await pool.query(`
        INSERT INTO twofa_codes(user_id, code_hash, expires_at, attempts)
        VALUES ($1,$2,$3,0)
        ON CONFLICT(user_id) DO UPDATE
          SET code_hash = $2, expires_at = $3, attempts = 0
      `, [user.id, hashedCode, expiresAt]);

      if (user.telegram_id) {
        await sendTelegramMessage(user.telegram_id, `🔐 Ваш код 2FA: ${code} (действителен 2 минуты)`);
      }

      const twoFAToken = jwt.sign({ id: user.id }, TWOFA_SECRET, { expiresIn: "2m" });
      return res.json({ requires2FA: true, twoFAToken });
    }

    // --- обычные пользователи ---
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, full_name: user.full_name, role: user.role } });

  } catch (err) {
    console.error("Ошибка логина:", err);
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
});

// ================= Проверка 2FA =================
router.post("/verify-2fa", async (req, res) => {
  const { twoFAToken, code } = req.body;

  try {
    const payload = jwt.verify(twoFAToken, TWOFA_SECRET);
    const userId = payload.id;

    const result = await pool.query(
      "SELECT * FROM twofa_codes WHERE user_id = $1 AND expires_at > NOW()",
      [userId]
    );

    if (result.rows.length === 0) return res.status(401).json({ message: "Код не найден или истёк" });

    const twofa = result.rows[0];
    if (twofa.attempts >= 5) return res.status(403).json({ message: "Превышено количество попыток" });

    const isValid = await bcrypt.compare(code.toString(), twofa.code_hash);
    if (!isValid) {
      await pool.query("UPDATE twofa_codes SET attempts = attempts + 1 WHERE user_id = $1", [userId]);
      return res.status(401).json({ message: "Неверный код" });
    }

    await pool.query("DELETE FROM twofa_codes WHERE user_id = $1", [userId]);

    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

    res.json({ token, user: { id: user.id, full_name: user.full_name, role: user.role } });

  } catch (err) {
    console.error("Ошибка проверки 2FA:", err);
    res.status(500).json({ message: "Ошибка сервера при проверке 2FA" });
  }
});

module.exports = router;
