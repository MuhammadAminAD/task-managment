import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import fetch from "node-fetch";
import  env  from "dotenv";
env.config()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// ✅ Fayl manzili
const DB_PATH = "./database.db";

// ✅ Start komandasi — 2ta button bilan
bot.start((ctx) => {
  return ctx.reply(
    "📦 Quyidagi amallardan birini tanlang:",
    Markup.keyboard([
      ["📤 Ma'lumotlarni olish"],
      ["📥 Ma'lumotlarni yangilash"],
    ])
      .oneTime()
      .resize()
  );
});

// ✅ Ma'lumotlarni olish — database.db ni yuboradi
bot.hears("📤 Ma'lumotlarni olish", async (ctx) => {
  try {
    if (fs.existsSync(DB_PATH)) {
      await ctx.replyWithDocument({ source: DB_PATH, filename: "database.db" });
    } else {
      await ctx.reply("❌ Fayl topilmadi!");
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
});

// ✅ Ma'lumotlarni yangilash — foydalanuvchidan fayl so‘raymiz
bot.hears("📥 Ma'lumotlarni yangilash", async (ctx) => {
  await ctx.reply("📎 Iltimos, yangi `database.db` faylni yuboring.");
});

// ✅ Fayl yuborilganda uni qabul qilish
bot.on("document", async (ctx) => {
  try {
    const document = ctx.message.document;
    if (!document.file_name.endsWith(".db")) {
      return ctx.reply("❌ Faqat .db fayl yuboring!");
    }
    const fileId = document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
    fs.writeFileSync(DB_PATH, buffer);
    await ctx.reply("✅ database.db fayl yangilandi!");
  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Xatolik yuz berdi faylni yuklashda.");
  }
});

bot.launch();

console.log("🤖 Bot ishga tushdi...");
