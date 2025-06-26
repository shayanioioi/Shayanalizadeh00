require('dotenv').config();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Escape متن برای MarkdownV2
const escapeMarkdown = (text) => {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

bot.start((ctx) => {
  ctx.reply('سلام! اسم بازیکن فوتبال رو به انگلیسی بفرست تا اطلاعاتش رو از Transfermarkt بیارم.');
});

bot.on('text', async (ctx) => {
  const name = ctx.message.text.trim();
  if (!name) return ctx.reply('❗ لطفاً نام بازیکن رو وارد کن.');

  await ctx.reply(`🔍 در حال جستجو برای "${name}" ...`);

  try {
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const row = $('table.items tbody tr').first();
    const link = row.find('a.spielprofil_tooltip').attr('href');

    if (!link) {
      return ctx.reply('❌ بازیکنی پیدا نشد! لطفاً نام کامل‌تری وارد کن (مثل "lionel messi").');
    }

    const profileUrl = 'https://www.transfermarkt.com' + link;

    const playerPage = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const playerHtml = await playerPage.text();
    const $$ = cheerio.load(playerHtml);

    const fullName = $$('#main h1').text().trim() || 'نامشخص';
    const position = $$('span.data-header__label').text().trim() || 'نامشخص';
    const club = $$('a.data-header__club-link').first().text().trim() || 'نامشخص';

    // تولد و سن
    const dobRow = $$('span.data-header__bio').text();
    const ageMatch = dobRow.match(/(\d+)\s+years/);
    const age = ageMatch ? ageMatch[1] : 'نامشخص';

    const message = `
👤 *نام:* ${escapeMarkdown(fullName)}
🎂 *سن:* ${escapeMarkdown(age)}
📌 *پست:* ${escapeMarkdown(position)}
🏟 *تیم:* ${escapeMarkdown(club)}
🔗 [مشاهده در Transfermarkt](${profileUrl})
`;

    await ctx.replyWithMarkdownV2(message);
  } catch (err) {
    console.error('❌ خطا در پردازش:', err.stack || err);
    ctx.reply('❗ مشکلی در دریافت اطلاعات بازیکن پیش آمد. لطفاً چند لحظه بعد دوباره تلاش کن.');
  }
});

// فقط در صورتی اجرا بشه که مستقیم با `node index.js` اجرا شده باشه
if (require.main === module) {
  bot.launch()
    .then(() => console.log("🤖 ربات با موفقیت راه‌اندازی شد"))
    .catch(err => console.error("⚠️ خطا در اجرای ربات:", err));
}