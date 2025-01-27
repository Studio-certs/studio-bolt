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

      -- Enable RLS
      ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view their own wallet" ON user_wallets
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can update their own wallet" ON user_wallets
        FOR UPDATE USING (auth.uid() = user_id);

      -- Allow admins to insert new wallets
      CREATE POLICY "Admins can insert new wallets" ON user_wallets
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      -- Create function to handle user creation
      CREATE OR REPLACE FUNCTION handle_new_user_wallet()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO user_wallets (user_id)
        VALUES (new.id)
        ON CONFLICT (user_id) DO NOTHING;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create trigger for new user creation
      DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
      CREATE TRIGGER on_auth_user_created_wallet
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user_wallet();