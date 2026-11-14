import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../controllers/fileController.js";

const router = express.Router();

// Upload encrypted file
router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadFile
);

export default router;
