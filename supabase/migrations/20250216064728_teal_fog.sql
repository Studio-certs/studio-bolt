-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "select_profiles" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "select_news" ON news_articles;
DROP POLICY IF EXISTS "manage_news" ON news_articles;
DROP POLICY IF EXISTS "select_meetups" ON meetups;
DROP POLICY IF EXISTS "manage_meetups" ON meetups;
DROP POLICY IF EXISTS "select_courses" ON courses;
DROP POLICY IF EXISTS "manage_courses" ON courses;

-- Create minimal policies with no dependencies
CREATE POLICY "read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "write_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "read_all" ON news_articles FOR SELECT USING (true);
CREATE POLICY "admin_only" ON news_articles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "read_all" ON meetups FOR SELECT USING (true);
CREATE POLICY "admin_only" ON meetups FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "read_all" ON courses FOR SELECT USING (true);
CREATE POLICY "admin_only" ON courses FOR ALL USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with minimal RLS policies';