const express = require('express');
const router = express.Router();
const { 
  getHotels, 
  getHotel, 
  createHotel, 
  updateHotel, 
  deleteHotel,
  addReview,
  toggleFavorite,
  getMyFavorites,
  getMyHotelReviews
} = require('../controllers/hotelController');
const { protect } = require('../Middleware/auth');
const { adminOnly } = require('../Middleware/admin');

router.get('/favorites/my', protect, getMyFavorites);
router.post('/:id/favorite', protect, toggleFavorite);
router.post('/:id/reviews', protect, addReview);
router.get('/my-hotel-reviews', protect, getMyHotelReviews);

router.route('/')
  .get(getHotels)
  .post(protect, adminOnly, createHotel);

router.route('/:id')
  .get(getHotel)
  .put(protect, adminOnly, updateHotel)
  .delete(protect, adminOnly, deleteHotel);

module.exports = router;