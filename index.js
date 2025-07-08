require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const escapeMarkdown = (text) => text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');

// بارگذاری لجندز از فایل جدا
let legendsData = { players: [], coaches: [] };
function loadLegends() {
  try {
    const data = fs.readFileSync('./legends.json', 'utf-8');
    legendsData = JSON.parse(data);
  } catch (error) {
    console.error('❌ خطا در بارگذاری فایل legends.json:', error);
  }
}
loadLegends();

// /start
bot.start((ctx) => {
  ctx.reply(
    'سلام! به ربات فوتبال خوش اومدی 🌟\nمیتونی از گزینه‌های زیر استفاده کنی:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📌 فکت فوتبال', 'fact')],
      [Markup.button.callback('🧙‍♂️ افسانه‌ها', 'legends_main')]
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

// منوی اصلی افسانه‌ها
bot.action('legends_main', async (ctx) => {
  await ctx.editMessageText('لطفا دسته‌بندی افسانه‌ها را انتخاب کن:', Markup.inlineKeyboard([
    [Markup.button.callback('بازیکنان', 'legends_players')],
    [Markup.button.callback('مربیان و مدیرعامل‌ها', 'legends_coaches')],
    [Markup.button.callback('🔙 بازگشت', 'start')]
  ]));
});

// نمایش دکمه‌های بازیکنان
bot.action('legends_players', async (ctx) => {
  const buttons = legendsData.players.map(player => [Markup.button.callback(player.name, `legend_player_${player.name}`)]);
  buttons.push([Markup.button.callback('🔙 بازگشت', 'legends_main')]);
  await ctx.editMessageText('یکی از بازیکنان را انتخاب کن:', Markup.inlineKeyboard(buttons));
});

// نمایش دکمه‌های مربیان و مدیرعامل‌ها
bot.action('legends_coaches', async (ctx) => {
  const buttons = legendsData.coaches.map(coach => [Markup.button.callback(coach.name, `legend_coach_${coach.name}`)]);
  buttons.push([Markup.button.callback('🔙 بازگشت', 'legends_main')]);
  await ctx.editMessageText('یکی از مربیان یا مدیرعامل‌ها را انتخاب کن:', Markup.inlineKeyboard(buttons));
});

// نمایش متن بازیکن
bot.action(/legend_player_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const name = ctx.match[1];
  const player = legendsData.players.find(p => p.name === name);
  if (player) {
    await ctx.reply(player.text);
  } else {
    await ctx.reply('❗ اطلاعاتی برای این بازیکن یافت نشد.');
  }
});

// نمایش متن مربی یا مدیرعامل
bot.action(/legend_coach_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const name = ctx.match[1];
  const coach = legendsData.coaches.find(c => c.name === name);
  if (coach) {
    await ctx.reply(coach.text);
  } else {
    await ctx.reply('❗ اطلاعاتی برای این شخص یافت نشد.');
  }
});

// حذف دکمه اطلاعات بارسلونا (طبق درخواست شما حذف شد)

// جستجوی بازیکن (می‌تونی حذفش کنی اگر لازم نیست)
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

    if (!link) return ctx.reply('❌ بازیکنی پیدا نشد!');

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

// 🟢 اجرای بات
if (require.main === module) {
  bot.launch()
    .then(() => console.log("🤖 ربات فعال شد!"))
    .catch(err => console.error("⚠️ خطا:", err));
}