const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');              // ✅ lowercase "config"

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');      // ✅ lowercase "routes"
const hotelRoutes = require('./routes/hotelRoutes');    // ✅ lowercase "routes"
const roomRoutes = require('./routes/roomRoutes');      // ✅ lowercase "routes"
const bookingRoutes = require('./routes/bookingRoutes'); // ✅ lowercase "routes"
const paymentRoutes = require('./routes/paymentRoutes'); // ✅ lowercase "routes"

const app = express();

// Body parser
app.use(express.json());

// Simple request logger (helps debug 405s in production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`REQ ${req.method} ${req.path}`);
    next();
  });
} else {
  // In production still log minimal info for critical paths
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) console.log(`REQ ${req.method} ${req.path}`);
    next();
  });
}

// Enable CORS - allow Railway frontend + local dev
const allowedOrigins = ['https://hotel-book-management.vercel.app'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

// If FRONTEND_URL is not set in production, allow all origins (convenience fallback).
// For stricter security set FRONTEND_URL in your deployment to the frontend origin.
if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
  console.warn('FRONTEND_URL not set and running in production — allowing all CORS origins as a fallback. Set FRONTEND_URL to restrict origins.');
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));
}

// Explicitly handle OPTIONS preflight for all routes — avoids 405 from some platforms
app.options('*', cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Health check (Railway uses this)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
} else {
  module.exports = app;
}