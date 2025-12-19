const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Маршрут для получения своего Telegram ID
router.post("/telegram-me", async (req, res) => {
  try {
    const { chat_id } = req.body; // отправляем с фронтенда свой chat_id
    if (!chat_id) return res.status(400).json({ error: "chat_id не указан" });

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text: `Ваш Telegram ID: ${chat_id}`
      })
    });

    res.json({ message: "Telegram ID отправлен!" });

  } catch (err) {
    console.error("Ошибка Telegram /me:", err);
    res.status(500).json({ message: "Ошибка при отправке Telegram ID" });
  }
});

module.exports = router;
