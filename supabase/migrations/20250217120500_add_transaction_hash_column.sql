-- Add transaction_hash column to user_badges table
ALTER TABLE user_badges
ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_transaction_hash
ON user_badges(transaction_hash);

-- Add helpful comment
COMMENT ON COLUMN user_badges.transaction_hash IS 'The transaction hash of the minting transaction';
