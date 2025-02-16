-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_select_20250216" ON profiles;
DROP POLICY IF EXISTS "profiles_update_20250216" ON profiles;
DROP POLICY IF EXISTS "news_select_20250216" ON news_articles;
DROP POLICY IF EXISTS "news_admin_20250216" ON news_articles;
DROP POLICY IF EXISTS "meetups_select_20250216" ON meetups;
DROP POLICY IF EXISTS "meetups_admin_20250216" ON meetups;
DROP POLICY IF EXISTS "courses_select_20250216" ON courses;
DROP POLICY IF EXISTS "courses_admin_20250216" ON courses;

-- Create new simplified policies without any recursion
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (
  CASE 
    WHEN auth.jwt()->>'role' = 'admin' THEN true
    ELSE auth.uid() = id AND NOT coalesce(blocked, false)
  END
);

CREATE POLICY "news_select" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "news_admin" ON news_articles
FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "meetups_select" ON meetups
FOR SELECT USING (true);

CREATE POLICY "meetups_admin" ON meetups
FOR ALL USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "courses_select" ON courses
FOR SELECT USING (true);

CREATE POLICY "courses_admin" ON courses
FOR ALL USING (auth.jwt()->>'role' = 'admin');

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create function to sync user data to JWT claims
CREATE OR REPLACE FUNCTION auth.sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.blocked IS DISTINCT FROM OLD.blocked) THEN
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

-- Create trigger for user data sync
DROP TRIGGER IF EXISTS sync_user_data ON profiles;
CREATE TRIGGER sync_user_data
  AFTER UPDATE OF role, blocked ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_user_data();

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with non-recursive RLS policies';
COMMENT ON FUNCTION auth.sync_user_data() IS 'Syncs user role and blocked status to JWT claims';