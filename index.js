const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// راه‌اندازی ربات با webhook
const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: { port: port } });
bot.setWebHook(`${process.env.WEBHOOK_URL}/webhook`);

// بدنهٔ درخواست‌ها به صورت JSON
app.use(bodyParser.json());

// دریافت پیام‌های ربات از webhook
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// پاسخ به /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "سلام! خوش اومدی 👋");
});

// صفحه تست
app.get("/", (req, res) => {
  res.send("ربات تلگرام روی Render فعال است.");
});

// اجرای سرور
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});