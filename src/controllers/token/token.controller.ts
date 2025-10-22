import { Request, Response } from "express";
import TokenUtile from "../../utils/token.util.js";

export class TokenController {
    refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.body.refresh_token;

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
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }
    async tokensWithCode(req: Request, res: Response) {
        try {
            const { code } = req.params;
            if (!code) {
                return res
                    .status(400)
                    .send({ ok: false, error_message: '"code" is required.' })
            }
            const verifyUser = TokenUtile.verifyCodeToken(code)

            if (!verifyUser.ok) {
                return res
                    .status(401)
                    .send({ ok: false, error_message: "Invalid or expired code." })
            }

            const { id } = verifyUser.data as { id: number };
            const accessToken = TokenUtile.createAccess({ id: id });
            const refreshToken = TokenUtile.createRefresh({ id: id });
            return res.status(200).send({
                ok: true,
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken
                },
            });
        } catch (error) {
            return res
                .status(500)
                .send({ ok: false, error_message: `SERVER ERROR!`, error: error })
        }
    }
}
