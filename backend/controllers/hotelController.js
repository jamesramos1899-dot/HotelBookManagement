const Hotel = require('../Models/Hotel');
const Room = require('../Models/Room');
const User = require('../Models/User');

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true });
    
    // Get room counts AND max capacity for all hotels
    const hotelsWithDetails = await Promise.all(
      hotels.map(async (hotel) => {
        const rooms = await Room.find({ hotel: hotel._id });
        const roomCount = rooms.length;
        // Calculate max capacity from rooms (max of all room capacities)
        const maxCapacity = rooms.length > 0 ? Math.max(...rooms.map(r => r.capacity)) : 0;
        // Get unique room types
        const roomTypes = [...new Set(rooms.map(r => r.type))];
        
        const hotelObj = hotel.toObject();
        hotelObj.roomCount = roomCount;
        hotelObj.maxCapacity = maxCapacity;
        hotelObj.roomTypes = roomTypes.length > 0 ? roomTypes : ['Standard'];
        return hotelObj;
      })
    );
    
    res.json({
      success: true,
      count: hotelsWithDetails.length,
      data: hotelsWithDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('reviews.user', 'name avatar');
    
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    // Also get room count and max capacity
    const rooms = await Room.find({ hotel: hotel._id });
    const hotelObj = hotel.toObject();
    hotelObj.roomCount = rooms.length;
    hotelObj.maxCapacity = rooms.length > 0 ? Math.max(...rooms.map(r => r.capacity)) : 0;

    res.json({
      success: true,
      data: hotelObj
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private/Admin
exports.createHotel = async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    
    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    res.json({
      success: true,
      message: 'Hotel deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add review
// @route   POST /api/hotels/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ success: false, error: 'Please provide rating and comment' });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const alreadyReviewed = hotel.reviews.find(
      r => r.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, error: 'You already reviewed this hotel' });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    hotel.reviews.push(review);
    // Update average rating
    const totalRating = hotel.reviews.reduce((sum, r) => sum + r.rating, 0);
    hotel.averageRating = totalRating / hotel.reviews.length;
    hotel.reviewCount = hotel.reviews.length;
    
    await hotel.save();

    // Populate user data before returning
    await hotel.populate('reviews.user', 'name avatar');

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Toggle favorite
// @route   POST /api/hotels/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const hotelId = req.params.id;

    const isFavorite = user.favorites.includes(hotelId);

    if (isFavorite) {
      user.favorites = user.favorites.filter(id => id.toString() !== hotelId);
    } else {
      user.favorites.push(hotelId);
    }

    await user.save();

    res.json({
      success: true,
      isFavorite: !isFavorite,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user favorites
// @route   GET /api/hotels/favorites/my
// @access  Private
exports.getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    const favorites = user.favorites.filter(hotel => hotel.isActive);
    
    res.json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};