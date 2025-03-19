-- Add token_type_id column to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN token_type_id UUID REFERENCES token_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_token_type_id
ON payment_transactions(token_type_id);

-- Update existing payment transactions to use Studio Coins token type
UPDATE payment_transactions
SET token_type_id = (
  SELECT id FROM token_types WHERE name = 'Studio Coins'
)
WHERE token_type_id IS NULL;

-- Make token_type_id required for future entries
ALTER TABLE payment_transactions
ALTER COLUMN token_type_id SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN payment_transactions.token_type_id IS 'The type of token being purchased';
COMMENT ON CONSTRAINT payment_transactions_token_type_id_fkey ON payment_transactions IS 'Foreign key relationship between payment transactions and token types';