-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_read_20250216" ON profiles;
DROP POLICY IF EXISTS "profiles_update_20250216" ON profiles;
DROP POLICY IF EXISTS "news_read_20250216" ON news_articles;
DROP POLICY IF EXISTS "meetups_read_20250216" ON meetups;
DROP POLICY IF EXISTS "courses_read_20250216" ON courses;

-- Create new simplified policies that avoid recursion
CREATE POLICY "profiles_read" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (
  CASE 
    WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'admin' THEN true
    ELSE auth.uid() = id
  END
);

CREATE POLICY "news_read" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "news_write" ON news_articles
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

CREATE POLICY "meetups_read" ON meetups
FOR SELECT USING (true);

CREATE POLICY "meetups_write" ON meetups
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

CREATE POLICY "courses_read" ON courses
FOR SELECT USING (true);

CREATE POLICY "courses_write" ON courses
FOR ALL USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

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

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with non-recursive RLS policies';
COMMENT ON FUNCTION auth.sync_user_role() IS 'Syncs user role to JWT claims for simpler policy checks';