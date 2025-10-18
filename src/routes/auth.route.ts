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
        const accessToken = TokenUtile.createAccess({ id: req.user.id })
        // @ts-ignore
        const refrashToken = TokenUtile.createRefresh({ id: req.user.id, email: req?.email })
        res.cookie("refresh_token", refrashToken, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return res.redirect(`${process.env.FRONTEND_URL}/token/?token=${accessToken}`);
    }
)

authRoute.get("/token", token.refresh)

export default authRoute