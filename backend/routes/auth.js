// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

// --- РЕГИСТРАЦИЯ ---
router.post("/register", async (req, res) => {
  const { full_name, email, password, phone, role, school, className, consent_pdn } = req.body;

  try {
    // Проверяем, есть ли пользователь
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Пользователь с таким email уже существует" });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Сохраняем пользователя
    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password, phone, role, school, class, consent_pdn)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, email, full_name, role`,
      [full_name, email, hashedPassword, phone, role || "student", school, className, consent_pdn || false]
    );

    // Создаем токен
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Ошибка сервера при регистрации");
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

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        role: user.rows[0].role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Ошибка сервера при входе");
  }
});

export default router;
