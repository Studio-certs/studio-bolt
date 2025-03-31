/*
  # Add Unique Constraint to User Wallets

  1. Changes
    - Add unique constraint on user_id and token_type_id combination
    - Ensure no duplicate wallet entries exist
*/

-- First, remove any duplicate wallet entries keeping the one with highest tokens
DELETE FROM user_wallets a USING (
  SELECT user_id, token_type_id, MAX(created_at) as max_created
  FROM user_wallets
  GROUP BY user_id, token_type_id
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.token_type_id = b.token_type_id 
AND a.created_at < b.max_created;

-- Add unique constraint
ALTER TABLE user_wallets
ADD CONSTRAINT user_wallets_user_token_type_key 
UNIQUE (user_id, token_type_id);

-- Add helpful comment
COMMENT ON CONSTRAINT user_wallets_user_token_type_key ON user_wallets IS 'Ensures each user can only have one wallet per token type';