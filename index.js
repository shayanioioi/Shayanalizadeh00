require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('❌ BOT_TOKEN is not defined in .env file');
  process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(bodyParser.json());

const FOOTBALL_RESULTS_URL = 'https://varzesh3.com/live';
const ADMIN_ID = Number(process.env.ADMIN_ID);

if (!ADMIN_ID) {
  console.warn('⚠️ ADMIN_ID is not defined or invalid in .env');
}

// --- فرمان شروع برای همه کاربران ---
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

// --- پنل مدیریت فقط برای ادمین ---
bot.onText(/\/panel/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '⛔️ دسترسی غیرمجاز.');
  }

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

// --- دکمه پنل مدیریت ---
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'update_results') {
    bot.sendMessage(chatId, `📢 آخرین نتایج فوتبال:\n${FOOTBALL_RESULTS_URL}`);
  }

  bot.answerCallbackQuery(query.id);
});

// --- آمار بازیکنان ---
bot.onText(/\/player (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const name = match[1].trim();

  try {
    // --- نمونه API فرضی، جایگزین کن با API واقعی ---
    const response = await axios.get(`https://api.example.com/players/${encodeURIComponent(name)}`, {
      headers: { 'X-API-Key': process.env.API_KEY } // اگه لازم بود
    });

    const player = response.data;

    const message = `
👤 نام: ${player.name}
🌍 ملیت: ${player.nationality}
🎯 گل‌ها: ${player.goals}
🅰️ پاس گل: ${player.assists}
🕹 بازی‌ها: ${player.matches}
🛡 پست: ${player.position}
📅 سن: ${player.age}
    `;

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('❌ Error fetching player:', error.message);
    bot.sendMessage(chatId, `❌ بازیکن "${name}" پیدا نشد یا مشکلی پیش آمد.`);
  }
});

// --- اجرای سرور برای render ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});

// --- مدیریت خطاهای polling ---
bot.on("polling_error", (err) => {
  console.error('Polling error:', err.code, err.message);
});