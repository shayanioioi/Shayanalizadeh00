require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_KEY = process.env.API_KEY;
const DOMAIN = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 10000;

// پیام شروع
bot.start((ctx) => {
  ctx.reply('سلام 👋\nاسم بازیکن مورد نظر رو بفرست (مثلاً messi یا cristiano ronaldo) تا آمارشو نشون بدم!');
});

// پیام متنی کاربر
bot.on('text', async (ctx) => {
  const playerName = ctx.message.text.trim().toLowerCase();
  if (!playerName) return ctx.reply('لطفاً یک نام بازیکن وارد کن ✍️');

  await ctx.reply(`🔍 در حال جستجو برای "${playerName}" ...`);

  try {
    const url = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(playerName)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
    });

    const data = await response.json();

    // خطاهای رایج
    if (data.message === 'You are not subscribed to this API.') {
      return ctx.reply('❌ شما به این API در RapidAPI ساب‌اسکرایب نشده‌اید. لطفاً از سایت RapidAPI ساب‌اسکرایب کنید:\nhttps://rapidapi.com/api-sports/api/api-football/');
    }

    if (data.message === 'Too many requests') {
      return ctx.reply('❌ درخواست‌های بیش از حد مجاز! لطفاً چند دقیقه صبر کنید.');
    }

    if (!data.response || data.response.length === 0) {
      return ctx.reply('❌ بازیکنی با این نام پیدا نشد.');
    }

    const player = data.response[0];
    const stats = player.statistics?.[0];

    if (!stats) {
      return ctx.reply('ℹ️ اطلاعات آماری برای این بازیکن در حال حاضر موجود نیست.');
    }

    const message = `
👤 نام: ${player.player.name}
🎂 سن: ${player.player.age}
🌍 ملیت: ${player.player.nationality}
🧢 پست: ${player.player.position}
🏟️ تیم: ${stats.team.name}
🏆 لیگ: ${stats.league.name}
🗓️ فصل: ${stats.league.season}
⚽ گل‌ها: ${stats.goals.total ?? 0}
🎯 پاس گل: ${stats.goals.assists ?? 0}
📊 بازی‌ها: ${stats.games.appearences ?? 0}
🟥 قرمز: ${stats.cards.red}
🟨 زرد: ${stats.cards.yellow}
`;

    ctx.reply(message);
  } catch (error) {
    console.error('❌ خطا در API:', error);
    ctx.reply('خطایی در دریافت اطلاعات بازیکن رخ داد 😢 لطفاً دوباره امتحان کن.');
  }
});

// راه‌اندازی سرور و webhook
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/'));

app.get('/', (req, res) => {
  res.send('✅ ربات فوتبال با موفقیت اجرا شده است.');
});

(async () => {
  try {
    await bot.telegram.setWebhook(`${DOMAIN}/`);
    app.listen(PORT, () => {
      console.log(`🚀 سرور روی پورت ${PORT} اجرا شد`);
    });
    console.log('🤖 ربات به صورت webhook راه‌اندازی شد');
  } catch (err) {
    console.error('❌ خطا در راه‌اندازی webhook:', err);
  }
})();

// توقف امن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));