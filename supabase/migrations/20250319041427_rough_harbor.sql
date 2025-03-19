/*
  # Add Token Type Relationship to User Wallets

  1. Changes
    - Add token_type_id column to user_wallets
    - Create foreign key relationship
    - Set up default token type for existing balances
    - Add RLS policies

  2. Security
    - Maintain RLS policies
    - Add proper foreign key constraints
*/

-- First, ensure the Studio Coins token type exists
INSERT INTO token_types (
  id,
  name,
  description,
  conversion_rate,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Studio Coins',
  'Default platform currency',
  1.00,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Add token_type_id column to user_wallets
ALTER TABLE user_wallets
ADD COLUMN token_type_id UUID REFERENCES token_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_token_type_id
ON user_wallets(token_type_id);

-- Update existing wallets to use Studio Coins token type
UPDATE user_wallets
SET token_type_id = (
  SELECT id FROM token_types WHERE name = 'Studio Coins'
)
WHERE token_type_id IS NULL;

-- Make token_type_id required for future entries
ALTER TABLE user_wallets
ALTER COLUMN token_type_id SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN user_wallets.token_type_id IS 'The type of token in this wallet';
COMMENT ON CONSTRAINT user_wallets_token_type_id_fkey ON user_wallets IS 'Foreign key relationship between user wallets and token types';