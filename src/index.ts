import express from "express";
import cors from "cors";
import route from "./routes/index.route.js";
import env from "dotenv";
import passport from "./config/googleAuth20.config.js";
import { createTables } from "./models/index.models.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";

env.config();
const app = express();
const port = process.env.PORT || 3000;

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        }
    }
}));


// CORS
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

// Public folder - loyihangiz ildizidagi public papka
const publicPath = path.join(__dirname, "..", "public");
app.use("/public", express.static(publicPath));

// Passport
app.use(passport.initialize());

// Body validation
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

// DB
createTables();

// API routes
app.use("/api/v1", route);

// Start server
app.listen(port, () => {
    console.log(`✅ THE SERVER STARTED ON PORT ${port}`);
});