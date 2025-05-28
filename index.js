require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_KEY = process.env.API_KEY;

// پاسخ اولیه
bot.start((ctx) => {
  ctx.reply('سلام 👋\nاسم بازیکن مورد نظر رو بفرست (مثلاً messi یا ronaldo) تا آمارشو نشون بدم!');
});

// پاسخ به پیام متنی
bot.on('text', async (ctx) => {
  const playerName = ctx.message.text.trim().toLowerCase();
  if (!playerName) return ctx.reply('لطفاً یک نام بازیکن ارسال کن ✍️');

  await ctx.reply(`🔍 در حال جستجو برای بازیکن: ${playerName} ...`);

  try {
    const url = `https://api-football-v1.p.rapidapi.com/v3/players?search=${encodeURIComponent(playerName)}&season=2023`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
    });

    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      return ctx.reply('❌ بازیکنی با این نام پیدا نشد.');
    }

    const player = data.response[0];
    const stats = player.statistics[0];

    const message = `
👤 نام: ${player.player.name}
🎂 سن: ${player.player.age}
🌍 ملیت: ${player.player.nationality}
🏟️ تیم: ${stats.team.name}
🧢 پست: ${player.player.position}
🗓️ فصل: ${stats.league.season}
⚽ گل‌ها: ${stats.goals.total ?? 0}
🎯 پاس گل: ${stats.goals.assists ?? 0}
📊 بازی‌ها: ${stats.games.appearences ?? 0}
🟥 قرمز: ${stats.cards.red}
🟨 زرد: ${stats.cards.yellow}
`;

    ctx.reply(message);
  } catch (error) {
    console.error('❌ خطا در گرفتن اطلاعات:', error);
    ctx.reply('مشکلی در دریافت اطلاعات بازیکن پیش اومد 😢');
  }
});

// راه‌اندازی سرور (برای تست سلامت در Render)
const app = express();
app.get('/', (req, res) => {
  res.send('ربات فوتبال در حال اجراست ✅');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 سرور روی پورت ${PORT} اجرا شد`);
});

// فقط این خط را اضافه کن تا ربات شروع به کار کند (Long Polling برای Render)
bot.launch();

// هندل سیگنال‌های پایان برای جلوگیری از ارور در هاست
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));