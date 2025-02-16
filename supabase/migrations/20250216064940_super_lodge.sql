-- Disable RLS temporarily
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

-- Create policies with guaranteed unique names
CREATE POLICY "profiles_read_20250216" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update_20250216" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "news_read_20250216" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "meetups_read_20250216" ON meetups
FOR SELECT USING (true);

CREATE POLICY "courses_read_20250216" ON courses
FOR SELECT USING (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with timestamped unique policy names';