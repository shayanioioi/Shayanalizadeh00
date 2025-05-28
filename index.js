require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_KEY = process.env.API_KEY;

// پیام خوش‌آمد
bot.start((ctx) => {
  ctx.reply('سلام! 👋\nاسم بازیکن رو بفرست تا آمارشو بگم. مثلاً: messi یا ronaldo');
});

// واکنش به هر پیام متنی
bot.on('text', async (ctx) => {
  const playerName = ctx.message.text.trim().toLowerCase();
  if (!playerName) return ctx.reply('اسم بازیکن رو درست وارد کن ✍️');

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

    const playerInfo = data.response[0];
    const stats = playerInfo.statistics[0];

    const message = `
👤 نام: ${playerInfo.player.name}
🎂 سن: ${playerInfo.player.age}
🌍 ملیت: ${playerInfo.player.nationality}
🏟️ تیم: ${stats.team.name}
🧢 پست: ${playerInfo.player.position}
🗓️ فصل: ${stats.league.season}
⚽ گل‌ها: ${stats.goals.total ?? 0}
🎯 پاس گل: ${stats.goals.assists ?? 0}
🟥 کارت قرمز: ${stats.cards.red}
🟨 کارت زرد: ${stats.cards.yellow}
📊 بازی‌ها: ${stats.games.appearences ?? 0}
`;

    ctx.reply(message);
  } catch (error) {
    console.error('❌ خطا در دریافت اطلاعات بازیکن:', error);
    ctx.reply('😢 مشکلی در دریافت اطلاعات بازیکن پیش اومد. بعداً دوباره امتحان کن.');
  }
});

// اجرای بات
bot.launch();
console.log('✅ Bot is running on port 10000');