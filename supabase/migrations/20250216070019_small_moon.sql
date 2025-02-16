-- First, temporarily disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "read_all" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "admin_all" ON profiles;
DROP POLICY IF EXISTS "read_all" ON news_articles;
DROP POLICY IF EXISTS "admin_all" ON news_articles;
DROP POLICY IF EXISTS "read_all" ON meetups;
DROP POLICY IF EXISTS "admin_all" ON meetups;
DROP POLICY IF EXISTS "read_all" ON courses;
DROP POLICY IF EXISTS "admin_all" ON courses;

-- Create new minimal policies with no recursion
-- Profiles
CREATE POLICY "profiles_read" ON profiles
FOR SELECT
USING (true);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- News Articles
CREATE POLICY "news_read" ON news_articles
FOR SELECT
USING (true);

-- Meetups
CREATE POLICY "meetups_read" ON meetups
FOR SELECT
USING (true);

-- Courses
CREATE POLICY "courses_read" ON courses
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