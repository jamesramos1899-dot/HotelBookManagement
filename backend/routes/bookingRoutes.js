const express = require('express');
const router = express.Router();
const { getBookings, createBooking, updateBooking, cancelBooking, deleteBooking, getRoomBookedDates, getHotelBookedDates, getMyHotelBookings } = require('../controllers/bookingController');  // ✅ lowercase
const { protect, authorize } = require('../middleware/auth');  // ✅ lowercase

// ================= PUBLIC ROUTES =================
router.get('/room/:roomId/dates', getRoomBookedDates);
router.get('/hotel/:hotelId/dates', getHotelBookedDates);

// ================= PROTECTED ROUTES =================
router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .put(protect, authorize('system_admin', 'hotel_admin', 'admin'), updateBooking)
  .delete(protect, cancelBooking);

router.delete('/:id/delete', protect, deleteBooking);

// Hotel admin can see bookings for their hotels
router.get('/my-hotel', protect, authorize('hotel_admin', 'system_admin', 'admin'), getMyHotelBookings);

// Check availability
router.post('/check-availability', protect, async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const Booking = require('../models/Booking');  // ✅ lowercase

    const existingBooking = await Booking.findOne({
      room: room,
      status: { $ne: 'cancelled' },
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) }
        }
      ]
    });

    res.json({ available: !existingBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;