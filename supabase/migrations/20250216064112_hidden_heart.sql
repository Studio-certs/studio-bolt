-- First, drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "news_select" ON news_articles;
DROP POLICY IF EXISTS "news_admin" ON news_articles;
DROP POLICY IF EXISTS "meetups_select" ON meetups;
DROP POLICY IF EXISTS "meetups_admin" ON meetups;
DROP POLICY IF EXISTS "courses_select" ON courses;
DROP POLICY IF EXISTS "courses_admin" ON courses;

-- Disable RLS temporarily to avoid any issues during policy updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "allow_public_select" ON profiles
FOR SELECT USING (true);

CREATE POLICY "allow_self_update" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "allow_public_news_select" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "allow_admin_news_all" ON news_articles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "allow_public_meetups_select" ON meetups
FOR SELECT USING (true);

CREATE POLICY "allow_admin_meetups_all" ON meetups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "allow_public_courses_select" ON courses
FOR SELECT USING (true);

CREATE POLICY "allow_admin_courses_all" ON courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop any existing triggers that might cause recursion
DROP TRIGGER IF EXISTS sync_blocked_status ON profiles;
DROP TRIGGER IF EXISTS sync_user_role ON profiles;

-- Create a simpler function to sync user data
CREATE OR REPLACE FUNCTION auth.sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', NEW.role,
    'blocked', NEW.blocked
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for all profile updates
CREATE TRIGGER sync_user_data
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_user_data();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with simplified non-recursive RLS policies';
COMMENT ON FUNCTION auth.sync_user_data() IS 'Syncs user role and blocked status to JWT claims';