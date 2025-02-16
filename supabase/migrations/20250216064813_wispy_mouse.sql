-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "read_all" ON profiles;
DROP POLICY IF EXISTS "write_own" ON profiles;
DROP POLICY IF EXISTS "read_all" ON news_articles;
DROP POLICY IF EXISTS "admin_only" ON news_articles;
DROP POLICY IF EXISTS "read_all" ON meetups;
DROP POLICY IF EXISTS "admin_only" ON meetups;
DROP POLICY IF EXISTS "read_all" ON courses;
DROP POLICY IF EXISTS "admin_only" ON courses;

-- Create the absolute minimum required policies
CREATE POLICY "public_read" ON profiles
FOR SELECT USING (true);

CREATE POLICY "auth_update" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "public_read" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "public_read" ON meetups
FOR SELECT USING (true);

CREATE POLICY "public_read" ON courses
FOR SELECT USING (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with absolute minimum RLS policies';