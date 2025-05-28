require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(bodyParser.json());

const FOOTBALL_RESULTS_URL = 'https://varzesh3.com/live'; // لینک ثابت
const ADMIN_ID = Number(process.env.ADMIN_ID); // آیدی عددی از ENV گرفته می‌شود

// پاسخ به /start برای همه کاربران
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'سلام! نتایج فوتبال رو از اینجا ببینید:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📊 مشاهده نتایج زنده',
            url: FOOTBALL_RESULTS_URL
          }
        ]
      ]
    }
  });
});

// پنل مدیریت فقط برای ادمین
bot.onText(/\/panel/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== ADMIN_ID) return;

  bot.sendMessage(chatId, '📋 پنل مدیریت:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 مشاهده نتایج زنده', url: FOOTBALL_RESULTS_URL }
        ],
        [
          { text: '🔄 آپدیت نتایج', callback_data: 'update_results' }
        ]
      ]
    }
  });
});

// هندل کردن دکمه‌های پنل مدیریت
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'update_results') {
    bot.sendMessage(chatId, `📢 آخرین نتایج فوتبال:\n${FOOTBALL_RESULTS_URL}`);
  }

  bot.answerCallbackQuery(query.id); // بستن لودینگ
});

// اجرای سرور Express (برای render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});