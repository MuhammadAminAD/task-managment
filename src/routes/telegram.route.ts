import { Router } from "express";
import { TelegramController } from "../controllers/telegram/telegram.controller.js";
// import { getAllChats, getChatMessages, loginTelegram, markAsRead, sendMessage, verifyTelegram } from "../controllers/telegram/telegram.controller.js";

const telegramRoute = Router()
const telegram = new TelegramController()

telegramRoute.post("/login", telegram.login);
telegramRoute.post("/verify", telegram.verify);

// // Chats
// telegramRoute.get("/chats", getAllChats);
// telegramRoute.get("/chats/:chatId/messages", getChatMessages);
// telegramRoute.post("/chats/send", sendMessage);
// telegramRoute.post("/chats/mark-read", markAsRead);

export default telegramRoute