const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { createPaymentIntent, confirmPayment } = require('../Controllers/paymentController');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

module.exports = router;