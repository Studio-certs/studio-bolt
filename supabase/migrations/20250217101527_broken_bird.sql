-- First, ensure the news_articles table has the correct foreign key relationship
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