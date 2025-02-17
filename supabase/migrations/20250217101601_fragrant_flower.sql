-- First, remove any orphaned news articles
DELETE FROM news_articles
WHERE author_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = news_articles.author_id
);

-- Drop and recreate the foreign key with proper constraints
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

-- Add helpful comment
COMMENT ON CONSTRAINT news_articles_author_id_fkey ON news_articles IS 'Foreign key relationship between news articles and their authors';