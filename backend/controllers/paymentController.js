const stripe = require('../Config/stripe');
const Booking = require('../Models/Booking');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body; // From frontend: total price in pesos

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to centavos
      currency: 'php',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user._id.toString()
        // No bookingId yet - booking created after payment
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      user: req.user._id,  
      hotel: req.body.hotel,
      room: req.body.room,
      checkInDate: req.body.checkInDate,
      checkOutDate: req.body.checkOutDate,
      guests: req.body.guests,
      totalPrice: req.body.totalPrice,
      paymentStatus: 'paid',
      paymentId: req.body.paymentIntentId,
      status: 'confirmed'
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Only update if not already paid (prevents double updates)
      const updatedBooking = await Booking.findOneAndUpdate(
        { _id: bookingId, paymentStatus: { $ne: 'paid' } }, // Only if not already paid
        { paymentStatus: 'paid', paymentId: paymentIntentId, status: 'confirmed' },
        { new: true }
      );

      if (!updatedBooking) {
        return res.status(409).json({ message: 'Booking already processed' });
      }

      res.status(200).json({ message: 'Payment successful', booking: updatedBooking });
    } else {
      res.status(400).json({ message: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const paymentIntent = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await Booking.findOneAndUpdate(
        { _id: paymentIntent.metadata.bookingId },
        { paymentStatus: 'paid', status: 'confirmed', paymentId: paymentIntent.id }
      );
      break;
      
    case 'payment_intent.payment_failed':
      await Booking.findOneAndUpdate(
        { _id: paymentIntent.metadata.bookingId },
        { paymentStatus: 'failed', status: 'cancelled' }
      );
      break;
      
    case 'charge.refunded':
      await Booking.findOneAndUpdate(
        { paymentId: paymentIntent.id },
        { paymentStatus: 'refunded', status: 'cancelled' }
      );
      break;
  }

  res.json({ received: true });
};