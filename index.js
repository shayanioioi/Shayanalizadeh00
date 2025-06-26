require('dotenv').config();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('سلام! اسم بازیکن فوتبال رو به انگلیسی بفرست تا اطلاعاتش رو از Transfermarkt برات بیارم.');
});

bot.on('text', async (ctx) => {
  const name = ctx.message.text.trim();
  if (!name) return ctx.reply('لطفاً یک نام وارد کن.');

  await ctx.reply(`🔍 در حال جستجو برای "${name}" در سایت Transfermarkt...`);

  try {
    // مرحله 1: جستجو در Transfermarkt
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const searchHtml = await searchRes.text();
    const $s = cheerio.load(searchHtml);

    // پیدا کردن اولین لینک بازیکن در نتایج جستجو
    const firstLink = $s('table.items tbody tr').first().find('a.spielprofil_tooltip').attr('href');
    if (!firstLink) return ctx.reply('⚠️ بازیکنی پیدا نشد! لطفاً نام را دقیق‌تر وارد کن.');

    const playerUrl = 'https://www.transfermarkt.com' + firstLink;

    // مرحله 2: دریافت صفحه بازیکن
    const playerRes = await fetch(playerUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const playerHtml = await playerRes.text();
    const $ = cheerio.load(playerHtml);

    // استخراج اطلاعات بازیکن
    const fullName = $('#main h1').text().trim();

    // ملیت (اولین پرچم)
    const nationality = $('table.main-table tr:contains("Nationality") td').text().trim() || $('img.flaggenrahmen').attr('alt') || 'نامشخص';

    // سن (متن کنار "Date of birth")
    const dobText = $('table.main-table tr:contains("Date of birth") td').text().trim();
    let age = 'نامشخص';
    if (dobText) {
      const ageMatch = dobText.match(/(\d+)\s*years?/i);
      if (ageMatch) age = ageMatch[1];
    }

    // پست
    const position = $('table.main-table tr:contains("Position") td').text().trim() || 'نامشخص';

    // تیم فعلی (داخل لینک با کلاس "data-header__club" یا جدول مخصوص)
    const club = $('a.data-header__club').text().trim() || $('.dataHeader .dataMain .dataContent a').first().text().trim() || 'نامشخص';

    // ارسال پیام با Markdown
    const message = `
👤 *نام:* ${fullName}
🎂 *سن:* ${age}
🇳🇱 *ملیت:* ${nationality}
📌 *پست:* ${position}
🏟️ *تیم فعلی:* ${club}
🔗 [مشاهده پروفایل در Transfermarkt](${playerUrl})
`;

    ctx.replyWithMarkdown(message);

  } catch (error) {
    console.error('❌ خطا در دریافت اطلاعات بازیکن:', error);
    ctx.reply('❌ مشکلی در دریافت اطلاعات پیش آمد، لطفاً دوباره تلاش کنید.');
  }
});

// لانچ بات با polling ساده
bot.launch().then(() => {
  console.log('🤖 ربات با موفقیت راه‌اندازی شد');
});

// توقف امن بات
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));