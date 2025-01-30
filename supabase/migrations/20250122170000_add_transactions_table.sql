/*
      # Add transactions table

      1. Tables
        - transactions
          - Stores records of token additions to user wallets
      2. Security
        - RLS policies for transactions table
    */

    -- Create transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      tokens DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Admins can view all transactions"
    ON transactions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );

    CREATE POLICY "Only admins can create transactions"
    ON transactions FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
