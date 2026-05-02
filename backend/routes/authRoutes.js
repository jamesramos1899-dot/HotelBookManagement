const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  approveHotelAdmin,
  getPendingHotelAdmins
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');

// PUBLIC
router.post('/register', register);
router.post('/login', login);

// PRIVATE
router.get('/me', protect, getMe);

// SYSTEM ADMIN ONLY
router.get('/pending-hotel-admins', protect, authorize('system_admin'), getPendingHotelAdmins);
router.put('/approve-hotel-admin/:id', protect, authorize('system_admin'), approveHotelAdmin);

module.exports = router;