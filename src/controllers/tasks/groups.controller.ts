import { Request, Response } from "express"
import pool from "../../config/database.config.js"
export class GroupsController {
    async create(req: Request, res: Response) {
        try {
            // @ts-ignore
            const UID = req.user.id
            const { title } = req.body
            if (!title) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: '"title" is required.' })
            }
            await pool.query(`INSERT INTO groups (title, owner) VALUES ($1,$2)`, [title, UID])
            return res
                .status(201)
                .send({ ok: true, message: "Group been successfully created." })
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }

    async get(req: Request, res: Response) {
        try {
            // @ts-ignore
            const UID = req.user.id
            const groups = (await pool.query(`SELECT * FROM groups WHERE owner = $1 ORDER BY title ASC`, [UID])).rows
            return res
                .send({ ok: true, data: groups })
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
            const { id, title } = req.body
            await pool.query(`UPDATE groups SET title = $1 WHERE owner = $2 AND id = $3`, [title, UID, id])
            return res
                .status(200)
                .send({ ok: true, message: "Group updated." })
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
            await pool.query(`DELETE FROM groups WHERE owner = $1 AND id = $2`, [UID, id])
            return res
                .status(204)
                .send()
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }
}