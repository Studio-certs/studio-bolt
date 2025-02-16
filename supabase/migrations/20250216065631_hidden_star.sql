-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "allow_public_read" ON profiles;
DROP POLICY IF EXISTS "allow_self_update" ON profiles;
DROP POLICY IF EXISTS "allow_admin_all" ON profiles;
DROP POLICY IF EXISTS "allow_public_read" ON news_articles;
DROP POLICY IF EXISTS "allow_admin_all" ON news_articles;
DROP POLICY IF EXISTS "allow_public_read" ON meetups;
DROP POLICY IF EXISTS "allow_admin_all" ON meetups;
DROP POLICY IF EXISTS "allow_public_read" ON courses;
DROP POLICY IF EXISTS "allow_admin_all" ON courses;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_user_updated ON profiles;
DROP FUNCTION IF EXISTS handle_user_updates();

-- Create final, simplified policies
CREATE POLICY "select_all" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "update_own" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "select_all" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "select_all" ON meetups
FOR SELECT TO public
USING (true);

CREATE POLICY "select_all" ON courses
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