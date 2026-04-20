const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/me/avatar', protect, updateAvatar);

module.exports = router;