const express = require('express');
const router = express.Router();
const { getBookings, createBooking, updateBooking, cancelBooking, deleteBooking, getRoomBookedDates } = require('../Controllers/bookingController');
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

module.exports = router;