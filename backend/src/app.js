import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = env.uploadDir
  ? (path.isAbsolute(env.uploadDir) ? env.uploadDir : path.resolve(process.cwd(), env.uploadDir))
  : path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (env.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(uploadDir));

app.use("/api", apiRouter);

const frontendDistDir = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistDir)) {
  const frontendEntryFile = fs.existsSync(path.join(frontendDistDir, "index.html"))
    ? path.join(frontendDistDir, "index.html")
    : path.join(frontendDistDir, "Index.html");
  app.use(express.static(frontendDistDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }
    res.sendFile(frontendEntryFile);
  });
}

app.use(notFound);
app.use(errorHandler);
