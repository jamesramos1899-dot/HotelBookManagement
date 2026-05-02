const express = require('express');
const router = express.Router();

const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomsByHotel,
  getMyRooms
} = require('../Controllers/roomController');

const { protect } = require('../Middleware/auth');
const { adminOnly } = require('../Middleware/admin');

// ================= PUBLIC ROUTES =================
router.get('/', getRooms);
router.get('/:id', getRoom);

// IMPORTANT: must come before /:id
router.get('/hotel/:hotelId', getRoomsByHotel);

// ================= PROTECTED ADMIN ROUTES =================
router.post('/', protect, adminOnly, createRoom);
router.put('/:id', protect, adminOnly, updateRoom);
router.delete('/:id', protect, adminOnly, deleteRoom);

// ================= USER ROUTE =================
router.get('/my', protect, getMyRooms);

module.exports = router;