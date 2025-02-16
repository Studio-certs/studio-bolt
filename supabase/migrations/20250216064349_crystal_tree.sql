-- First, disable RLS on all tables to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "select_all" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "select_all" ON news_articles;
DROP POLICY IF EXISTS "admin_all" ON news_articles;
DROP POLICY IF EXISTS "select_all" ON meetups;
DROP POLICY IF EXISTS "admin_all" ON meetups;
DROP POLICY IF EXISTS "select_all" ON courses;
DROP POLICY IF EXISTS "admin_all" ON courses;

-- Create new ultra-simplified policies
CREATE POLICY "select_all" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "update_own" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "select_all" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "admin_all" ON news_articles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_all" ON meetups
FOR SELECT TO public
USING (true);

CREATE POLICY "admin_all" ON meetups
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "select_all" ON courses
FOR SELECT TO public
USING (true);

CREATE POLICY "admin_all" ON courses
FOR ALL TO authenticated
USING (
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