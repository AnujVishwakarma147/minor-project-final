import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const uploadDir = path.resolve("uploads");

// Create uploads directory automatically
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, `${randomUUID()}.enc`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },
});

export default upload;
