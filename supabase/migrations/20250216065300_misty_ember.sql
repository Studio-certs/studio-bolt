-- First, disable RLS temporarily to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure no conflicts
DROP POLICY IF EXISTS "read_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "read_news" ON news_articles;
DROP POLICY IF EXISTS "admin_manage_news" ON news_articles;
DROP POLICY IF EXISTS "read_meetups" ON meetups;
DROP POLICY IF EXISTS "admin_manage_meetups" ON meetups;
DROP POLICY IF EXISTS "read_courses" ON courses;
DROP POLICY IF EXISTS "admin_manage_courses" ON courses;

-- Create new policies with unique names
CREATE POLICY "profiles_select_20250216" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update_20250216" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "news_select_20250216" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "news_admin_20250216" ON news_articles
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

CREATE POLICY "meetups_select_20250216" ON meetups
FOR SELECT USING (true);

CREATE POLICY "meetups_admin_20250216" ON meetups
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

CREATE POLICY "courses_select_20250216" ON courses
FOR SELECT USING (true);

CREATE POLICY "courses_admin_20250216" ON courses
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with timestamped unique policy names';