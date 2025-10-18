import { Request, Response } from "express";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import fs from "fs";
import pool from "../../config/database.config.js";
// import { computeCheck } from 'telegram/Password'

const apiId = 27468714;
const apiHash = "8dba40b42224c46f65e8fac79987fc96";
const sessionFile = "./session.txt";

// 🔹 Login jarayonidagi vaqtinchalik ma'lumotlarni saqlash
const pendingLogins = new Map<string, { client: TelegramClient; phoneCodeHash: string }>();

// 🔹 Avvaldan mavjud session faylni o'qish
let sessionString = fs.existsSync(sessionFile)
    ? fs.readFileSync(sessionFile, "utf8").trim()
    : "";

const stringSession = new StringSession(sessionString);
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

let isConnected = false;

async function connectClient(): Promise<TelegramClient> {
    if (isConnected) return client;
    console.log("📡 Telegram'ga ulanmoqda...");

    if (!sessionString) {
        console.log("❌ Session topilmadi. Iltimos /telegram/login orqali login qiling.");
        throw new Error("Session topilmadi");
    } else {
        await client.connect();
        console.log("✅ Telegram ulanildi!");
        isConnected = true;
    }

    return client;
}

// 🔹 Controller: Barcha chatlarni olish
export const getAllChats = async (req: Request, res: Response): Promise<Response> => {
    try {
        const telegram = await connectClient();

        const dialogs = await telegram.getDialogs({ limit: 100 });

        const chats = dialogs.map((dialog) => {
            const entity = dialog.entity;

            // ✅ To'g'ri ID olish
            let id: string | number;
            if (entity instanceof Api.User) {
                id = entity.id.toString();
            } else if (entity instanceof Api.Chat) {
                id = entity.id.toString();
            } else if (entity instanceof Api.Channel) {
                id = entity.id.toString();
            } else {
                id = dialog.id?.toString() || "0";
            }

            let name = "Noma'lum chat";
            let username = null;
            let photo = null;

            if (entity instanceof Api.User) {
                name = entity.firstName
                    ? `${entity.firstName}${entity.lastName ? ' ' + entity.lastName : ''}`
                    : entity.username || "Foydalanuvchi";
                username = entity.username || null;
                photo = entity.photo ? true : false;
            } else if (entity instanceof Api.Chat || entity instanceof Api.Channel) {
                name = entity.title || "Guruh / Kanal";
                username = entity instanceof Api.Channel ? entity.username || null : null;
                photo = entity.photo ? true : false;
            }

            const type = dialog.isChannel
                ? "channel"
                : dialog.isGroup
                    ? "group"
                    : "private";

            const lastMessage = dialog.message;
            let lastMessageText = "";
            let lastMessageDate = null;

            if (lastMessage) {
                lastMessageText = lastMessage.message || "";
                lastMessageDate = lastMessage.date;
            }

            const unreadCount = dialog.unreadCount || 0;

            return {
                id,
                name,
                username,
                type,
                photo,
                unreadCount,
                lastMessage: lastMessageText,
                lastMessageDate: lastMessageDate ? new Date(lastMessageDate * 1000).toISOString() : null,
                // ✅ Entity obyektini ham qaytarish (internal use uchun)
                _entity: entity
            };
        });

        return res.json({ ok: true, count: chats.length, chats });
    } catch (error: any) {
        console.error("❌ Telegram xatosi:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};
// 🔹 Muayyan chat uchun xabarlarni olish
export const getChatMessages = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { chatId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        if (!chatId) {
            return res.status(400).json({ ok: false, message: "Chat ID kerak" });
        }

        const telegram = await connectClient();

        // ✅ Avval entityni olish
        let entity;
        try {
            entity = await telegram.getEntity(Number(chatId));
        } catch (error) {
            return res.status(404).json({
                ok: false,
                message: "Chat topilmadi. Iltimos to'g'ri chat ID kiriting."
            });
        }

        // Xabarlarni olish
        const messages = await telegram.getMessages(entity, {
            limit: Number(limit),
            offsetId: Number(offset) || undefined,
        });

        const formattedMessages = messages.map((msg) => {
            return {
                id: msg.id,
                text: msg.message || "",
                date: msg.date ? new Date(msg.date * 1000).toISOString() : null,
                fromId: msg.fromId ? (msg.fromId as any).userId?.toString() : null,
                isOutgoing: msg.out || false,
                replyTo: msg.replyTo ? (msg.replyTo as any).replyToMsgId : null,
                media: msg.media ? true : false,
                mediaType: msg.media ? msg.media.className : null,
            };
        });

        return res.json({
            ok: true,
            chatId: Number(chatId),
            count: formattedMessages.length,
            messages: formattedMessages
        });
    } catch (error: any) {
        console.error("❌ Telegram xatosi:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 🔹 Xabar yuborish
export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ ok: false, message: "Chat ID va xabar kerak" });
        }

        const telegram = await connectClient();

        // ✅ Avval entityni olish
        let entity;
        try {
            entity = await telegram.getEntity(Number(chatId));
        } catch (error) {
            return res.status(404).json({
                ok: false,
                message: "Chat topilmadi. Iltimos to'g'ri chat ID kiriting."
            });
        }

        const result = await telegram.sendMessage(entity, {
            message
        });

        return res.json({
            ok: true,
            messageId: result.id,
            message: "Xabar yuborildi"
        });
    } catch (error: any) {
        console.error("❌ Telegram xatosi:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// 🔹 Xabarni o'qilgan deb belgilash
export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({ ok: false, message: "Chat ID kerak" });
        }

        const telegram = await connectClient();

        // ✅ Avval entityni olish
        let entity;
        try {
            entity = await telegram.getEntity(Number(chatId));
        } catch (error) {
            return res.status(404).json({
                ok: false,
                message: "Chat topilmadi."
            });
        }

        await telegram.markAsRead(entity);

        return res.json({
            ok: true,
            message: "Chat o'qilgan deb belgilandi"
        });
    } catch (error: any) {
        console.error("❌ Telegram xatosi:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};

// // 🔹 /telegram/login — Telefon raqamga kod yuborish
// export const loginTelegram = async (req: Request, res: Response): Promise<Response> => {
//     let loginClient: TelegramClient | null = null;

//     try {
//         const { phone } = req.body;

//         if (!phone) {
//             return res.status(400).json({ ok: false, message: "Telefon raqam kerak" });
//         }

//         const tempSession = new StringSession("");
//         loginClient = new TelegramClient(tempSession, apiId, apiHash, {
//             connectionRetries: 5,
//         });

//         await loginClient.connect();

//         console.log(`📲 Kod yuborilmoqda: ${phone}`);
//         const result = await loginClient.sendCode(
//             {
//                 apiId,
//                 apiHash,
//             },
//             phone
//         );

//         pendingLogins.set(phone, {
//             client: loginClient,
//             phoneCodeHash: result.phoneCodeHash,
//         });

//         setTimeout(() => {
//             if (pendingLogins.has(phone)) {
//                 pendingLogins.get(phone)?.client.disconnect();
//                 pendingLogins.delete(phone);
//                 console.log(`⏰ ${phone} uchun session muddati tugadi`);
//             }
//         }, 5 * 60 * 1000);

//         return res.json({
//             ok: true,
//             phone,
//             message: "Kod yuborildi. 5 daqiqa ichida /telegram/verify orqali kodni yuboring.",
//         });
//     } catch (error: any) {
//         if (loginClient) {
//             await loginClient.disconnect();
//         }
//         console.error("❌ Telegram login xatosi:", error);
//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };

// // 🔹 /telegram/verify — SMS kodni tasdiqlash va sessiyani saqlash
// export const verifyTelegram = async (req: Request, res: Response): Promise<Response> => {
//     try {
//         const { phone, code } = req.body;

//         if (!phone || !code) {
//             return res.status(400).json({ ok: false, message: "Telefon va kod kerak" });
//         }

//         const loginData = pendingLogins.get(phone);

//         if (!loginData) {
//             return res.status(400).json({
//                 ok: false,
//                 message: "Login sessiyasi topilmadi yoki muddati tugagan. Iltimos qaytadan /telegram/login qiling."
//             });
//         }

//         const { client: loginClient, phoneCodeHash } = loginData;

//         await loginClient.invoke(
//             new Api.auth.SignIn({
//                 phoneNumber: phone,
//                 phoneCodeHash: phoneCodeHash,
//                 phoneCode: code,
//             })
//         );

//         const savedSession = loginClient.session.save() as unknown as string;
//         fs.writeFileSync(sessionFile, savedSession, "utf8");
//         console.log("✅ Telegram sessiya saqlandi!");

//         sessionString = savedSession;
//         isConnected = false;

//         pendingLogins.delete(phone);

//         return res.json({
//             ok: true,
//             message: "Login muvaffaqiyatli bajarildi!",
//         });
//     } catch (error: any) {
//         console.error("❌ Telegram verify xatosi:", error);

//         if (error.errorMessage === "PHONE_CODE_INVALID") {
//             return res.status(400).json({ ok: false, message: "Noto'g'ri kod" });
//         }

//         if (error.errorMessage === "PHONE_CODE_EXPIRED") {
//             const { phone } = req.body;
//             if (phone && pendingLogins.has(phone)) {
//                 pendingLogins.get(phone)?.client.disconnect();
//                 pendingLogins.delete(phone);
//             }
//             return res.status(400).json({
//                 ok: false,
//                 message: "Kod muddati tugadi. Iltimos qaytadan /telegram/login qiling."
//             });
//         }

//         return res.status(500).json({ ok: false, message: error.message });
//     }
// };


export class TelegramController {
    async login(req: Request, res: Response) {
        const { phone } = req.body
        let loginClient: TelegramClient | null = null
        try {
            if (!phone) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "phone is required" })
            }
            const tempSession = new StringSession("")
            loginClient = new TelegramClient(tempSession, apiId, apiHash, {
                connectionRetries: 5,
            });
            await loginClient.connect()
            const result = await loginClient.sendCode(
                {
                    apiId,
                    apiHash
                },
                phone
            )

            pendingLogins.set(phone, {
                client: loginClient,
                phoneCodeHash: result.phoneCodeHash
            });

            setTimeout(() => {
                if (pendingLogins.has(phone)) {
                    pendingLogins.get(phone)?.client.disconnect()
                    pendingLogins.delete(phone)
                }
            }, 5 * 60 * 1000)

            return res.json({
                ok: true,
                phone,
                message: "Code sent.",
            });
        } catch (error) {
            if (loginClient) {
                await loginClient.disconnect();
            }
            return res.status(500).json({ ok: false, message: error.message });
        }
    }

    async verify(req: Request, res: Response) {
        try {
            // @ts-ignore
            const UID = req.user?.id
            const { phone, code, password } = req.body

            if (!phone || !code) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Phone and code are required" })
            }

            const loginData = pendingLogins.get(phone)
            if (!loginData) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Login not found or expired, please try logging in again." })
            }

            const { client: loginClient, phoneCodeHash } = loginData

            try {
                await loginClient.invoke(
                    new Api.auth.SignIn({
                        phoneNumber: phone,
                        phoneCodeHash: phoneCodeHash,
                        phoneCode: code
                    })
                )
            } catch (error) {
                // Check if 2FA is required
                if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
                    if (!password) {
                        return res.status(403).json({
                            ok: false,
                            requires2FA: true,
                            message: "2FA password required. Please provide your password."
                        });
                    }

                    // Sign in with 2FA password using built-in method
                    await loginClient.signInWithPassword(
                        {
                            apiId,
                            apiHash
                        },
                        {
                            password: password,
                            onError: (err) => {
                                throw err;
                            }
                        }
                    );
                } else {
                    throw error;
                }
            }

            const savedSession = loginClient.session.save() as unknown as string

            await pool.query(
                `INSERT INTO telegramSessions (session, phone, owner) VALUES ($1, $2, $3)`,
                [savedSession, phone, UID]
            )

            // Clean up
            pendingLogins.delete(phone)

            return res
                .status(200)
                .send({ ok: true, message: "Login was successful." })
        } catch (error) {
            console.error("❌ Telegram verify xatosi:", error);

            if (error.errorMessage === "PHONE_CODE_INVALID") {
                return res.status(400).json({ ok: false, message: "Noto'g'ri kod" });
            }

            if (error.errorMessage === "PHONE_CODE_EXPIRED") {
                const { phone } = req.body;
                if (phone && pendingLogins.has(phone)) {
                    pendingLogins.get(phone)?.client.disconnect();
                    pendingLogins.delete(phone);
                }
                return res.status(400).json({
                    ok: false,
                    message: "Kod muddati tugadi. Iltimos qaytadan /telegram/login qiling."
                });
            }

            if (error.errorMessage === "PASSWORD_HASH_INVALID") {
                return res.status(400).json({
                    ok: false,
                    message: "Noto'g'ri 2FA password"
                });
            }

            return res.status(500).json({ ok: false, message: error.message });
        }
    }

    async chats() {

    }
}
