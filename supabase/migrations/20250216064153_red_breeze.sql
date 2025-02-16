-- First, disable RLS on all tables to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "allow_public_select" ON profiles;
DROP POLICY IF EXISTS "allow_self_update" ON profiles;
DROP POLICY IF EXISTS "allow_public_news_select" ON news_articles;
DROP POLICY IF EXISTS "allow_admin_news_all" ON news_articles;
DROP POLICY IF EXISTS "allow_public_meetups_select" ON meetups;
DROP POLICY IF EXISTS "allow_admin_meetups_all" ON meetups;
DROP POLICY IF EXISTS "allow_public_courses_select" ON courses;
DROP POLICY IF EXISTS "allow_admin_courses_all" ON courses;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_user_data ON profiles;
DROP FUNCTION IF EXISTS auth.sync_user_data();

-- Create new ultra-simplified policies
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "news_select_policy" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "news_all_policy" ON news_articles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "meetups_select_policy" ON meetups
FOR SELECT TO public
USING (true);

CREATE POLICY "meetups_all_policy" ON meetups
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "courses_select_policy" ON courses
FOR SELECT TO public
USING (true);

CREATE POLICY "courses_all_policy" ON courses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create a simple function to handle user data updates
CREATE OR REPLACE FUNCTION handle_user_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if role or blocked status has changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.blocked IS DISTINCT FROM NEW.blocked) THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
      'role', NEW.role,
      'blocked', COALESCE(NEW.blocked, false)
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a single trigger for user updates
CREATE TRIGGER on_user_updated
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_updates();

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with simplified RLS policies';
COMMENT ON FUNCTION handle_user_updates() IS 'Updates user metadata when role or blocked status changes';