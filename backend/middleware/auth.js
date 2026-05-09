const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

// ✅ ROLE AUTHORIZATION - Updated for 3 roles: user, hotel_admin, system_admin
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied for role: ${req.user.role}. Required: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// ✅ SYSTEM ADMIN ONLY
const systemAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'system_admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as system admin' });
  }
};

// ✅ HOTEL ADMIN ONLY
const hotelAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'hotel_admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as hotel admin' });
  }
};

// ✅ ADMIN ONLY (system_admin OR hotel_admin)
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'system_admin' || req.user.role === 'hotel_admin' )) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Not authorized as admin' });
  }
};

module.exports = { protect, authorize, systemAdminOnly, hotelAdminOnly, adminOnly };