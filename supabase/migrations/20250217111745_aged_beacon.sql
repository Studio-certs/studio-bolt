-- First, ensure we have the correct table structure
ALTER TABLE profiles
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN blocked SET DEFAULT false,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create profiles for any existing users that don't have one
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  blocked,
  created_at,
  updated_at,
  headline,
  bio,
  location,
  website,
  linkedin_url,
  github_url,
  twitter_url,
  avatar_url
)
SELECT 
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data->>'full_name', ''),
  COALESCE(users.raw_user_meta_data->>'role', 'user')::user_role,
  COALESCE((users.raw_user_meta_data->>'blocked')::boolean, false),
  COALESCE(users.created_at, NOW()),
  NOW(),
  users.raw_user_meta_data->>'headline',
  users.raw_user_meta_data->>'bio',
  users.raw_user_meta_data->>'location',
  users.raw_user_meta_data->>'website',
  users.raw_user_meta_data->>'linkedin_url',
  users.raw_user_meta_data->>'github_url',
  users.raw_user_meta_data->>'twitter_url',
  users.raw_user_meta_data->>'avatar_url'
FROM auth.users
LEFT JOIN profiles ON users.id = profiles.id
WHERE profiles.id IS NULL;

-- Create wallets for any users that don't have one
INSERT INTO user_wallets (
  user_id,
  tokens,
  created_at,
  updated_at
)
SELECT 
  users.id,
  0,
  NOW(),
  NOW()
FROM auth.users
LEFT JOIN user_wallets ON users.id = user_wallets.user_id
WHERE user_wallets.user_id IS NULL;

-- Fix news_articles foreign key
ALTER TABLE news_articles
DROP CONSTRAINT IF EXISTS news_articles_author_id_fkey;

ALTER TABLE news_articles
ADD CONSTRAINT news_articles_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_author_id
ON news_articles(author_id);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles including restored data';
COMMENT ON CONSTRAINT news_articles_author_id_fkey ON news_articles IS 'Foreign key relationship between news articles and their authors';