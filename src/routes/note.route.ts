import { Router } from "express";
import { NoteController } from "../controllers/notes/note.controller.js";

const noteRoute = Router();
const note = new NoteController();

// 🟩 CREATE
noteRoute.post("/", note.createNote);          // Note yaratish
noteRoute.post("/section", note.createSection); // Section yaratish
noteRoute.post("/content", note.createContent); // Content yaratish

// 🟨 UPDATE
noteRoute.put("/", note.putNote);               // Note update qilish (PUT)

// 🟦 GET
noteRoute.get("/", note.getNote);               // Barcha notelarni olish
noteRoute.get("/content/:id", note.getNoteContent); // Note contentini olish

export default noteRoute;
