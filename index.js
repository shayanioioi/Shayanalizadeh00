require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_KEY = process.env.API_KEY;

// پیام شروع
bot.start((ctx) => {
  ctx.reply('سلام 👋\nاسم بازیکن مورد نظر رو بفرست (مثلاً messi یا cristiano ronaldo) تا آمارشو نشون بدم!');
});

// پاسخ به پیام متنی
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

    // لاگ برای دیباگ
    console.log(JSON.stringify(data, null, 2));

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
📊 تعداد بازی‌ها: ${stats.games.appearences ?? 0}
🟥 کارت قرمز: ${stats.cards.red}
🟨 کارت زرد: ${stats.cards.yellow}
`;

    ctx.reply(message);
  } catch (error) {
    console.error('❌ خطا در گرفتن اطلاعات:', error);
    ctx.reply('مشکلی در دریافت اطلاعات بازیکن پیش اومد 😢');
  }
});

// سرور برای Render یا UptimeRobot
const app = express();
app.get('/', (req, res) => {
  res.send('ربات فوتبال در حال اجراست ✅');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 سرور روی پورت ${PORT} اجرا شد`);
});

// راه‌اندازی ربات
bot.launch();

// توقف امن ربات
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));