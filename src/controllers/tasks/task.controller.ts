import { Request, Response } from "express";
import { openDb } from "../../config/database.config.js";

export class TaskController {
    // 1. Jadval yaratish
    async init(_req: Request, res: Response) {
        try {
            const db = await openDb();
            await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          expire TEXT,
          status TEXT DEFAULT 'to-do'
        )
      `);
            res.status(200).json({ ok: true, message: "DB initialized ✅" });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 2. Task qo‘shish
    async create(req: Request, res: Response) {
        const { title, expire, status } = req.body;
        try {
            if (!title || !expire) {
                let error = "";
                if (!title && !expire) error = "title and expire are required";
                else if (!title) error = "title is required";
                else error = "expire is required";
                return res.status(400).json({ ok: false, error_message: error });
            }

            const db = await openDb();
            await db.run(
                "INSERT INTO tasks (title, expire, status) VALUES (?, ?, ?)",
                [title, expire, status || "to-do"]
            );

            res.json({ ok: true, message: "Task added ✅" });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 3. Barcha tasklarni olish
    async getAll(_req: Request, res: Response) {
        try {
            const db = await openDb();
            const tasks = await db.all("SELECT * FROM tasks");
            const data = {success: [] , progress: [] , todo:[]}
            data.success = tasks.filter((task) => task.status === "success")
            data.progress = tasks.filter((task) => task.status === "in-progress")
            data.todo = tasks.filter((task) => task.status === "to-do")

            res.json({ ok: true, data: data });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 4. Faqat ma’lum statusdagi tasklarni olish
    async getByStatus(req: Request, res: Response) {
        const { status } = req.params;
        try {
            const db = await openDb();
            const tasks = await db.all("SELECT * FROM tasks WHERE status = ?", [
                status,
            ]);
            res.json({ ok: true, data: tasks });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 5. Taskni yangilash (title, expire, yoki status)
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { title, expire, status } = req.body;
        try {
            const db = await openDb();
            const prev: {id: string , title: string , expire: string , status: string} = await db.get("SELECT * FROM tasks WHERE id = ?" , [id])
            prev.title = title || prev.title
            prev.expire = expire || prev.expire
            prev.status = status || prev.status
            await db.run(
                "UPDATE tasks SET title = ?, expire = ?, status = ? WHERE id = ?",
                [prev.title, prev.expire, prev.status, prev.id]
            );
            res.json({ ok: true, message: "Task updated ✅" });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 6. Taskni o‘chirish
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const db = await openDb();
            await db.run("DELETE FROM tasks WHERE id = ?", [id]);
            res.json({ ok: true, message: "Task deleted 🗑️" });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }
}
