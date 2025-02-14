import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, AlertCircle } from 'lucide-react';

const tokenAmounts = [10, 50, 100, 150, 200, 250];

export default function BuyTokens() {
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePurchase = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://ydvvokjdlqpgpasrnwtd.supabase.co/functions/v1/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount,
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('Invalid response from payment service');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Payment setup error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again later.');
    } finally {
      setLoading(false);
    }
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

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}