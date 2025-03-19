-- Add token_type_id column to transactions table
ALTER TABLE transactions
ADD COLUMN token_type_id UUID REFERENCES token_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_token_type_id
ON transactions(token_type_id);

-- Update existing transactions to use Studio Coins token type
UPDATE transactions
SET token_type_id = (
  SELECT id FROM token_types WHERE name = 'Studio Coins'
)
WHERE token_type_id IS NULL;

-- Make token_type_id required for future entries
ALTER TABLE transactions
ALTER COLUMN token_type_id SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN transactions.token_type_id IS 'The type of token being transferred';
COMMENT ON CONSTRAINT transactions_token_type_id_fkey ON transactions IS 'Foreign key relationship between transactions and token types';