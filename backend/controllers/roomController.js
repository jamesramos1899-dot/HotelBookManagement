const Room = require('../Models/Room');
const Hotel = require('../Models/Hotel');

// Helper function to update hotel room count AND max capacity
const updateHotelStats = async (hotelId) => {
  try {
    const rooms = await Room.find({ hotel: hotelId });
    const roomCount = rooms.length;
    // Calculate max capacity from rooms (max of all room capacities)
    const maxCapacity = rooms.length > 0 ? Math.max(...rooms.map(r => r.capacity)) : 0;
    
    await Hotel.findByIdAndUpdate(hotelId, { 
      roomCount: roomCount,
      maxCapacity: maxCapacity 
    });
  } catch (error) {
    console.error('Error updating hotel stats:', error);
  }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('hotel', 'name location images');
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
    
    // Update hotel room count AND max capacity
    await updateHotelStats(req.body.hotel);
    
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
    const oldRoom = await Room.findById(req.params.id);
    if (!oldRoom) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    const oldHotelId = oldRoom.hotel.toString();
    
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    // Update old hotel stats
    await updateHotelStats(oldHotelId);
    
    // If hotel changed, update new hotel stats too
    if (req.body.hotel && req.body.hotel !== oldHotelId) {
      await updateHotelStats(req.body.hotel);
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
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    const hotelId = room.hotel;
    await Room.findByIdAndDelete(req.params.id);
    
    // Update hotel room count AND max capacity
    await updateHotelStats(hotelId);
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyRooms = async (req, res) => {
  const rooms = await Room.find({ owner: req.user.id }); // or hotel.owner logic
  res.json({ success: true, data: rooms });
};