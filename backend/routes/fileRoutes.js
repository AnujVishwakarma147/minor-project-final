import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadFile, listFiles, downloadFile, deleteFile, getFileMetadata } from "../controllers/fileController.js";

const router = express.Router();

// Upload encrypted file
router.get("/", protect, listFiles);
router.post(
  "/upload",
  protect,
  upload.single("file"),
  uploadFile
);
router.get("/:id/content", protect, downloadFile);
router.get("/:id/metadata", protect, getFileMetadata);
router.delete("/:id", protect, deleteFile);

export default router;
