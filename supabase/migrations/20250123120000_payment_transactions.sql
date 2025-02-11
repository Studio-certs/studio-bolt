-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_time TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL,
  stripe_checkout_id TEXT
);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment transactions"
ON payment_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
ON payment_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
