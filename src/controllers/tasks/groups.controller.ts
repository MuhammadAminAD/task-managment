import { Request, Response } from "express";
import { openDb } from "../../config/database.config.js";

export class GroupController {
    async get(req: Request, res: Response) {
        try {
            const db = await openDb();
            const list = await db.all('SELECT * FROM "groups"') || [];

            return res
                .status(200)
                .send({ ok: true, data: list });
        } catch (error) {
            return res.status(500).send({ ok: false, error: error.message });
        }
    }

    async create (req: Request , res:Response){
        try {
            const {title} = req.body
            const db = await openDb()
            db.run("INSERT INTO groups (title) VALUES (?) " , [title])

            return res
            .status(201)
            .send({ok: true , message: "group create"})
        } catch (error) {
            return res.status(500).send({ ok: false, error: error.message });
        }
    }
    async delete (req: Request , res:Response){
        try {
            const {id} = req.params
            const db = await openDb()
            await db.run("DELETE FROM groups WHERE ID = ?" , [id])

            return res
            .status(204)
        } catch (error) {
            return res.status(500).send({ ok: false, error: error.message });
        }
    }
}