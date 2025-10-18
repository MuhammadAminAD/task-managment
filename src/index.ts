import express from "express"
import cors from "cors"
import route from "./routes/index.route.js";
import env from "dotenv"
import passport from "./config/googleAuth20.config.js"
import { createTables } from "./models/index.models.js";
import cookieParser from "cookie-parser"
env.config()
const app = express()
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.ORIGIN_ACCESS,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import "./config/bot.config.js"
app.use(passport.initialize());
app.use((req, res, next) => {
    if (req.method === "OPTIONS") return next();
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).send({
                ok: false,
                error_message: "Request body is missing or invalid"
            });
        }
    }
    next();
});
createTables();
app.use("/api/v1", route);
app.listen(port, () => {
    console.log(`✅ THE SERVER STARTED ON PORT ${port}`);
});
