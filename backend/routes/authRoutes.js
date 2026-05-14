const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User"); // ✅ lowercase "models"

const {
  register,
  login,
  getMe,
  approveHotelAdmin,
  getPendingHotelAdmins,
  getAllUsers,
  updateUser, // ✅ Moved here (was imported twice)
  deleteUser, // ✅ Moved here
  registerHotelAdmin, // ✅ Moved here
} = require("../controllers/authController"); // ✅ already lowercase

const { protect, authorize } = require("../middleware/auth"); // ✅ already lowercase

// ================= MULTER SETUP FOR AVATAR =================
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ================= MULTER SETUP FOR VALID ID =================
const validIdStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/valid-ids/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "validid-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadValidId = multer({
  storage: validIdStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, or PDF files are allowed"), false);
    }
  },
});

// Create uploads directories if they don't exist
if (!fs.existsSync("uploads/avatars")) {
  fs.mkdirSync("uploads/avatars", { recursive: true });
}
if (!fs.existsSync("uploads/valid-ids")) {
  fs.mkdirSync("uploads/valid-ids", { recursive: true });
}

// ================= PUBLIC ROUTES =================
router.post("/register", uploadValidId.single("validId"), register);
router.post("/login", login);

// ================= PRIVATE ROUTES (Any authenticated user) =================
router.get("/me", protect, getMe);

// UPDATE PROFILE (name & phone)
router.put("/me", protect, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE AVATAR
router.put(
  "/me/avatar",
  protect,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Please upload an image" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: avatarUrl },
        { new: true },
      );

      res.json({
        success: true,
        data: { avatar: avatarUrl },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
);

// ================= SYSTEM ADMIN ONLY ROUTES =================
router.get(
  "/pending-hotel-admins",
  protect,
  authorize("system_admin"),
  getPendingHotelAdmins,
);
router.put(
  "/approve-hotel-admin/:id",
  protect,
  authorize("system_admin"),
  approveHotelAdmin,
);
router.get("/all-users", protect, authorize("system_admin"), getAllUsers);

// ✅ Removed duplicate require - now using destructured imports above
router.put("/users/:id", protect, authorize("system_admin"), updateUser);
router.delete("/users/:id", protect, authorize("system_admin"), deleteUser);

// ✅ Removed duplicate require - now using destructured imports above
router.post(
  "/register-hotel-admin",
  protect,
  authorize("system_admin"),
  registerHotelAdmin,
);

// CHANGE PASSWORD
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const crypto = require("crypto");
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "No account found with that email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const sendEmail = require("../utils/sendEmail");
    await sendEmail({
      to: user.email,
      subject: "Reset Your AI Stay Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #0f172a; color: #fff; border-radius: 12px;">
          <h2 style="color: #22d3ee;">AI Stay — Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: linear-gradient(to right, #06b6d4, #a855f7); color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// RESET PASSWORD
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired reset link" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ================= TEST EMAIL ROUTE (TEMPORARY) =================
router.get("/test-email", async (req, res) => {
  try {
    const sendEmail = require("../utils/sendEmail");
    await sendEmail({
      to: "techlass2025@gmail.com",
      subject: "Railway Email Test",
      html: "<h1>Email is working from Railway!</h1>",
    });
    res.json({ success: true, message: "Email sent!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
