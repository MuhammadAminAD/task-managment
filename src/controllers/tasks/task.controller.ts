import { Request, response, Response } from "express";
import { openDb } from "../../config/database.config.js";

export class TaskController {
    // 🧱 1. Jadval yaratish
    async init(_req: Request ,res:Response) {
        try {
            const db = await openDb();
            await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          expire TEXT
        )
      `);
            res.status(200).send({ok:true, message: "db inited"})
        } catch (error) {
            console.error(error)
            return res.status(500).send({ok:true, message: "db inited" , error: error})
        }
    }

    async create(req: Request, res: Response) {
        const { title, expire } = req.body;
        try {
            if (!title || !expire) {
                let error = ""
                if (!title && !expire) {error = "title and expire are required"}
                else if (!title) {error = "title is required"}
                else {error = "expire is required"}
                return res
                    .status(400)
                    .send({ ok: false, error_message: error })
            }

            const db = await openDb();
            await db.run("INSERT INTO tasks (title, expire) VALUES (?, ?)", [
                title,
                expire,
            ]);
            res.json({ok:true,  message: "Task added ✅" });
        } catch (error) {
            res.status(500).json({ error });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const db = await openDb();
            const tasks = await db.all("SELECT * FROM tasks");
            res.json(tasks);
        } catch (error) {
            res.status(500).json({ error });
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { title, expire } = req.body;
        try {
            const db = await openDb();
            await db.run("UPDATE tasks SET title = ?, expire = ? WHERE id = ?", [
                title,
                expire,
                id,
            ]);
            res.json({ message: "Task updated ✅" });
        } catch (error) {
            res.status(500).json({ error });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const db = await openDb();
            await db.run("DELETE FROM tasks WHERE id = ?", [id]);
            res.json({ message: "Task deleted ✅" });
        } catch (error) {
            res.status(500).json({ error });
        }
    }
}
