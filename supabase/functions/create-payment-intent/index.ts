// @ts-nocheck
import { cors } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@12.17.0?target=deno';
import { supabaseClient } from '../_shared/supabaseClient.ts';

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

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Get and validate the request body
    const body = await req.json();
    const { amount, user_id } = body;

    // Validate required parameters
    if (!amount || !user_id) {
      throw new Error('Missing required parameters: amount and user_id are required');
    }

    // Verify the authenticated user matches the requested user_id
    if (user.id !== user_id) {
      throw new Error('Unauthorized: User ID mismatch');
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }

    // Get Stripe key from environment variable
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe key not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Tokens',
              description: `${amount} tokens for your account`,
            },
            unit_amount: 100, // $1 per token
          },
          quantity: amount,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/buy-tokens`,
      metadata: {
        user_id,
        tokens: amount.toString(),
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);

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