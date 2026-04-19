const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'suite', 'deluxe', 'family'],
    required: true
  },
  pricePerNight: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  description: String,
  amenities: [{
    type: String
  }],
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);