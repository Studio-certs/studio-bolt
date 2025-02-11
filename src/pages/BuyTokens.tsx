import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').then(stripe => {
  if (!stripe) {
    console.error("Stripe failed to load. Check your publishable key.");
  }
  return stripe;
});

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
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Buy Tokens</h1>
      <p className="mb-4">1 Token = 1 AUD</p>

      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
        Amount (AUD)
      </label>
      <input
        type="number"
        id="amount"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value))}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />

      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}

const CheckoutForm = () => {
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

        // Fetch the payment intent to get the amount
        // const paymentIntent = await stripe.retrievePaymentIntent(elements._owner.paymentIntent.id);
        // const amount = paymentIntent.paymentIntent.amount / 100;
        const amount = 10;

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
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-4" disabled={!stripe || !elements}>
        Pay Now
      </button>
    </form>
  );
};
