import React, { useState, useRef } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

const PaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ CRITICAL: Use ref to guard against race conditions
  const isSubmitting = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    // ✅ Double protection: state + ref
    if (loading || isSubmitting.current) return;
    
    isSubmitting.current = true;
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
        
        // ✅ Call onSuccess BEFORE resetting loading state
        if (onSuccess) {
          await onSuccess();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed';
      setError(msg);
      if (onError) onError(msg);
    } finally {
      // ✅ Only reset if component is still mounted and onSuccess hasn't navigated away
      // Use a small delay or check if still mounted
      setTimeout(() => {
        isSubmitting.current = false;
        setLoading(false);
      }, 500);
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
        disabled={!stripe || loading || isSubmitting.current}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </form>
  );
};

export default PaymentForm;