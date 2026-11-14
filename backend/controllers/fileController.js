import File from "../models/File.js";
import fs from "fs/promises";

// Upload encrypted file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { originalName, iv, encryptedFileKey, mimeType } = req.body;

    // Validate encryption metadata
    if (!originalName || !iv || !encryptedFileKey) {
      await fs.unlink(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Required encryption metadata is missing",
      });
    }

    // Save file metadata in MongoDB
    const file = await File.create({
      owner: req.user._id,
      originalName: originalName,
      storedName: req.file.filename,
      mimeType: mimeType || "application/octet-stream",
      size: req.file.size,
      iv,
      encryptedFileKey,
    });

    return res.status(201).json({
      success: true,
      message: "Encrypted file uploaded successfully",
      file: {
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error("File Upload Error:", error);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "File upload failed",
    });
  }
};
