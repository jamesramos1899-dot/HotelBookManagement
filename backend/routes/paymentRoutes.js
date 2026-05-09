const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // ✅ lowercase
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');  // ✅ lowercase

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

module.exports = router;