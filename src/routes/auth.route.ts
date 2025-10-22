import { Router } from "express";
import passport from "passport";
import { Request, Response } from "express"
import TokenUtile from "../utils/token.util.js";
import { TokenController } from "../controllers/token/token.controller.js";
const authRoute = Router()
const token = new TokenController()

authRoute.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }))
authRoute.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req: Request, res: Response) => {
        // @ts-ignore
        const code = TokenUtile.codeGetToken({ id: req.user.id });
        return res.redirect(`${process.env.FRONTEND_URL}/token?code=${code}`);
    }
)

authRoute.post("/token", token.refresh)
authRoute.get("/code/:code", token.tokensWithCode)

export default authRoute