-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies and functions
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "news_read" ON news_articles;
DROP POLICY IF EXISTS "news_write" ON news_articles;
DROP POLICY IF EXISTS "meetups_read" ON meetups;
DROP POLICY IF EXISTS "meetups_write" ON meetups;
DROP POLICY IF EXISTS "courses_read" ON courses;
DROP POLICY IF EXISTS "courses_write" ON courses;

DROP FUNCTION IF EXISTS auth.sync_user_role();
DROP TRIGGER IF EXISTS sync_user_role ON profiles;

-- Create maximally simplified policies
CREATE POLICY "allow_read_all" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_update_own" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_read_all" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_read_all" ON meetups
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_read_all" ON courses
FOR SELECT TO public
USING (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with maximally simplified RLS policies';
COMMENT ON TABLE news_articles IS 'News articles with public read access';
COMMENT ON TABLE meetups IS 'Meetups with public read access';
COMMENT ON TABLE courses IS 'Courses with public read access';