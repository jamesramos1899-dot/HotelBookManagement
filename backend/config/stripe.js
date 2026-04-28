const stripe = require('stripe');
const dotenv = require('dotenv');


dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error('❌ STRIPE_SECRET_KEY is missing from .env');
  console.error('Current directory:', process.cwd());
  process.exit(1);
}

const stripeInstance = stripe(secretKey);

module.exports = stripeInstance;