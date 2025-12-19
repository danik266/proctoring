require('dotenv').config();
const pool = require('./db'); 
const fetch = require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chat_id, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`Не удалось отправить ${chat_id}:`, data);
    }
  } catch (err) {
    console.error(`Ошибка отправки ${chat_id}:`, err);
  }
}


async function broadcastMessage(text) {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const telegramIds = result.rows.map(row => row.telegram_id);

    console.log(`Найдено ${telegramIds.length} пользователей с Telegram ID`);

    const BATCH_SIZE = 10; // сколько одновременно отправляем
    for (let i = 0; i < telegramIds.length; i += BATCH_SIZE) {
      const batch = telegramIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(id => sendTelegramMessage(id, text)));
      console.log(`Отправлено пользователям с ${i + 1} по ${i + batch.length}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // пауза между батчами
    }

    console.log("Рассылка завершена!");
    process.exit(0);

  } catch (err) {
    console.error("Ошибка рассылки:", err);
    process.exit(1);
  }
}

const message = process.argv.slice(2).join(' ') || "Соси хер";
broadcastMessage(message);
