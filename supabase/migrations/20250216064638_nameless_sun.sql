-- First, disable RLS on all tables to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "p1_profiles_select" ON profiles;
DROP POLICY IF EXISTS "p2_profiles_update" ON profiles;
DROP POLICY IF EXISTS "n1_news_select" ON news_articles;
DROP POLICY IF EXISTS "n2_news_admin" ON news_articles;
DROP POLICY IF EXISTS "m1_meetups_select" ON meetups;
DROP POLICY IF EXISTS "m2_meetups_admin" ON meetups;
DROP POLICY IF EXISTS "c1_courses_select" ON courses;
DROP POLICY IF EXISTS "c2_courses_admin" ON courses;

-- Create new ultra-simplified policies
CREATE POLICY "select_profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "update_profiles" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "select_news" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "manage_news" ON news_articles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_meetups" ON meetups
FOR SELECT USING (true);

CREATE POLICY "manage_meetups" ON meetups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_courses" ON courses
FOR SELECT USING (true);

CREATE POLICY "manage_courses" ON courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with ultra-simplified RLS policies';
COMMENT ON TABLE news_articles IS 'News articles with public read access and admin-only write access';
COMMENT ON TABLE meetups IS 'Meetups with public read access and admin-only write access';
COMMENT ON TABLE courses IS 'Courses with public read access and admin-only write access';