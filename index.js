require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 10000;

// استارت بات
bot.start(ctx => {
  ctx.reply('سلام! نام بازیکن فوتبال رو به انگلیسی بفرست تا اطلاعاتش رو از Transfermarkt برات بیارم.');
});

bot.on('text', async ctx => {
  const name = ctx.message.text.trim();
  ctx.reply(`🔍 در حال جستجو برای "${name}" در Transfermarkt...`);
  
  try {
    // مرحله 1: جستجو در سایت
    const searchUrl = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent':'Mozilla/5.0' } });
    const searchHtml = await searchRes.text();
    const $s = cheerio.load(searchHtml);
    const firstLink = $s('table.items tbody tr').first().find('a.spielprofil_tooltip').attr('href');
    if (!firstLink) return ctx.reply('⚠️ بازیکنی پیدا نشد! مطمئن شو نام رو درست فرستادی.');

    const playerUrl = 'https://www.transfermarkt.com' + firstLink;
    const playerRes = await fetch(playerUrl, { headers: { 'User-Agent':'Mozilla/5.0' } });
    const playerHtml = await playerRes.text();
    const $ = cheerio.load(playerHtml);

    const fullName = $('#main h1').text().trim();
    const dataList = $('.info-table .dataZusatzbox').text().trim().split('\n').map(s => s.trim()).filter(Boolean);
    const nationality = $('img.flaggenrahmen').attr('alt');
    const age = dataList.find(l => l.includes('age'))?.split(' ')[1] || '—';
    const position = $('span.position').text().trim();
    const club = $('.marktwert-position + a').text().trim();

    const message = `
👤 اسم: *${fullName}*
🎂 سن: ${age}
🇳🇱 ملیت: ${nationality}
📌 پست: ${position}
🏟 تیم فعلی: ${club}
🔗 پروفایل: [Transfermarkt](${playerUrl})
`;
    ctx.replyWithMarkdown(message);
  } catch(err) {
    console.error(err);
    ctx.reply('❌ خطا در دریافت اطلاعات، دوباره تلاش کن.');
  }
});

// وب‌سرور (برای deploy روی سرورها)
const app = express();
app.get('/', (req, res) => res.send('⚽ TM Football Bot آنلاین است'));
app.listen(PORT, () => console.log(`🚀 سرور روی پورت ${PORT}`));

bot.launch().then(() => console.log('🤖 ربات راه‌اندازی شد'));
process.once('SIGINT', ()=> bot.stop());
process.once('SIGTERM', ()=> bot.stop());