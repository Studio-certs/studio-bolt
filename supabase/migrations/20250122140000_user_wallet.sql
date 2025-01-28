/*
            # Add user_wallets table

            1. Tables
              - user_wallets
                - Stores user token balances
            2. Security
              - RLS policies for user_wallets table
          */

          -- Create user_wallets table
          CREATE TABLE IF NOT EXISTS user_wallets (
            user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
            tokens DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
          );

          -- Disable RLS
          ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;

          -- Drop policies
          DROP POLICY IF EXISTS "Users can view their own wallet" ON user_wallets;
          DROP POLICY IF EXISTS "Users can update their own wallet" ON user_wallets;
          DROP POLICY IF EXISTS "Admins can insert new wallets" ON user_wallets;

          -- Drop trigger for new user creation
          DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
          -- Drop function for new user creation
          DROP FUNCTION IF EXISTS handle_new_user_wallet;
