-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "read_all" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "read_all" ON news_articles;
DROP POLICY IF EXISTS "read_all" ON meetups;
DROP POLICY IF EXISTS "read_all" ON courses;

-- Create final, ultra-simplified policies with no recursion or dependencies
CREATE POLICY "read_all" ON profiles
FOR SELECT
USING (true);

CREATE POLICY "update_own" ON profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "read_all" ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "read_all" ON meetups
FOR SELECT
USING (true);

CREATE POLICY "read_all" ON courses
FOR SELECT
USING (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with ultra-simplified RLS policies';
COMMENT ON TABLE news_articles IS 'News articles with public read access';
COMMENT ON TABLE meetups IS 'Meetups with public read access';
COMMENT ON TABLE courses IS 'Courses with public read access';