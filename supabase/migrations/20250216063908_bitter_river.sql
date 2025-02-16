-- First, drop ALL existing policies
DROP POLICY IF EXISTS "global_profiles_select" ON profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON profiles;
DROP POLICY IF EXISTS "global_news_select" ON news_articles;
DROP POLICY IF EXISTS "admin_news_all" ON news_articles;
DROP POLICY IF EXISTS "global_meetups_select" ON meetups;
DROP POLICY IF EXISTS "admin_meetups_all" ON meetups;
DROP POLICY IF EXISTS "global_courses_select" ON courses;
DROP POLICY IF EXISTS "admin_courses_all" ON courses;

-- Create simplified policies without any recursive checks
CREATE POLICY "profiles_select" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (
  CASE 
    WHEN auth.jwt() ->> 'role' = 'admin' THEN true
    ELSE auth.uid() = id AND NOT (COALESCE((SELECT blocked FROM profiles WHERE id = auth.uid()), false))
  END
);

CREATE POLICY "news_select" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "news_admin" ON news_articles
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "meetups_select" ON meetups
FOR SELECT USING (true);

CREATE POLICY "meetups_admin" ON meetups
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "courses_select" ON courses
FOR SELECT USING (true);

CREATE POLICY "courses_admin" ON courses
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to handle blocked status in JWT
CREATE OR REPLACE FUNCTION auth.handle_blocked_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.blocked IS DISTINCT FROM OLD.blocked THEN
    -- Update user's JWT claim when blocked status changes
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{blocked}',
      to_jsonb(NEW.blocked)
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for blocked status sync
DROP TRIGGER IF EXISTS sync_blocked_status ON profiles;
CREATE TRIGGER sync_blocked_status
  AFTER UPDATE OF blocked ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_blocked_status();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);
CREATE INDEX IF NOT EXISTS idx_auth_jwt_role ON auth.users((raw_user_meta_data->>'role'));

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with non-recursive RLS policies';
COMMENT ON FUNCTION auth.handle_blocked_status() IS 'Syncs user blocked status to JWT claims';