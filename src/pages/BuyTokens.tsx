import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').then(stripe => {
  if (!stripe) {
    console.error("Stripe failed to load. Check your publishable key.");
  }
  return stripe;
});

const tokenAmounts = [10, 50, 100, 150, 200, 250];

export default function BuyTokens() {
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(10); // Default amount
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch client secret from your Supabase function
    const fetchClientSecret = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: JSON.stringify({ amount: amount * 100, user_id: user.id }),
        });

        if (error) {
          console.error('Error invoking function:', error);
          return;
        }

        if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error('Client secret is missing in the response.');
        }
      } catch (error) {
        console.error('Error fetching client secret:', error);
      }
    };

    fetchClientSecret();
  }, [amount, user]);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Top Up Your Wallet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Securely purchase tokens to unlock premium content and features.
          </p>
        </div>
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
            You are purchasing <span className="font-semibold">{amount}</span> tokens for <span className="font-semibold">{amount} AUD</span>
          </p>
        </div>

        {clientSecret && (
          <div className="mt-4">
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm amount={amount} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      // Stripe.js hasn't loaded yet.
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile`,
      },
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      // After successful payment, update user tokens in Supabase
      try {
        const { data: walletData, error: walletError } = await supabase
          .from('user_wallets')
          .select('tokens')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletError) throw walletError;

        const userTokens = walletData?.tokens || 0;

        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({ tokens: userTokens + amount })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Create a new transaction record
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: user.id,
            amount: amount,
            status: 'success',
            stripe_checkout_id: elements._owner.paymentIntent.id,
            admin_id: authData?.user?.id
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
          alert('Error creating transaction');
        }

        navigate('/profile');
      } catch (err) {
        console.error('Error updating tokens:', err);
        alert('Error updating tokens');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={!stripe || !elements}>
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <ShieldCheck className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
        </span>
        Pay Now
      </button>
    </form>
  );
};
