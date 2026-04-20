const Booking = require('../Models/Booking');
const Room = require('../Models/Room');

// @desc    Get all bookings (Admin: all, User: own)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }
    
    const bookings = await Booking.find(query)
      .populate('hotel', 'name location images')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone avatar'); // ADDED: phone and avatar
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const hotel = req.body.hotel || req.body.hotelId;
    const room = req.body.room || req.body.roomId;
    const checkInDate = req.body.checkInDate || req.body.checkIn;
    const checkOutDate = req.body.checkOutDate || req.body.checkOut;
    const guests = req.body.guests;
    const totalPrice = req.body.totalPrice;
    
    if (!hotel || !room || !checkInDate || !checkOutDate || !guests || !totalPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide all required fields: hotel, room, checkIn, checkOut, guests, totalPrice' 
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({ success: false, error: 'Check-in date cannot be in the past' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, error: 'Check-out date must be after check-in date' });
    }

    const roomExists = await Room.findById(room);
    if (!roomExists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (roomExists.capacity < guests) {
      return res.status(400).json({ 
        success: false, 
        error: `Room capacity (${roomExists.capacity}) is less than requested guests (${guests})` 
      });
    }

    // PER DAY: Only check check-in and check-out days, not nights in between
    const conflictingBooking = await Booking.findOne({
      room: room,
      status: { $nin: ['cancelled'] },
      $or: [
        { checkInDate: { $eq: checkIn } },
        { checkOutDate: { $eq: checkOut } },
        { checkInDate: { $eq: checkOut } },
        { checkOutDate: { $eq: checkIn } }
      ]
    });
    
    if (conflictingBooking) {
      const conflictCheckIn = new Date(conflictingBooking.checkInDate).toLocaleDateString('en-GB');
      const conflictCheckOut = new Date(conflictingBooking.checkOutDate).toLocaleDateString('en-GB');
      
      return res.status(409).json({ 
        success: false, 
        error: `This room is occupied on your selected dates. Existing booking: ${conflictCheckIn} to ${conflictCheckOut}. Please select different dates.` 
      });
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const expectedTotal = roomExists.pricePerNight * nights;
    
    if (Math.abs(expectedTotal - totalPrice) > 1) {
      return res.status(400).json({ 
        success: false, 
        error: `Price mismatch. Expected: $${expectedTotal}, Received: $${totalPrice}` 
      });
    }
    
    const booking = await Booking.create({
      user: req.user.id,
      hotel,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests,
      totalPrice: expectedTotal,
      status: 'confirmed'
    });
    
    // Populate with user phone for response
    await booking.populate('hotel room user');
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update booking status (Admin only)
// @route   PUT /api/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('hotel', 'name location images')
    .populate('room', 'roomNumber type pricePerNight')
    .populate('user', 'name email phone avatar'); // ADDED: populate user fields
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Cancel booking (User: own, Admin: any)
// @route   DELETE /api/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true })
      .populate('hotel', 'name location images')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone avatar'); // ADDED: populate user fields
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete booking permanently
// @route   DELETE /api/bookings/:id/delete
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (booking.status !== 'cancelled') {
      return res.status(400).json({ success: false, error: 'Only cancelled bookings can be deleted' });
    }
    
    await Booking.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get booked dates for a specific room (PER DAY - check-in and check-out days only)
// @route   GET /api/bookings/room/:roomId/dates
// @access  Public
exports.getRoomBookedDates = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { year, month } = req.query;
    
    if (!year || month === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide year and month parameters' 
      });
    }

    const startOfMonth = new Date(parseInt(year), parseInt(month), 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59);
    
    const bookings = await Booking.find({
      room: roomId,
      status: { $nin: ['cancelled'] },
      $or: [
        { checkInDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { checkOutDate: { $gte: startOfMonth, $lte: endOfMonth } }
      ]
    });

    const occupiedDates = [];
    
    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      
      if (checkIn.getMonth() === parseInt(month) && checkIn.getFullYear() === parseInt(year)) {
        const checkInStr = checkIn.toISOString().split('T')[0];
        if (!occupiedDates.includes(checkInStr)) {
          occupiedDates.push(checkInStr);
        }
      }
      
      if (checkOut.getMonth() === parseInt(month) && checkOut.getFullYear() === parseInt(year)) {
        const checkOutStr = checkOut.toISOString().split('T')[0];
        if (!occupiedDates.includes(checkOutStr)) {
          occupiedDates.push(checkOutStr);
        }
      }
    });

    res.json({
      success: true,
      count: occupiedDates.length,
      data: occupiedDates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};