const express = require("express");
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
  getMyHotelReviews,
} = require("../controllers/hotelController"); // ✅ already lowercase
const { protect, authorize } = require("../middleware/auth"); // ✅ already lowercase

// ================= PUBLIC ROUTES =================
router.get("/", getHotels);
router.get("/:id", getHotel);

// ================= PROTECTED USER ROUTES =================
router.get("/favorites/my", protect, getMyFavorites);
router.post("/:id/favorite", protect, toggleFavorite);
router.post("/:id/reviews", protect, addReview);
router.get("/my-hotel-reviews", protect, getMyHotelReviews);

// ================= ADMIN ROUTES (System Admin or Hotel Admin) =================
router
  .route("/")
  .post(
    protect,
    authorize("system_admin", "hotel_admin", "admin"),
    createHotel,
  );

router
  .route("/:id")
  .put(protect, authorize("system_admin", "hotel_admin", "admin"), updateHotel)
  .delete(protect, authorize("system_admin", "admin"), deleteHotel);
// Delete a review
router.delete(
  "/:hotelId/reviews/:reviewId",
  protect,
  authorize("system_admin", "hotel_admin", "admin"),
  async (req, res) => {
    try {
      const Hotel = require("../models/Hotel");
      const hotel = await Hotel.findById(req.params.hotelId);
      if (!hotel)
        return res
          .status(404)
          .json({ success: false, error: "Hotel not found" });

      hotel.reviews = hotel.reviews.filter(
        (r) => r._id.toString() !== req.params.reviewId,
      );

      // Recalculate average rating
      if (hotel.reviews.length > 0) {
        hotel.averageRating =
          hotel.reviews.reduce((sum, r) => sum + r.rating, 0) /
          hotel.reviews.length;
      } else {
        hotel.averageRating = 0;
      }

      await hotel.save();
      res.json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

module.exports = router;
