import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

const PaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/payments/create-intent', { bookingId });

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: 'Customer Name',
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        if (onError) onError(stripeError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await api.post('/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          bookingId
        });
        
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed';
      setError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Complete Payment</h3>
      <p className="mb-4 text-gray-600">Amount: ${amount}</p>
      
      <div className="mb-4 p-3 border rounded">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
            },
          }}
        />
      </div>
      
      {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
};

export default PaymentForm;