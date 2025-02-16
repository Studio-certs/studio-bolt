-- First, drop all existing policies
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public news articles access" ON news_articles;
DROP POLICY IF EXISTS "Admin news articles management" ON news_articles;
DROP POLICY IF EXISTS "Public meetups access" ON meetups;
DROP POLICY IF EXISTS "Admin meetups management" ON meetups;
DROP POLICY IF EXISTS "Public courses access" ON courses;
DROP POLICY IF EXISTS "Admin courses management" ON courses;

-- Create maximally simplified policies
-- Profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- News Articles
CREATE POLICY "News articles are viewable by everyone"
ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage news articles"
ON news_articles
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Meetups
CREATE POLICY "Meetups are viewable by everyone"
ON meetups
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage meetups"
ON meetups
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Courses
CREATE POLICY "Courses are viewable by everyone"
ON courses
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage courses"
ON courses
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Create function to sync role to JWT
CREATE OR REPLACE FUNCTION auth.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's JWT claim when role changes
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role::text)
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role sync
DROP TRIGGER IF EXISTS sync_user_role ON profiles;
CREATE TRIGGER sync_user_role
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_user_role();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with simplified RLS policies';
COMMENT ON FUNCTION auth.sync_user_role() IS 'Syncs user role to JWT claims for simpler policy checks';