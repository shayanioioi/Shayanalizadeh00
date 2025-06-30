require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// تابع فرار برای MarkdownV2
const escapeMarkdown = (text) => text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

// 🚀 /start: دکمه فکت فوتبال
bot.start((ctx) => {
  ctx.reply(
    'سلام! به ربات فوتبال خوش اومدی 🌟\nمیتونی نام بازیکن رو بفرستی یا از دکمه زیر استفاده کنی:',
    Markup.inlineKeyboard([
      Markup.button.callback('📌 فکت فوتبال', 'fact')
    ])
  );
});

// 🎯 دکمه فکت فوتبال
bot.action('fact', async (ctx) => {
  try {
    const factsData = fs.readFileSync('./footballFacts.json', 'utf-8');
    const facts = JSON.parse(factsData);
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    await ctx.reply(`📢 فکت فوتبال:\n${randomFact}`);
  } catch (error) {
    console.error("❌ خطا در خواندن فایل:", error);
    await ctx.reply("❗ خطا در دریافت فکت فوتبال.");
  }
});

// 🔍 جستجوی بازیکن
bot.on('text', async (ctx) => {
  const name = ctx.message.text.trim();
  if (!name) return ctx.reply('❗ لطفاً نام بازیکن رو وارد کن.');

  await ctx.reply(`🔍 در حال جستجو برای "${name}" ...`);

  try {
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const row = $('table.items tbody tr').first();
    const link = row.find('a.spielprofil_tooltip').attr('href');

    if (!link) {
      return ctx.reply('❌ بازیکنی پیدا نشد!');
    }

    const profileUrl = 'https://www.transfermarkt.com' + link;
    const playerRes = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const playerHtml = await playerRes.text();
    const $$ = cheerio.load(playerHtml);

    const fullName = $$('#main h1').text().trim() || 'نامشخص';
    const position = $$('span.data-header__label').text().trim() || 'نامشخص';
    const club = $$('a.data-header__club-link').first().text().trim() || 'نامشخص';
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
    console.error('❌ خطا در پردازش:', err);
    ctx.reply('❗ مشکلی در دریافت اطلاعات پیش آمد.');
  }
});

// 🟢 راه‌اندازی ربات
if (require.main === module) {
  bot.launch()
    .then(() => console.log("🤖 ربات فعال شد!"))
    .catch(err => console.error("⚠️ خطا:", err));
}