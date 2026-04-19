const express = require('express');
const router = express.Router();
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom, getRoomsByHotel } = require('../Controllers/roomController');
const { protect } = require('../Middleware/auth');
const { adminOnly } = require('../Middleware/admin');

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoom);

// IMPORTANT: This must come BEFORE the /:id route to avoid conflict
router.get('/hotel/:hotelId', getRoomsByHotel);

// Protected admin routes
router.post('/', protect, adminOnly, createRoom);
router.put('/:id', protect, adminOnly, updateRoom);
router.delete('/:id', protect, adminOnly, deleteRoom);

module.exports = router;