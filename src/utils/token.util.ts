import jwt from "jsonwebtoken";

class Token {
    createAccess(data: object): string {
        return jwt.sign(data, process.env.ACCESS_SECRET_KEY as string, { expiresIn: "15m" });
    }

    createRefresh(data: object): string {
        return jwt.sign(data, process.env.REFRESH_SECRET_KEY as string, { expiresIn: "30d" });
    }

    verifyAccess(token: string): { ok: boolean; data?: object; error?: string } {
        try {
            const data = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as object;
            return { ok: true, data };
        } catch (err: any) {
            return { ok: false, error: err.message || "Token expired or invalid." };
        }
    }

    verifyRefresh(token: string): { ok: boolean; data?: object; error?: string } {
        try {
            const data = jwt.verify(token, process.env.REFRESH_SECRET_KEY as string) as object;
            return { ok: true, data };
        } catch (err: any) {
            return { ok: false, error: err.message || "Token expired or invalid." };
        }
    }

    codeGetToken(code: string): string {
        return jwt.sign(code, process.env.ACCESS_SECRET_KEY as string, { expiresIn: "15m" });
    }

    verifyCodeToken(token: string): { ok: boolean; data?: object; error?: string } {
        try {
            const data = jwt.verify(token, process.env.ACCESS_SECRET_KEY as string) as object;
            return { ok: true, data };
        } catch (err: any) {
            return { ok: false, error: err.message || "Token expired or invalid." };
        }
    }
}

const TokenUtile = new Token();
export default TokenUtile;
