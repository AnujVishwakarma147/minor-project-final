
import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user profile
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      publicKey: req.user.publicKey,
    },
  });
});

export default router;
