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
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid request body');
    }

    const { amount, user_id } = body;

    // Validate required parameters
    if (!amount || !user_id) {
      throw new Error('Missing required parameters: amount and user_id are required');
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Validate user_id is a string
    if (typeof user_id !== 'string' || !user_id.trim()) {
      throw new Error('Invalid user_id');
    }

    // Get Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount) * 100, // Ensure amount is an integer (cents)
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: { 
        user_id,
        created_at: new Date().toISOString()
      },
    });

    // Return the client secret
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
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
    console.error('Error creating payment intent:', error);

    // Return a structured error response
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
          type: error.type || 'internal_error',
          code: error.code,
          param: error.param,
        }
      }),
      {
        status: error.status || 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});