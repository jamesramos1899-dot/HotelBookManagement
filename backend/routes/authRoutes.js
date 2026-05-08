const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../Models/User');

const {
  register,
  login,
  getMe,
  approveHotelAdmin,
  getPendingHotelAdmins,
  getAllUsers
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

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
const { updateUser, deleteUser } = require('../controllers/authController');
router.put('/users/:id', protect, authorize('system_admin'), updateUser);
router.delete('/users/:id', protect, authorize('system_admin'), deleteUser);
const { registerHotelAdmin } = require('../controllers/authController');
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



module.exports = router;