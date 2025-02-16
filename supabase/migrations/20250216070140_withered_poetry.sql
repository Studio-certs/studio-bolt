-- First, temporarily disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "profiles_read_070100" ON profiles;
DROP POLICY IF EXISTS "profiles_update_070100" ON profiles;
DROP POLICY IF EXISTS "news_read_070100" ON news_articles;
DROP POLICY IF EXISTS "meetups_read_070100" ON meetups;
DROP POLICY IF EXISTS "courses_read_070100" ON courses;

-- Create new minimal policies with no recursion
-- Profiles
CREATE POLICY "profiles_read_070200" ON profiles
FOR SELECT
USING (true);

CREATE POLICY "profiles_update_070200" ON profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "profiles_admin_070200" ON profiles
FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- News Articles
CREATE POLICY "news_read_070200" ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "news_admin_070200" ON news_articles
FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Meetups
CREATE POLICY "meetups_read_070200" ON meetups
FOR SELECT
USING (true);

CREATE POLICY "meetups_admin_070200" ON meetups
FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Courses
CREATE POLICY "courses_read_070200" ON courses
FOR SELECT
USING (true);

CREATE POLICY "courses_admin_070200" ON courses
FOR ALL
USING (auth.jwt()->>'role' = 'admin');

-- Create function to sync role to JWT claims
CREATE OR REPLACE FUNCTION auth.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role sync
DROP TRIGGER IF EXISTS sync_user_role ON profiles;
CREATE TRIGGER sync_user_role
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_user_role();

-- Re-enable RLS with the new minimal policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with minimal RLS policies';
COMMENT ON TABLE news_articles IS 'News articles with public read access';
COMMENT ON TABLE meetups IS 'Meetups with public read access';
COMMENT ON TABLE courses IS 'Courses with public read access';