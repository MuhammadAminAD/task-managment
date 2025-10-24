// index.route.ts
import { Router } from "express";
import { Ai } from "../controllers/ai/ai.controller.js";
import groupRoute from "./group.route.js";
import taskRoute from "./task.route.js";
import authRoute from "./auth.route.js";
import { VerifyUserMiddleware } from "../middlewares/auth.middleware.js";
import telegramRoute from "./telegram.route.js";
import iconRoute from "./icon.route.js";
import noteRoute from "./note.route.js";

const route = Router();
// route.post("/ai", Ai)
route.use("/telegram", VerifyUserMiddleware, telegramRoute)
route.use("/groups", VerifyUserMiddleware, groupRoute)
route.use("/tasks", VerifyUserMiddleware, taskRoute)
route.use("/auth", authRoute)
route.use("/icons", VerifyUserMiddleware, iconRoute)
route.use("/notes", VerifyUserMiddleware, noteRoute)

export default route;       
