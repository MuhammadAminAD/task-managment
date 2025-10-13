import { Request, Response } from "express";
import { openDb } from "../../config/database.config.js";

export class TaskItemController {
    async create(req: Request, res: Response) {
        const { title } = req.body
        const {id} = req.params
        try {
            if (!title || !id) {
                let error = "";
                if (!title && !id) error = "title and id are required";
                else if (!title) error = "title is required";
                else error = "id is required";
                return res.status(400).json({ ok: false, error_message: error });
            }

            const db = await openDb()

            await db.run(
                "INSERT INTO task_items (title , task_id) VALUES (? , ?)", [title , id]
            )
            res.json({ ok: true, message: "Task added ✅" });

        } catch (error) {
            res.status(500).json({ ok: false, error_message: error.message });
        }
    }
}