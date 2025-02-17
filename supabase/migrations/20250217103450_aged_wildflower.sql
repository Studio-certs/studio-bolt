-- First, ensure we have the correct foreign key relationship
ALTER TABLE news_articles
DROP CONSTRAINT IF EXISTS news_articles_author_id_fkey;

ALTER TABLE news_articles
ADD CONSTRAINT news_articles_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "news_select" ON news_articles;
DROP POLICY IF EXISTS "news_insert" ON news_articles;
DROP POLICY IF EXISTS "news_update" ON news_articles;
DROP POLICY IF EXISTS "news_delete" ON news_articles;

-- Create new policies for news articles
CREATE POLICY "news_select" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "news_insert" ON news_articles
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "news_update" ON news_articles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "news_delete" ON news_articles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle news article creation
CREATE OR REPLACE FUNCTION handle_news_article_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the author_id to the current user
  NEW.author_id = auth.uid();
  -- Set timestamps
  NEW.created_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for news article creation
DROP TRIGGER IF EXISTS on_news_article_created ON news_articles;
CREATE TRIGGER on_news_article_created
  BEFORE INSERT ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_news_article_creation();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_author_id ON news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at);

-- Add helpful comments
COMMENT ON TRIGGER on_news_article_created ON news_articles IS 'Sets author_id and timestamps when creating news articles';
COMMENT ON POLICY "news_select" ON news_articles IS 'Anyone can view news articles';
COMMENT ON POLICY "news_insert" ON news_articles IS 'Only admins can create news articles';
COMMENT ON POLICY "news_update" ON news_articles IS 'Only admins can update news articles';
COMMENT ON POLICY "news_delete" ON news_articles IS 'Only admins can delete news articles';