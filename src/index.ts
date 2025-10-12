import express from "express"
import cors from "cors"
import route from "./routes/index.route.js";
const app = express()
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: "http://localhost",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api/v1", route);

app.listen(port, () => {
    console.log(`✅ THE SERVER STARTED ON PORT ${port}`);
});
