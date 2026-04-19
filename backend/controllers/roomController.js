const Room = require('../Models/Room');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('hotel', 'name location');
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hotel', 'name location');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get rooms by hotel ID with availability check
// @route   GET /api/rooms/hotel/:hotelId?checkIn=DATE&checkOut=DATE
// @access  Public
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    // Get all rooms for this hotel
    let rooms = await Room.find({ hotel: req.params.hotelId });
    
    // If dates provided, filter out unavailable rooms
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // Find all bookings that overlap with requested dates
      const Booking = require('../Models/Booking');
      const overlappingBookings = await Booking.find({
        room: { $in: rooms.map(r => r._id) },
        status: { $nin: ['cancelled'] },
        $or: [
          { checkInDate: { $gte: checkInDate, $lt: checkOutDate } },
          { checkOutDate: { $gt: checkInDate, $lte: checkOutDate } },
          { checkInDate: { $lte: checkInDate }, checkOutDate: { $gte: checkOutDate } }
        ]
      });
      
      // Get IDs of rooms that are already booked
      const bookedRoomIds = overlappingBookings.map(b => b.room.toString());
      
      // Filter rooms - only return available ones
      rooms = rooms.filter(room => !bookedRoomIds.includes(room._id.toString()));
    }
    
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};