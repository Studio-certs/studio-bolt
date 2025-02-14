// @ts-nocheck
import { cors } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@12.17.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get and validate the request body
    const body = await req.json();
    const { session_id, user_id } = body;

    // Validate required parameters
    if (!session_id || !user_id) {
      throw new Error('Missing required parameters');
    }

    // Get Stripe key from environment variable
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51QpJiVIkKA0bpFEPXNcYVqMmtlTCbVXEQ0iVHdTwa1rCBS35HMjw8MNkktXt7EPEBSWciSnMXeB0bSksHuwmMgaB00ANewcZD9';
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify the payment was successful
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    // Verify the user_id matches
    if (session.metadata.user_id !== user_id) {
      throw new Error('Invalid user');
    }

    // Get the number of tokens from metadata
    const tokens = parseInt(session.metadata.tokens, 10);

    return new Response(
      JSON.stringify({ 
        success: true,
        tokens,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);

    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
          type: error.type || 'internal_error',
          code: error.statusCode || 500,
        }
      }),
      {
        status: error.statusCode || 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});