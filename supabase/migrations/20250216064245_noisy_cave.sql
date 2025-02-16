-- First, disable RLS on all tables to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "news_select_policy" ON news_articles;
DROP POLICY IF EXISTS "news_all_policy" ON news_articles;
DROP POLICY IF EXISTS "meetups_select_policy" ON meetups;
DROP POLICY IF EXISTS "meetups_all_policy" ON meetups;
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_all_policy" ON courses;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_user_updated ON profiles;
DROP FUNCTION IF EXISTS handle_user_updates();

-- Create new ultra-simplified policies
CREATE POLICY "select_all" ON profiles
FOR SELECT USING (true);

CREATE POLICY "update_own" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "select_all" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "admin_all" ON news_articles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_all" ON meetups
FOR SELECT USING (true);

CREATE POLICY "admin_all" ON meetups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_all" ON courses
FOR SELECT USING (true);

CREATE POLICY "admin_all" ON courses
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