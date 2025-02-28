-- Add token_id column to user_badges table
ALTER TABLE user_badges
ADD COLUMN IF NOT EXISTS token_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_token_id
ON user_badges(token_id);

-- Add helpful comment
COMMENT ON COLUMN user_badges.token_id IS 'The token ID of the NFT badge';
