import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';

// Initialize Stripe with better error handling
const stripePromise = (async () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key is not configured');
  }
  const stripe = await loadStripe(key);
  if (!stripe) {
    throw new Error('Failed to initialize Stripe');
  }
  return stripe;
})();

const tokenAmounts = [10, 50, 100, 150, 200, 250];

export default function BuyTokens() {
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(10); // Default amount
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientSecret = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Validate amount before making the request
        if (amount <= 0 || !Number.isInteger(amount)) {
          throw new Error('Invalid amount');
        }

        const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
          body: { 
            amount: amount * 100, // Convert to cents
            user_id: user.id 
          },
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error('Payment service is temporarily unavailable');
        }

        if (!data?.clientSecret) {
          throw new Error('Invalid response from payment service');
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Payment setup error:', err);
        setError(err.message || 'Failed to initialize payment. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [amount, user]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
    },
  };

  const options = {
    clientSecret,
    appearance,
    loader: 'auto' as const,
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please log in to purchase tokens</h2>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Top Up Your Wallet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Securely purchase tokens to unlock premium content and features
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center mb-4">
          <Wallet className="w-10 h-10 text-yellow-500 mr-2" />
          <p className="text-xl font-semibold">1 Token = 1 AUD</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Choose Token Amount</label>
          <div className="grid grid-cols-3 gap-3">
            {tokenAmounts.map(tokenAmount => (
              <button
                key={tokenAmount}
                onClick={() => setAmount(tokenAmount)}
                className={`group relative w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  amount === tokenAmount
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tokenAmount}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            You are purchasing <span className="font-semibold">{amount}</span> tokens for{' '}
            <span className="font-semibold">{amount} AUD</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : clientSecret ? (
          <div className="mt-4">
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm amount={amount} />
            </Elements>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const CheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile`,
          payment_method_data: {
            billing_details: {
              email: user.email,
            },
          },
        },
        redirect: 'if_required'
      });

      if (paymentError) {
        throw paymentError;
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          // Update user wallet
          const { data: walletData, error: walletError } = await supabase
            .from('user_wallets')
            .select('tokens')
            .eq('user_id', user.id)
            .maybeSingle();

          if (walletError) throw walletError;

          const currentTokens = walletData?.tokens || 0;
          const newTokens = currentTokens + amount;

          const { error: updateError } = await supabase
            .from('user_wallets')
            .upsert({ 
              user_id: user.id,
              tokens: newTokens
            });

          if (updateError) throw updateError;

          // Create transaction record
          const { error: transactionError } = await supabase
            .from('payment_transactions')
            .insert({
              user_id: user.id,
              amount: amount,
              status: 'success',
              stripe_checkout_id: paymentIntent.id
            });

          if (transactionError) {
            console.error('Error creating transaction record:', transactionError);
          }

          navigate('/profile');
        } catch (err: any) {
          console.error('Database error:', err);
          throw new Error('Payment successful but failed to update wallet. Please contact support.');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment processing');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="text-red-600 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <ShieldCheck className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
        </span>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};