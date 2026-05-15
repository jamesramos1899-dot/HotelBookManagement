const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Chat = require('../models/Chat');
const Hotel = require('../models/Hotel');

// GET /chats — guest gets all their conversations
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ guest: req.user._id })
      .populate('hotel', 'name')
      .sort({ updatedAt: -1 });

    const data = chats.map(chat => ({
      hotelId: chat.hotel._id,
      hotelName: chat.hotel.name,
      lastMessage: chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].message
        : null
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /chats/hotel/all — hotel admin gets all guest conversations (MUST be before /:hotelId)
router.get('/hotel/all', protect, async (req, res) => {
  try {
    const hotels = await Hotel.find({
      $or: [{ owner: req.user._id }, { createdBy: req.user._id }]
    });

    const hotelIds = hotels.map(h => h._id);

    const chats = await Chat.find({
      $or: [
        { hotel: { $in: hotelIds } },
        { hotelAdmin: req.user._id }
      ]
    })
      .populate('guest', 'name email')
      .populate('hotel', 'name')
      .sort({ updatedAt: -1 });

    // Filter out chats where guest was deleted
    const validChats = chats.filter(chat => chat.guest);

    const data = validChats.map(chat => ({
      guestId: chat.guest._id,
      guestName: chat.guest.name,
      guestEmail: chat.guest.email,
      hotelName: chat.hotel?.name || 'Hotel',
      lastMessage: chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].message
        : null
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Hotel/all error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /chats/hotel/guest/:guestId — hotel admin gets messages from a specific guest
router.get('/hotel/guest/:guestId', protect, async (req, res) => {
  try {
    const hotels = await Hotel.find({
  $or: [{ owner: req.user._id }, { createdBy: req.user._id }]
});

console.log('Hotel admin ID:', req.user._id);
console.log('Found hotels:', hotels.length);

    const hotelIds = hotels.map(h => h._id);

    const chat = await Chat.findOne({
      hotel: { $in: hotelIds },
      guest: req.params.guestId
    }).populate('messages.sender', 'name');

    if (!chat) return res.json({ success: true, data: { messages: [] } });

    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /chats/hotel/guest/:guestId — hotel admin replies to a guest
router.post('/hotel/guest/:guestId', protect, async (req, res) => {
  try {
    const { message } = req.body;

    const hotels = await Hotel.find({
      $or: [{ owner: req.user._id }, { createdBy: req.user._id }]
    });

    const hotelIds = hotels.map(h => h._id);

    const chat = await Chat.findOne({
      hotel: { $in: hotelIds },
      guest: req.params.guestId
    });

    if (!chat) return res.status(404).json({ success: false, error: 'Conversation not found' });

    const newMessage = {
      sender: req.user._id,
      senderRole: 'hotel_admin',
      message,
      createdAt: new Date()
    };

    chat.messages.push(newMessage);
    await chat.save();

    res.json({ success: true, data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /chats/:hotelId — guest gets messages with a specific hotel
router.get('/:hotelId', protect, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      hotel: req.params.hotelId, 
      guest: req.user._id 
    }).populate('messages.sender', 'name role');

    if (!chat) {
      return res.json({ success: true, data: { messages: [] } });
    }

    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /chats/:hotelId — guest sends message to hotel
router.post('/:hotelId', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

    let chat = await Chat.findOne({ hotel: req.params.hotelId, guest: req.user._id });

    const newMessage = {
      sender: req.user._id,
      senderRole: 'user',
      message,
      createdAt: new Date()
    };

    if (!chat) {
      chat = await Chat.create({
        hotel: req.params.hotelId,
        guest: req.user._id,
        hotelAdmin: hotel.createdBy || hotel.owner,
        messages: [newMessage]
      });
    } else {
      chat.messages.push(newMessage);
      await chat.save();
    }

    res.json({ success: true, data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;