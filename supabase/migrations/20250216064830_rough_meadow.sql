-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "public_read" ON profiles;
DROP POLICY IF EXISTS "auth_update" ON profiles;
DROP POLICY IF EXISTS "public_read" ON news_articles;
DROP POLICY IF EXISTS "public_read" ON meetups;
DROP POLICY IF EXISTS "public_read" ON courses;

-- Create the absolute minimum required policies without any joins or subqueries
CREATE POLICY "read_profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "update_profiles" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "read_news" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "read_meetups" ON meetups
FOR SELECT USING (true);

CREATE POLICY "read_courses" ON courses
FOR SELECT USING (true);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with absolute minimum RLS policies';