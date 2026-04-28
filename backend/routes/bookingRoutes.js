const express = require('express');
const router = express.Router();
const { getBookings, createBooking, updateBooking, cancelBooking, deleteBooking, getRoomBookedDates, getHotelBookedDates } = require('../Controllers/bookingController');
const { protect } = require('../Middleware/auth');
const { adminOnly } = require('../Middleware/admin');

router.get('/room/:roomId/dates', getRoomBookedDates);

router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router.route('/:id')
  .put(protect, adminOnly, updateBooking)
  .delete(protect, cancelBooking);

router.delete('/:id/delete', protect, deleteBooking);

router.get('/hotel/:hotelId/dates', getHotelBookedDates);

router.post('/check-availability', protect, async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;

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