import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Включение CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Обработчик формы
app.post('/send-form', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const message = `📥 Новая заявка:\nИмя: ${name}\nТелефон: ${phone}`;
    
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    if (!tgResponse.ok) {
        const errorText = await tgResponse.text(); // Получаем текст ошибки от Telegram
        console.error(`Telegram API error: ${tgResponse.status} ${tgResponse.statusText} - ${errorText}`);
        throw new Error(`Ошибка Telegram API: ${tgResponse.status} ${tgResponse.statusText} - ${errorText}`); // Включаем текст ошибки в сообщение
      }

    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));