import { Request, Response } from "express"
import pool from "../../config/database.config.js"

export class TasksController {
    async create(req: Request, res: Response) {
        // @ts-ignore
        const UID = req.user.id;
        const { title, expire, group } = req.body;

        try {
            if (!title || !expire) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: `"title" and "expire" are required!` });
            }

            const groupID = group === "null" ? null : Number(group);
            if (groupID !== null && isNaN(groupID)) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: `"group" must be a valid number!` });
            }

            let task = await pool.query(
                `INSERT INTO tasks (title, expire, group_id, owner)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
                [title, expire, groupID, UID]
            );

            task = task.rows[0];

            return res.status(201).send({
                ok: true,
                message: "Task has been successfully created.",
                data: task,
            });
        } catch (error) {
            return res.status(500).send({
                ok: false,
                error_message: `SERVER ERROR!`,
                error,
            });
        }
    }


    async get(req: Request, res: Response) {
        // @ts-ignore
        const UID = req.user.id
        const { group } = req.query
        try {
            let query = "SELECT * FROM tasks WHERE owner = $1"
            const params = [UID]
            if (group) {
                query += " AND group_id = $2"
                params.push(group)
            }
            query += ' ORDER BY expire ASC';
            const tasks = (await pool.query(query, params)).rows
            await Promise.all(
                tasks.map(async (task) => {
                    if (task.items && task.items.length > 0) {
                        const itemsResult = await pool.query(
                            `SELECT * FROM taskItems WHERE id = ANY($1)`,
                            [task.items]
                        );
                        task.itemsData = itemsResult.rows;
                    } else {
                        task.itemsData = [];
                    }
                })
            );
            const returnInformation = { success: [], todo: [], progress: [] }
            returnInformation.success = tasks.filter(task => task.status == "success")
            returnInformation.todo = tasks.filter(task => task.status == "to-do")
            returnInformation.progress = tasks.filter(task => task.status == "in-progress")
            return res
                .status(200)
                .send({ ok: true, data: returnInformation })
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }

    async put(req: Request, res: Response) {
        try {
            // @ts-ignore
            const UID = req.user.id
            const { title, status, group, id } = req.body
            if (!id) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Task id is required." })
            }
            const prevData = (await pool.query(`SELECT * FROM tasks WHERE id = $1`, [id])).rows[0]
            if (!prevData) {
                return res
                    .status(404)
                    .send({ ok: false, error_message: "This task not found!" })
            }
            if (prevData.owner != UID) {
                return res
                    .status(403)
                    .send({ ok: false, error_message: "The task belongs to another user." })
            }
            prevData.title = title ?? prevData.title
            prevData.status = status ?? prevData.status
            prevData.group_id = group ?? prevData.group_id
            await pool.query(`UPDATE tasks SET title = $1, status = $2, group_id =$3 WHERE id = $4`,
                [prevData.title, prevData.status, prevData.group_id, prevData.id])
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
            // @ts-ignore
            const UID = req.user.id
            const { id } = req.params
            if (!id) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: "Task id is required." })
            }
            await pool.query(`DELETE FROM tasks WHERE owner = $1 AND id = $2`, [UID, id])
            return res
                .status(204).send()
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }
}