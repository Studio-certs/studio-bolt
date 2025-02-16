-- First, disable RLS temporarily to avoid any issues during updates
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "allow_read" ON profiles;
DROP POLICY IF EXISTS "allow_update" ON profiles;
DROP POLICY IF EXISTS "allow_read_all" ON news_articles;
DROP POLICY IF EXISTS "allow_read_all" ON meetups;
DROP POLICY IF EXISTS "allow_read_all" ON courses;

-- Create new, simplified policies without any recursion
CREATE POLICY "read_profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "update_own_profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "read_news" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "admin_manage_news" ON news_articles
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

CREATE POLICY "read_meetups" ON meetups
FOR SELECT USING (true);

CREATE POLICY "admin_manage_meetups" ON meetups
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

CREATE POLICY "read_courses" ON courses
FOR SELECT USING (true);

CREATE POLICY "admin_manage_courses" ON courses
FOR ALL USING (
  auth.jwt() ? 'role' AND 
  auth.jwt()->>'role' = 'admin'
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create function to sync role to JWT claims
CREATE OR REPLACE FUNCTION auth.sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('role', NEW.role)
        ELSE
          jsonb_set(raw_user_meta_data, '{role}', to_jsonb(NEW.role::text))
      END
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role sync
DROP TRIGGER IF EXISTS on_role_update ON profiles;
CREATE TRIGGER on_role_update
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_role_to_jwt();

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with non-recursive RLS policies';
COMMENT ON FUNCTION auth.sync_role_to_jwt() IS 'Syncs user role to JWT claims for policy checks';