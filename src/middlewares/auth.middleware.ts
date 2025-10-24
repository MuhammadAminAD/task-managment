import { Request, Response, NextFunction } from "express";
import TokenUtile from "../utils/token.util.js";
import pool from "../config/database.config.js";

export async function VerifyUserMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).send({ ok: false, error_message: "User unauthorized." });
        }

        const token = authHeader.split(" ")[1];
        const verifyToken = TokenUtile.verifyAccess(token);

        if (verifyToken.ok) {
            // @ts-ignore
            const userId = verifyToken.data?.id
            const isExistUser = (await pool.query("select * from users where id = $1", [userId]))?.rows[0]
            if (isExistUser) {
                req.user = verifyToken.data;
                return next();
            } else {
                return res
                    .status(401)
                    .send({ ok: false, error_message: "Token not found or expired!" })
            }
        } else {
            return res
                .status(401)
                .send({ ok: false, error_message: "Token not found or expired!" })
        }
    } catch (err: any) {
        return res.status(500).send({ ok: false, error_message: "Server error." });
    }
}
