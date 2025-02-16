-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_select_20250216_070500" ON profiles;
DROP POLICY IF EXISTS "profiles_update_20250216_070500" ON profiles;
DROP POLICY IF EXISTS "news_select_20250216_070500" ON news_articles;
DROP POLICY IF EXISTS "news_admin_20250216_070500" ON news_articles;
DROP POLICY IF EXISTS "meetups_select_20250216_070500" ON meetups;
DROP POLICY IF EXISTS "meetups_admin_20250216_070500" ON meetups;
DROP POLICY IF EXISTS "courses_select_20250216_070500" ON courses;
DROP POLICY IF EXISTS "courses_admin_20250216_070500" ON courses;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_user_data ON profiles;
DROP FUNCTION IF EXISTS auth.sync_user_data();

-- Create final, simplified policies
CREATE POLICY "allow_public_read" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_self_update" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_admin_all" ON profiles
FOR ALL TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "allow_public_read" ON news_articles
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_admin_all" ON news_articles
FOR ALL TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "allow_public_read" ON meetups
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_admin_all" ON meetups
FOR ALL TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "allow_public_read" ON courses
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_admin_all" ON courses
FOR ALL TO authenticated
USING (auth.jwt()->>'role' = 'admin');

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

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with simplified RLS policies';
COMMENT ON FUNCTION handle_user_updates() IS 'Updates user metadata when role or blocked status changes';