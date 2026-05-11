const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');              // ✅ lowercase "models"

const {
  register,
  login,
  getMe,
  approveHotelAdmin,
  getPendingHotelAdmins,
  getAllUsers,
  updateUser,           // ✅ Moved here (was imported twice)
  deleteUser,           // ✅ Moved here
  registerHotelAdmin    // ✅ Moved here
} = require('../controllers/authController');       // ✅ already lowercase

const { protect, authorize } = require('../middleware/auth');  // ✅ already lowercase

// ================= MULTER SETUP FOR AVATAR =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/avatars')) {
  fs.mkdirSync('uploads/avatars', { recursive: true });
}

// ================= PUBLIC ROUTES =================
router.post('/register', register);
router.post('/login', login);

// ================= PRIVATE ROUTES (Any authenticated user) =================
router.get('/me', protect, getMe);

// UPDATE PROFILE (name & phone)
router.put('/me', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE AVATAR
router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({
      success: true,
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ================= SYSTEM ADMIN ONLY ROUTES =================
router.get('/pending-hotel-admins', protect, authorize('system_admin'), getPendingHotelAdmins);
router.put('/approve-hotel-admin/:id', protect, authorize('system_admin'), approveHotelAdmin);
router.get('/all-users', protect, authorize('system_admin'), getAllUsers);

// ✅ Removed duplicate require - now using destructured imports above
router.put('/users/:id', protect, authorize('system_admin'), updateUser);
router.delete('/users/:id', protect, authorize('system_admin'), deleteUser);

// ✅ Removed duplicate require - now using destructured imports above
router.post('/register-hotel-admin', protect, authorize('system_admin'), registerHotelAdmin);

// CHANGE PASSWORD
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ================= TEST EMAIL ROUTE (TEMPORARY) =================
router.get('/test-email', async (req, res) => {
  try {
    const sendEmail = require('../utils/sendEmail');
    await sendEmail({
      to: 'techlass2025@gmail.com',
      subject: 'Railway Email Test',
      html: '<h1>Email is working from Railway!</h1>'
    });
    res.json({ success: true, message: 'Email sent!' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;

module.exports = router;