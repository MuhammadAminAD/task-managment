// await pool.query(`
//   CREATE TABLE IF NOT EXISTS taskItems (
//     id SERIAL PRIMARY KEY,
//     title TEXT NOT NULL,
//     status BOOLEAN DEFAULT FALSE,
//     task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE
//   )
// `);

import { Request, Response } from "express";
import pool from "../../config/database.config.js";

export class TaskItemsController {
    async create(req: Request, res: Response) {
        try {
            const { title, status, task } = req.body
            if (!task || !title) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: '"task" and "title" are required.' })
            }
            const inserted = await pool.query(
                `INSERT INTO taskItems (title, status, task_id) VALUES ($1, $2, $3) RETURNING id`,
                [title, status ?? false, task]
            )

            const newItemId = inserted.rows[0].id

            await pool.query(
                `UPDATE tasks SET items = array_append(items, $1) WHERE id = $2`,
                [newItemId, task]
            )

            return res
                .status(201)
                .send({ ok: true, message: "Item added to task." })
        } catch (error) {
            if (error.code === "23503") {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Invalid item id." });
            }

            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }

    async get(req: Request, res: Response) {
        try {
            // @ts-ignore
            const { id } = req.params
            if (!id) {
                return res
                    .status(400)
                    .send({ ok: true, error_message: "'id' is required." })
            }
            const tasks = (await pool.query(`SELECT * FROM taskItems WHERE task_id = $1`, [id])).rows

            return res.send({ ok: true, data: tasks })
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }

    async put(req: Request, res: Response) {
        try {
            const { title, status, id } = req.body
            if (!id) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: '"id" is required.' })
            }
            if (!title && !status) {
                return res
                    .status(304)
                    .send({ ok: true })
            }
            const prevData = (await pool.query(`SELECT * FROM taskItems WHERE id = $1`, [id])).rows[0]
            if (!prevData) {
                return res
                    .status(404)
                    .send({ ok: false, error_message: "This task not found!" })
            }
            prevData.title = title ?? prevData.title
            prevData.status = status ?? prevData.status

            await pool.query(`UPDATE taskItems SET title = $1, status = $2 WHERE id = $3`,
                [prevData.title, prevData.status, prevData.id])
            return res
                .status(200)
                .send({ ok: true, message: "Task updated." })

        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params
            if (!id) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Task id is required." })
            }
            await pool.query(`DELETE FROM taskItems WHERE id = $1`, [id])
            return res
                .status(204).send()
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }
}