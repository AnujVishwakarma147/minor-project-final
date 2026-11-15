import File from "../models/File.js";
import fs from "fs/promises";
import { removeEncryptedFile, sendEncryptedFile, storeEncryptedFile } from "../config/storage.js";

// Upload encrypted file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { encryptedName, encryptedMime, iv, encryptedFileKey } = req.body;

    // Validate encryption metadata
    if (!encryptedName || !encryptedMime || !iv || !encryptedFileKey) {
      await fs.unlink(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Required encryption metadata is missing",
      });
    }

    await storeEncryptedFile(req.user._id.toString(), req.file.filename, req.file.path);

    // Save file metadata in MongoDB
    const file = await File.create({
      owner: req.user._id,
      // Filename and MIME type stay encrypted too; the server only sees ciphertext.
      originalName: encryptedName,
      storedName: req.file.filename,
      mimeType: encryptedMime,
      size: req.file.size,
      iv,
      encryptedFileKey,
    });

    return res.status(201).json({
      success: true,
      message: "Encrypted file uploaded successfully",
      file: {
        id: file._id,
        encryptedName: file.originalName,
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

export const listFiles = async (req, res) => {
  const files = await File.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, files: files.map(({ _id, originalName, size, createdAt }) => ({
    id: _id, encryptedName: originalName, size, createdAt,
  })) });
};

export const downloadFile = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: "File not found" });
  await sendEncryptedFile(req.user._id.toString(), file.storedName, res);
};

export const getFileMetadata = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, owner: req.user._id }).select("encryptedFileKey mimeType");
  if (!file) return res.status(404).json({ success: false, message: "File not found" });
  res.set("Cache-Control", "no-store");
  res.json({ success: true, file: { encryptedFileKey: file.encryptedFileKey, encryptedMime: file.mimeType } });
};

export const deleteFile = async (req, res) => {
  const file = await File.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: "File not found" });
  await removeEncryptedFile(req.user._id.toString(), file.storedName);
  res.json({ success: true, message: "Encrypted file deleted" });
};
