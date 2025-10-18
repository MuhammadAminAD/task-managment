import { Telegraf, Markup } from "telegraf";
import env from "dotenv";
env.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const firstName = ctx.from.first_name;
  const requestPhoneButton = Markup.keyboard([
    [Markup.button.contactRequest("📱 Raqamni yuborish")],
  ])
    .resize()
    .oneTime();

  ctx.reply(
    `Hello, ${firstName}! Please press the button below to share your phone number.`,
    requestPhoneButton
  );
});

// Telefon raqam yuborilganda
bot.on("contact", async (ctx) => {
  const contact = ctx.message.contact;
  const phone = contact.phone_number;
  const firstName = contact.first_name || ctx.from.first_name;

  // Token (odatda backenddan olinadi)
  const fakeToken = Buffer.from(`${phone}:${Date.now()}`).toString("base64");
  const link = `https://fintechhub/token?token=${fakeToken}`; // masalan: https://myapp.vercel.app/token?token=...

  const message = `
✅ Raqam qabul qilindi!
👤 Ism: ${firstName}
📞 Raqam: ${phone}
  `;

  await ctx.reply(message.trim(), {
    ...Markup.removeKeyboard(),
    reply_markup: {
      inline_keyboard: [
        [{ text: "👉 Tizimga kirish", url: link }],
      ],
    },
  });
});

bot.launch();
console.log("🤖 Bot ishga tushdi...");
