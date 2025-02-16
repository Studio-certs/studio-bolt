-- First, temporarily disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "news_read" ON news_articles;
DROP POLICY IF EXISTS "meetups_read" ON meetups;
DROP POLICY IF EXISTS "courses_read" ON courses;

-- Create new minimal policies with unique names
-- Profiles
CREATE POLICY "profiles_read_070100" ON profiles
FOR SELECT
USING (true);

CREATE POLICY "profiles_update_070100" ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- News Articles
CREATE POLICY "news_read_070100" ON news_articles
FOR SELECT
USING (true);

-- Meetups
CREATE POLICY "meetups_read_070100" ON meetups
FOR SELECT
USING (true);

-- Courses
CREATE POLICY "courses_read_070100" ON courses
FOR SELECT
USING (true);

-- Re-enable RLS with the new minimal policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with minimal RLS policies';
COMMENT ON TABLE news_articles IS 'News articles with public read access';
COMMENT ON TABLE meetups IS 'Meetups with public read access';
COMMENT ON TABLE courses IS 'Courses with public read access';