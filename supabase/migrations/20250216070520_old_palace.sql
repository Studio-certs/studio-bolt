-- First, disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_read_070200" ON profiles;
DROP POLICY IF EXISTS "profiles_update_070200" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_070200" ON profiles;
DROP POLICY IF EXISTS "news_read_070200" ON news_articles;
DROP POLICY IF EXISTS "news_admin_070200" ON news_articles;
DROP POLICY IF EXISTS "meetups_read_070200" ON meetups;
DROP POLICY IF EXISTS "meetups_admin_070200" ON meetups;
DROP POLICY IF EXISTS "courses_read_070200" ON courses;
DROP POLICY IF EXISTS "courses_admin_070200" ON courses;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_user_role ON profiles;
DROP FUNCTION IF EXISTS auth.sync_user_role();

-- Create a simple function to handle user data updates
CREATE OR REPLACE FUNCTION auth.handle_user_data()
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
CREATE TRIGGER on_user_data_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_user_data();

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with RLS disabled';
COMMENT ON TABLE news_articles IS 'News articles with RLS disabled';
COMMENT ON TABLE meetups IS 'Meetups with RLS disabled';
COMMENT ON TABLE courses IS 'Courses with RLS disabled';
COMMENT ON FUNCTION auth.handle_user_data() IS 'Updates user metadata when role or blocked status changes';