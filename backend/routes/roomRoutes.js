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

const { protect, authorize } = require('../Middleware/auth');

// ================= PUBLIC ROUTES =================
router.get('/', getRooms);

// IMPORTANT: must come before /:id
router.get('/hotel/:hotelId', getRoomsByHotel);

router.get('/:id', getRoom);

// ================= PROTECTED ADMIN ROUTES =================
router.post('/', protect, authorize('system_admin', 'hotel_admin', 'admin'), createRoom);
router.put('/:id', protect, authorize('system_admin', 'hotel_admin', 'admin'), updateRoom);
router.delete('/:id', protect, authorize('system_admin', 'hotel_admin', 'admin'), deleteRoom);

// ================= USER ROUTE =================
router.get('/my', protect, getMyRooms);

module.exports = router;