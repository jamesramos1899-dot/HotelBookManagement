const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
  },

  // ✅ UPDATED ROLES: user (guest/customer), hotel_admin, system_admin
  role: {
    type: String,
    enum: ["user", "hotel_admin", "system_admin"],
    default: "user",
  },

  // ✅ NEW: approval status (for hotel admins)
  isApproved: {
    type: Boolean,
    default: false,
  },

  address: {
    type: String,
    default: "",
  },

  // ✅ NEW: hotel partner application fields
  hotelName: {
    type: String,
    default: "",
  },
  propertyLocation: {
    type: String,
    default: "",
  },
  businessLicense: {
    type: String,
    default: "",
  },
  taxInformation: {
    type: String,
    default: "",
  },
  numberOfUnits: {
    type: String,
    default: "",
  },
  validId: {
    type: String,
    default: "",
  },

  // ✅ NEW: hotel association for hotel admins
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    default: null,
  },

  phone: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },
  ],

  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// HASH PASSWORD
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// MATCH PASSWORD
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
