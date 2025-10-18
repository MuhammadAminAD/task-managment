import { Request, Response } from "express";
import TokenUtile from "../../utils/token.util.js";

export class TokenController {
    refresh(req: Request, res: Response) {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            return res.status(401).send({ ok: false, error_message: "User unauthorized." });
        }

        const verifyRefreshToken = TokenUtile.verifyRefresh(refreshToken);
        if (!verifyRefreshToken.ok) {
            return res.status(401).send({ ok: false, error_message: "User unauthorized." });
        }

        const { id } = verifyRefreshToken.data as any;
        const newAccess = TokenUtile.createAccess({ id: id });

        return res.status(200).send({
            ok: true,
            data: { access_token: newAccess },
        });
    }
}
