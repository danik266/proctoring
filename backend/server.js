const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Папки для сохранения
const SCREENSHOTS_DIR = path.join(__dirname, 'upload-screenshot');
const VIDEOS_DIR = path.join(__dirname, 'uploads');

// Создаем папки, если их нет
[SCREENSHOTS_DIR, VIDEOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "screenshot") cb(null, SCREENSHOTS_DIR);
    else cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Маршрут для скриншотов
app.post('/upload-screenshot', upload.single('screenshot'), (req, res) => {
  console.log(`📸 Скриншот сохранен: ${req.file.filename}`);
  res.send({ status: 'ok' });
});

// Маршрут для видео
app.post('/upload-video', upload.single('video'), (req, res) => {
  console.log(`🎥 Видео сохранено: ${req.file.filename}`);
  res.send({ status: 'ok' });
});

app.listen(5000, () => console.log('Server running on port 5000'));