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

// __dirname fix (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ✅ CORS sozlamalari
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://tmanagment.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // ✅ Development paytida Postman yoki origin bo‘lmasa ham ruxsat
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked for:", origin);
      callback(new Error("CORS policy: access denied"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
  ],
};

// ✅ CORS va OPTIONS handler
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Express 5 uchun to‘g‘ri format

// Cookie va JSON
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Public folder
const publicPath = path.join(__dirname, "..", "public");
app.use(
  "/public",
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://tmanagment.vercel.app",
    ],
    credentials: true,
  }),
  express.static(publicPath)
);

// Passport
app.use(passport.initialize());

// Body validation
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).send({
        ok: false,
        error_message: "Request body is missing or invalid",
      });
    }
  }
  next();
});

// DB
createTables();

// API routes
app.use("/api/v1", route);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error_message: "Endpoint topilmadi",
  });
});

// Xatolarni tutish
app.use((error, req, res, next) => {
  console.error("❌ Server xatosi:", error.message);

  if (error.message === "CORS policy: access denied") {
    return res.status(403).json({
      ok: false,
      error_message: "CORS: Ruxsat berilmagan so'rov",
    });
  }

  res.status(500).json({
    ok: false,
    error_message: "Server ichki xatosi",
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ SERVER ${port}-PORTDA ISHGA TUSHDI`);
  console.log(`🌐 Ruxsat etilgan originlar: ${allowedOrigins.join(", ")}`);
});
