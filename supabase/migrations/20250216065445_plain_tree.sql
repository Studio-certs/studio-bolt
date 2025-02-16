-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "news_select" ON news_articles;
DROP POLICY IF EXISTS "news_admin" ON news_articles;
DROP POLICY IF EXISTS "meetups_select" ON meetups;
DROP POLICY IF EXISTS "meetups_admin" ON meetups;
DROP POLICY IF EXISTS "courses_select" ON courses;
DROP POLICY IF EXISTS "courses_admin" ON courses;

-- Create new policies with unique timestamps
CREATE POLICY "profiles_select_20250216_070500" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update_20250216_070500" ON profiles
FOR UPDATE USING (
  CASE 
    WHEN auth.jwt()->>'role' = 'admin' THEN true
    ELSE auth.uid() = id AND NOT coalesce(blocked, false)
  END
);

CREATE POLICY "news_select_20250216_070500" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "news_admin_20250216_070500" ON news_articles
FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "meetups_select_20250216_070500" ON meetups
FOR SELECT USING (true);

CREATE POLICY "meetups_admin_20250216_070500" ON meetups
FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "courses_select_20250216_070500" ON courses
FOR SELECT USING (true);

CREATE POLICY "courses_admin_20250216_070500" ON courses
FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with timestamped unique policy names';