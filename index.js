const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN);

app.use(bodyParser.json());

// Webhook endpoint
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// پاسخ به /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "سلام! خوش اومدی 👋");
});

// صفحه اصلی برای تست
app.get("/", (req, res) => {
  res.send("ربات فعال است 🚀");
});

// شروع سرور
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  bot.setWebHook(`${process.env.WEBHOOK_URL}/webhook`);
});