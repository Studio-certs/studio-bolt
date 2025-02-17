-- First, ensure we have the correct foreign key relationship
ALTER TABLE news_articles
DROP CONSTRAINT IF EXISTS news_articles_author_id_fkey;

ALTER TABLE news_articles
ADD CONSTRAINT news_articles_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "news_read" ON news_articles;
DROP POLICY IF EXISTS "news_admin" ON news_articles;

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
CREATE OR REPLACE FUNCTION handle_news_article_creation(
  p_title TEXT,
  p_content TEXT,
  p_category TEXT,
  p_read_time INTEGER,
  p_thumbnail_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_id UUID;
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create news articles';
  END IF;

  -- Create article
  INSERT INTO news_articles (
    title,
    content,
    category,
    read_time,
    thumbnail_url,
    author_id,
    created_at,
    updated_at
  ) VALUES (
    p_title,
    p_content,
    p_category,
    p_read_time,
    p_thumbnail_url,
    auth.uid(),
    NOW(),
    NOW()
  ) RETURNING id INTO v_article_id;

  RETURN v_article_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_author_id ON news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at);

-- Add helpful comments
COMMENT ON FUNCTION handle_news_article_creation IS 'Creates a new news article with admin verification';
COMMENT ON POLICY "news_select" ON news_articles IS 'Anyone can view news articles';
COMMENT ON POLICY "news_insert" ON news_articles IS 'Only admins can create news articles';
COMMENT ON POLICY "news_update" ON news_articles IS 'Only admins can update news articles';
COMMENT ON POLICY "news_delete" ON news_articles IS 'Only admins can delete news articles';