const Booking = require('../Models/Booking');
const Room = require('../Models/Room');
const Hotel = require('../Models/Hotel');

// Helper: Format date to YYYY-MM-DD using UTC
const formatUTCDate = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d.getTime())) return null;

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

// ================= GET ALL BOOKINGS =================
exports.getBookings = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const bookings = await Booking.find(query)
      .populate('hotel', 'name location images owner')
      .populate('room', 'roomNumber type pricePerNight')
      .populate('user', 'name email phone avatar');

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= CREATE BOOKING =================
exports.createBooking = async (req, res) => {
  try {
    const { hotel, room, checkInDate, checkOutDate, guests, totalPrice } = req.body;

    if (!hotel || !room || !checkInDate || !checkOutDate || !guests || !totalPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const roomExists = await Room.findById(room);

    if (!roomExists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const booking = await Booking.create({
      user: req.user.id,
      hotel,
      room,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      status: 'confirmed'
    });

    await booking.populate('hotel room user');

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= UPDATE BOOKING =================
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('hotel')
      .populate('room')
      .populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({ success: true, data: booking });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= CANCEL BOOKING =================
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= DELETE BOOKING =================
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Users can only delete their own bookings
    // Hotel admins can delete bookings for their hotels
    // System admins can delete any booking
    const isOwner = booking.user.toString() === req.user.id;
    const isHotelOwner = req.user.role === 'hotel_admin' && booking.hotel?.owner?.toString() === req.user.id;
    const isAdmin = req.user.role === 'system_admin' || req.user.role === 'admin';

    if (!isOwner && !isHotelOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this booking' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Booking deleted'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= ROOM BOOKED DATES =================
exports.getRoomBookedDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ room: req.params.roomId });

    const dates = bookings
      .map(b => {
        const checkIn = formatUTCDate(b.checkInDate);
        const checkOut = formatUTCDate(b.checkOutDate);

        if (!checkIn || !checkOut) return null;

        return { checkIn, checkOut };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: dates
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= HOTEL BOOKED DATES =================
exports.getHotelBookedDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ hotel: req.params.hotelId })
      .populate('room', 'type roomNumber');

    const dates = bookings
      .map(b => {
        const checkIn = formatUTCDate(b.checkInDate);
        const checkOut = formatUTCDate(b.checkOutDate);

        if (!checkIn || !checkOut) return null;

        return { 
          checkIn, 
          checkOut,
          roomType: b.room?.type || 'Room',
          roomNumber: b.room?.roomNumber || ''
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: dates
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= GET MY HOTEL BOOKINGS (FIXED SAFELY) =================
exports.getMyHotelBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'hotel',
        select: 'name owner'
      })
      .populate('room');

    const filtered = bookings.filter(
      b => b.hotel && b.hotel.owner?.toString() === req.user.id
    );

    res.json({
      success: true,
      data: filtered
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};