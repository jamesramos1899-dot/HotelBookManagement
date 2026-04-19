const Hotel = require('../Models/Hotel');
const User = require('../Models/User');

exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ isActive: true });
    res.json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('reviews.user', 'name');
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    await hotel.save();

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

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