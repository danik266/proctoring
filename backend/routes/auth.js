const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Убедись, что путь к db.js верный

const router = express.Router();

// Секретный ключ для JWT (лучше вынести в .env, но пока оставим так для теста)
const JWT_SECRET = "super_secret_key_2025";

// --- РЕГИСТРАЦИЯ ---
router.post("/register", async (req, res) => {
  const { full_name, email, password, phone, role, school, className, consent_pdn } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role, school, class, consent_pdn)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, email, full_name, role`,
      [full_name, email, hashedPassword, phone, role || "student", school, className, consent_pdn || false]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: "24h" });
    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error("Ошибка регистрации:", err.message);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

// --- ЛОГИН ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        role: user.rows[0].role
      }
    });
  } catch (err) {
    console.error("Ошибка входа:", err.message);
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
});

module.exports = router;