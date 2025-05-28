require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 10000;

const TOKEN = process.env.BOT_TOKEN;
const URL = process.env.WEBHOOK_URL;
const bot = new TelegramBot(TOKEN, { webHook: { port: port } });

// تنظیم آدرس Webhook
bot.setWebHook(${URL}/bot${TOKEN});

// Middleware برای دریافت آپدیت‌های تلگرام
app.use(bodyParser.json());

app.post(/bot${TOKEN}, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// === دیتابیس SQLite ===
const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  db.run(CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    score INTEGER DEFAULT 0
  ));

  db.run(CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    matchId TEXT,
    prediction TEXT,
    UNIQUE(userId, matchId)
  ));
});

// === بازی‌ها (لیست ثابت) ===
const matches = [
  { id: 'match1', teams: 'پرسپولیس vs استقلال', date: '۱۴۰۴/۰۳/۱۰' },
  { id: 'match2', teams: 'سپاهان vs تراکتور', date: '۱۴۰۴/۰۳/۱۲' }
];

// === /start ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  db.run(INSERT OR IGNORE INTO users (id, username) VALUES (?, ?), [chatId, username], () => {
    bot.sendMessage(chatId, سلام ${username} 👋

به ربات پیش‌بینی نتایج فوتبال خوش اومدی! ⚽️

از دکمه زیر برای پیش‌بینی استفاده کن👇, {
      reply_markup: {
        keyboard: [['🔮 پیش‌بینی بازی']],
        resize_keyboard: true
      }
    });
  });
});

// === پیش‌بینی بازی ===
bot.onText(/🔮 پیش‌بینی بازی/, (msg) => {
  const chatId = msg.chat.id;

  const buttons = matches.map(m => ([{
    text: ${m.teams} (${m.date}),
    callback_data: predict_${m.id}
  }]));

  bot.sendMessage(chatId, 'یکی از بازی‌ها رو انتخاب کن:', {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
});

// === Callback ها ===
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  if (data.startsWith('predict_')) {
    const matchId = data.replace('predict_', '');
    bot.sendMessage(chatId, نتیجه مورد نظرت برای این بازی چیه؟, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'برد تیم اول', callback_data: submit_${matchId}_1 },
            { text: 'مساوی', callback_data: submit_${matchId}_x },
            { text: 'برد تیم دوم', callback_data: submit_${matchId}_2 }
          ]
        ]
      }
    });
  }

  if (data.startsWith('submit_')) {
    const [, matchId, result] = data.split('_');

    db.run(INSERT OR REPLACE INTO predictions (userId, matchId, prediction) VALUES (?, ?, ?),
      [userId, matchId, result],
      (err) => {
        if (err) return bot.sendMessage(chatId, '❌ خطا در ثبت پیش‌بینی!');
        bot.sendMessage(chatId, '✅ پیش‌بینی شما با موفقیت ثبت شد.');
      }
    );
  }
});

// === /امتیاز ===
bot.onText(/\/امتیاز/, (msg) => {
  const chatId = msg.chat.id;

  db.get(SELECT score FROM users WHERE id = ?, [chatId], (err, row) => {
    if (row) {
      bot.sendMessage(chatId, ⭐️ امتیاز فعلی شما: ${row.score});
    } else {
      bot.sendMessage(chatId, 'شما هنوز ثبت‌نام نکردید. لطفاً /start را بزنید.');
    }
  });
});

// === ثبت نتیجه توسط ادمین ===
bot.onText(/\/ثبت_نتیجه (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const adminId = process.env.ADMIN_ID;

  if (chatId.toString() !== adminId) return;

  const matchId = match[1];
  const correct = match[2];

  db.all(SELECT * FROM predictions WHERE matchId = ?, [matchId], (err, rows) => {
    if (rows.length === 0) {
      return bot.sendMessage(chatId, 'هیچ پیش‌بینی‌ای برای این بازی ثبت نشده.');
    }