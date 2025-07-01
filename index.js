require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf, Markup } = require('telegraf');
// const cohere = require('cohere-ai'); // حذف شده چون سوال فوتبالی نیست

const bot = new Telegraf(process.env.BOT_TOKEN);

// Escape for MarkdownV2
const escapeMarkdown = (text) => text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

// /start
bot.start((ctx) => {
  ctx.reply(
    'سلام! به ربات فوتبال خوش اومدی 🌟\nمیتونی از گزینه‌های زیر استفاده کنی:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📌 فکت فوتبال', 'fact')],
      [Markup.button.callback('⚽️ اطلاعات بارسلونا', 'barca_info')]
    ])
  );
});

// 📌 فکت فوتبال
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

// جستجوی بازیکن (نام بازیکن)
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
🔗 مشاهده در Transfermarkt
`;

    await ctx.replyWithMarkdownV2(message);
  } catch (err) {
    console.error('❌ خطا در پردازش:', err);
    ctx.reply('❗ مشکلی در دریافت اطلاعات پیش آمد.');
  }
});

// --- اضافه کردن دکمه و فانکشن بارسلونا ---

bot.action('barca_info', async (ctx) => {
  await ctx.editMessageText('اطلاعات بارسلونا رو انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('📅 بازی‌های آینده', 'barca_fixtures')],
    [Markup.button.callback('🏁 نتایج قبلی', 'barca_results')],
    [Markup.button.callback('🩺 مصدومان', 'barca_injuries')],
    [Markup.button.callback('🎯 گلزنان', 'barca_scorers')],
    [Markup.button.callback('🎯 پاس‌دهندگان', 'barca_assists')],
    [Markup.button.callback('🎯 درصد پاس صحیح', 'barca_pass_accuracy')],
    [Markup.button.callback('🔙 بازگشت', 'start')]
  ]));
});

// برگشت به منوی اصلی
bot.action('start', (ctx) => {
  ctx.editMessageText(
    'سلام! به ربات فوتبال خوش اومدی 🌟\nمیتونی از گزینه‌های زیر استفاده کنی:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📌 فکت فوتبال', 'fact')],
      [Markup.button.callback('⚽️ اطلاعات بارسلونا', 'barca_info')]
    ])
  );
});

// Helper برای اسکرپینگ Sofascore بارسلونا
async function fetchSofascorePage() {
  const url = 'https://www.sofascore.com/team/football/fc-barcelona/17'; // لینک صفحه بارسلونا در sofascore
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  return await res.text();
}

// نمونه ساده از اسکرپینگ بازی‌های آینده بارسلونا
bot.action('barca_fixtures', async (ctx) => {
  try {
    const html = await fetchSofascorePage();
    const $ = cheerio.load(html);

    // این بخش باید با توجه به ساختار صفحه sofascore به روز شود
    // این فقط نمونه است که بازی‌های آینده بارسلونا را استخراج می‌کند

    let fixtures = [];
    $('div.sc-fzqBZW.kVvqjl .sc-jTzLTM.gFzDLi').each((i, el) => {
      if (i >= 5) return false; // فقط ۵ بازی آینده را بگیر
      const date = $(el).find('.sc-bXEvKx.kIvgrY').text().trim();
      const teams = $(el).find('.sc-cSHVUG.kfwCuA').text().trim();
      fixtures.push(`${date}: ${teams}`);
    });

    if (fixtures.length === 0) {
      return ctx.reply('بازی آینده‌ای پیدا نشد.');
    }

    await ctx.reply(`📅 بازی‌های آینده بارسلونا:\n${fixtures.join('\n')}`);
  } catch (err) {
    console.error('❌ خطا در دریافت بازی‌های آینده:', err);
    ctx.reply('❗ خطا در دریافت بازی‌های آینده بارسلونا.');
  }
});

// بقیه اکشن‌ها (نتایج قبلی، مصدومان، گلزنان، پاس‌دهندگان، درصد پاس صحیح) رو می‌تونی با اسکرپینگ مشابه پیاده کنی.
// اگر خواستی می‌تونم بقیه‌ش رو هم کامل برات بنویسم.

if (require.main === module) {
  bot.launch()
    .then(() => console.log("🤖 ربات فعال شد!"))
    .catch(err => console.error("⚠️ خطا:", err));
}