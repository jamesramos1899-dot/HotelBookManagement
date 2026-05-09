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
} = require('../controllers/hotelController');  // ✅ already lowercase
const { protect, authorize } = require('../middleware/auth');  // ✅ already lowercase

// ================= PUBLIC ROUTES =================
router.get('/', getHotels);
router.get('/:id', getHotel);

// ================= PROTECTED USER ROUTES =================
router.get('/favorites/my', protect, getMyFavorites);
router.post('/:id/favorite', protect, toggleFavorite);
router.post('/:id/reviews', protect, addReview);
router.get('/my-hotel-reviews', protect, getMyHotelReviews);

// ================= ADMIN ROUTES (System Admin or Hotel Admin) =================
router.route('/')
  .post(protect, authorize('system_admin', 'hotel_admin', 'admin'), createHotel);

router.route('/:id')
  .put(protect, authorize('system_admin', 'hotel_admin', 'admin'), updateHotel)
  .delete(protect, authorize('system_admin', 'admin'), deleteHotel); // Only system_admin can delete

module.exports = router;