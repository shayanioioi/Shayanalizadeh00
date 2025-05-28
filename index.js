require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_KEY = process.env.API_KEY;

bot.start((ctx) => ctx.reply('سلام! اسم بازیکن رو بفرست تا آمارشو بگم. مثلا: messi'));

bot.on('text', async (ctx) => {
  const playerName = ctx.message.text.toLowerCase();
  ctx.reply(`در حال جستجو برای بازیکن: ${playerName}...`);

  try {
    // مرحله ۱: جستجوی بازیکن
    const searchRes = await fetch(`https://api-football-v1.p.rapidapi.com/v3/players?search=${playerName}&season=2023`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });

    const searchData = await searchRes.json();

    if (!searchData.response || searchData.response.length === 0) {
      return ctx.reply('بازیکنی با این نام پیدا نشد ❌');
    }

    const player = searchData.response[0];
    const stats = player.statistics[0];

    const message = `
👤 نام: ${player.player.name}
🎂 سن: ${player.player.age}
🏟️ تیم: ${stats.team.name}
🗓️ فصل: ${stats.league.season}
⚽ گل‌ها: ${stats.goals.total || 0}
🎯 پاس گل: ${stats.goals.assists || 0}
🟥 کارت قرمز: ${stats.cards.red}
🟨 کارت زرد: ${stats.cards.yellow}
`;

    ctx.reply(message);
  } catch (error) {
    console.error('❌ Error fetching player:', error.message);
    ctx.reply('مشکلی در دریافت اطلاعات بازیکن پیش اومد 😢');
  }
});

bot.launch();
console.log('Bot is running on port 10000');