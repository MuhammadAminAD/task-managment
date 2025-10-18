import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./database.config.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${process.env.DOMAIN}/api/v1/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails![0].value;
                const name = profile.displayName!;

                let result = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
                let user = result.rows[0];

                // 2. Agar foydalanuvchi yo'q bo'lsa, yaratish
                if (!user) {
                    const insertResult = await pool.query(
                        `INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *`,
                        [email, name]
                    );
                    user = insertResult.rows[0];
                }

                return done(null, user);
            } catch (err) {
                console.error(err);
                return done(err, null);
            }
        }
    )
);

export default passport;
