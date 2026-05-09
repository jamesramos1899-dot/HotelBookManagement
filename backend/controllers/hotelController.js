const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Room = require('../models/Room');

// ================= GET ALL HOTELS =================
exports.getHotels = async (req, res) => {
  try {
        const hotels = await Hotel.find({ isActive: true })
      .populate('reviews.user', 'name avatar')
      .populate('owner', 'name email');

    const data = await Promise.all(
      hotels.map(async (h) => {
        const rooms = await Room.find({ hotel: h._id });

        return {
          ...h.toObject(),
          roomCount: rooms.length,
          maxCapacity: rooms.length
            ? Math.max(...rooms.map(r => r.capacity))
            : 0
        };
      })
    );

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= GET SINGLE HOTEL =================
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('reviews.user', 'name avatar');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }

    res.json({ success: true, data: hotel });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= CREATE HOTEL =================
// ================= CREATE HOTEL =================
exports.createHotel = async (req, res) => {
  try {
    const hotel = await Hotel.create({
      ...req.body,
      owner: req.user.id,  // Link to hotel admin
      createdBy: req.user.id
    });

    // Update user with hotelId
    await User.findByIdAndUpdate(req.user.id, { hotelId: hotel._id });

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// ================= UPDATE HOTEL =================
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    if (hotel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not your hotel' });
    }

    const updated = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= DELETE HOTEL =================
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    await Hotel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Hotel deleted' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= ADD REVIEW =================
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found'
      });
    }

    const alreadyReviewed = hotel.reviews.find(
      r => r.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: 'You already reviewed this hotel'
      });
    }

    hotel.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    const total = hotel.reviews.reduce(
      (sum, r) => sum + r.rating,
      0
    );

    hotel.averageRating = total / hotel.reviews.length;
    hotel.reviewCount = hotel.reviews.length;

    await hotel.save();

    await hotel.populate('reviews.user', 'name avatar');

    res.status(201).json({ success: true, data: hotel });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= TOGGLE FAVORITE =================
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hotelId = req.params.id;

    const exists = user.favorites.includes(hotelId);

    if (exists) {
      user.favorites = user.favorites.filter(
        id => id.toString() !== hotelId
      );
    } else {
      user.favorites.push(hotelId);
    }

    await user.save();

    res.json({
      success: true,
      isFavorite: !exists
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= GET MY FAVORITES =================
exports.getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites');

    res.json({
      success: true,
      data: user.favorites
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= GET MY HOTEL REVIEWS =================
exports.getMyHotelReviews = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.id });

    let reviews = [];

    for (const hotel of hotels) {
      const fullHotel = await Hotel.findById(hotel._id)
        .populate('reviews.user', 'name avatar');

      if (fullHotel?.reviews) {
        reviews = reviews.concat(fullHotel.reviews);
      }
    }

    res.json({ success: true, data: reviews });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};