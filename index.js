const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

const adminId = process.env.ADMIN_ID;

// مسیر وبهوک
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// هندلر شروع
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "سلام! نتایج فوتبال رو اینجا ببینید.");
});

// هندلر برای گرفتن نتایج فوتبال
bot.onText(/\/نتایج/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // آدرس وب‌سرویس ایرانی برای دریافت نتایج فوتبال (مثال تستی)
    const response = await axios.get("https://api.football-api.ir/v1/results", {
      headers: {
        // فرض می‌کنیم این وب‌سرویس نیاز به API Key داره
        "Authorization": "Bearer YOUR_API_KEY",
      },
    });

    const results = response.data;

    // نمونه ساده نمایش اولین بازی
    const firstMatch = results[0];
    const text = `🏆 ${firstMatch.league}\n${firstMatch.home_team} ${firstMatch.home_score} - ${firstMatch.away_score} ${firstMatch.away_team}`;

    bot.sendMessage(chatId, text);
  } catch (err) {
    console.error("خطا در دریافت نتایج:", err.message);
    bot.sendMessage(chatId, "❌ خطا در دریافت نتایج فوتبال.");
  }
});

// سرور روی پورتی که Render فراهم کرده اجرا میشه
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});