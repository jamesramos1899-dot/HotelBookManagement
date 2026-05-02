const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // ✅ UPDATED ROLES
  role: {
    type: String,
    enum: ['user', 'hotel_admin', 'system_admin'],
    default: 'user'
  },

  // ✅ NEW: approval status (for hotel admins)
  isApproved: {
    type: Boolean,
    default: function () {
      return this.role !== 'hotel_admin'; // auto approve if not hotel admin
    }
  },

  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// HASH PASSWORD
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// MATCH PASSWORD
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);