import { Request, Response } from "express";
import { openDb } from "../../config/database.config.js";

export class TaskController {
    // 1. Jadval yaratish
    async init(_req: Request, res: Response) {
        try {
            const db = await openDb();

            // Groups jadvalini yaratish
            await db.exec(`
            CREATE TABLE IF NOT EXISTS groups(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL
            );
        `);

            // Tasks jadvalini yaratish
            await db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                expire TEXT NOT NULL,
                status TEXT DEFAULT 'to-do' NOT NULL,
                group_id INTEGER DEFAULT 0,
                created TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (group_id) REFERENCES groups(ID) ON DELETE SET DEFAULT
            );
        `);

            // MIGRATION: Agar eski tasks jadvalida group_id yo'q bo'lsa, qo'shish
            const columns = await db.all(`PRAGMA table_info(tasks);`);
            const hasGroupId = columns.some((col: any) => col.name === 'created');

            if (!hasGroupId) {
                console.log('Adding group_id column to existing tasks...');
                await db.exec(`ALTER TABLE tasks ADD COLUMN created TEXT;`);
                await db.exec(`UPDATE tasks SET created = datetime('now') WHERE created IS NULL;`);
            }

            // Task items jadvalini yaratish
            await db.exec(`
            CREATE TABLE IF NOT EXISTS task_items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                done BOOLEAN DEFAULT 0,
                task_id INTEGER,
                FOREIGN KEY (task_id) REFERENCES tasks(ID) ON DELETE CASCADE
            );
        `);

            res.status(200).json({ ok: true, message: "DB initialized ✅" });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 2. Task qo‘shish
    async create(req: Request, res: Response) {
        const { title, expire, status, group } = req.body;
        try {
            if (!title || !expire) {
                let error = !title && !expire
                    ? "title and expire are required"
                    : !title
                        ? "title is required"
                        : "expire is required";
                return res.status(400).json({ ok: false, error_message: error });
            }

            const created = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const db = await openDb();
            await db.run(
                'INSERT INTO tasks (title, expire, status, group_id, created) VALUES (?, ?, ?, ?, ?)',
                [title, expire, status || "to-do", group || 0, created]
            );

            res.json({ ok: true, message: "Task added ✅" });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 3. Barcha tasklarni olish
    async getAll(req: Request, res: Response) {
        try {
            const group = typeof req.query.group === "string" ? req.query.group : null;
            const db = await openDb();
            const data = { success: [], progress: [], todo: [] };

            let tasks: any[] = [];
            if (group && group.length > 0) {
                tasks = await db.all('SELECT * FROM tasks WHERE group_id = ?', [group]);
            } else {
                tasks = await db.all("SELECT * FROM tasks");
            }

            await Promise.all(
                tasks.map(async (task) => {
                    const items = await db.all("SELECT * FROM task_items WHERE task_id = ?", [task.id]);
                    task.items = items;
                })
            );

            // Tasklarni status bo‘yicha ajratish
            data.success = tasks
                .filter((t) => t.status === "success")
                .sort((a, b) => new Date(a.expire).getTime() - new Date(b.expire).getTime());

            data.progress = tasks
                .filter((t) => t.status === "in-progress")
                .sort((a, b) => new Date(a.expire).getTime() - new Date(b.expire).getTime());

            data.todo = tasks
                .filter((t) => t.status === "to-do")
                .sort((a, b) => new Date(a.expire).getTime() - new Date(b.expire).getTime());

            res.json({ ok: true, data });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 4. Faqat ma’lum statusdagi tasklarni olish
    async getByStatus(req: Request, res: Response) {
        const { status } = req.params;
        try {
            const db = await openDb();
            const tasks = await db.all("SELECT * FROM tasks WHERE status = ?", [status]);
            res.json({ ok: true, data: tasks });
        } catch (error: any) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }

    // 5. Taskni yangilash (title, expire, yoki status)
    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { title, expire, status, group } = req.body;
        try {
            const db = await openDb();
            const prev = await db.get("SELECT * FROM tasks WHERE id = ?", [id]);

            if (!prev) {
                return res.status(404).json({ ok: false, message: "Task not found" });
            }

            const newTitle = title || prev.title;
            const newExpire = expire || prev.expire;
            const newStatus = status || prev.status;
            const newGroup = group || prev.group_id || 0;

            await db.run(
                'UPDATE tasks SET title = ?, expire = ?, status = ?, group_id = ? WHERE id = ?',
                [newTitle, newExpire, newStatus, newGroup, id]
            );

            const updated = await db.get("SELECT * FROM tasks WHERE id = ?", [id]);

            res.json({ ok: true, message: "Task updated ✅", data: updated });
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
