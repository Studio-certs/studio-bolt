-- First drop all existing policies
DROP POLICY IF EXISTS "Anyone can view news articles" ON news_articles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view meetups" ON meetups;
DROP POLICY IF EXISTS "Only admins can manage meetups" ON meetups;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Only admins can manage courses" ON courses;

-- Create simplified policies without recursive checks
CREATE POLICY "Public profiles access"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Public news articles access"
ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "Admin news articles management"
ON news_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Public meetups access"
ON meetups
FOR SELECT
USING (true);

CREATE POLICY "Admin meetups management"
ON meetups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Public courses access"
ON courses
FOR SELECT
USING (true);

CREATE POLICY "Admin courses management"
ON courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add comment explaining the changes
COMMENT ON TABLE profiles IS 'User profiles with simplified RLS policies to prevent recursion';