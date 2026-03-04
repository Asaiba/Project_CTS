import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const allowedMime = new Set([
  "image/png",
  "image/x-png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const allowedExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeOk = allowedMime.has((file.mimetype || "").toLowerCase());
    const extOk = allowedExt.has(extension);
    if (!mimeOk && !extOk) {
      const error = new Error("Unsupported file type. Use PNG, JPG, JPEG, WEBP, AVIF, GIF, or SVG.");
      error.statusCode = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.use(requireAuth, requireRole("admin"));

uploadRouter.post("/image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "missing_file", message: "No file uploaded" });
  }

  const protocol = req.protocol;
  const host = req.get("host");
  const filePath = `/uploads/${req.file.filename}`;
  const url = `${protocol}://${host}${filePath}`;
  return res.status(201).json({
    url,
    path: filePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
});
