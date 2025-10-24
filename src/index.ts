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

// ✅ YANGI: Helmet sozlamalari tuzatildi
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://localhost:5173",
        "ws://localhost:*",
        "https://tmanagment.vercel.app"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://tmanagment.vercel.app"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  // ✅ YANGI: Cross-origin sozlamalari
  crossOriginOpenerPolicy: { policy: "unsafe-none" }, // Yoki "same-origin-allow-popups"
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://tmanagment.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // ✅ YANGI: Origin bo'lmasa ham ruxsat berish
    if (!origin) return callback(null, true);

    // ✅ YANGI: Localhost va production domainlarni tekshirish
    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("tmanagment.vercel.app")
    ) {
      return callback(null, true);
    }

    console.log("CORS blocked for origin:", origin);
    return callback(new Error("CORS policy: access denied"));
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public folder
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

// ✅ YANGI: CORS preflight so'rovlari uchun
app.options("*", cors(corsOptions));

// ✅ YANGI: Error handling middleware
app.use((error, req, res, next) => {
  if (error.message === "CORS policy: access denied") {
    return res.status(403).json({
      ok: false,
      error_message: "CORS: Access denied"
    });
  }
  next(error);
});

// Start server
app.listen(port, () => {
  console.log(`✅ THE SERVER STARTED ON PORT ${port}`);
});