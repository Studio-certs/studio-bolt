-- First drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view news articles" ON news_articles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view meetups" ON meetups;
DROP POLICY IF EXISTS "Only admins can manage meetups" ON meetups;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Only admins can manage courses" ON courses;

-- Recreate policies with proper checks for blocked status
CREATE POLICY "Anyone can view news articles"
ON news_articles
FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  )
);

CREATE POLICY "Anyone can view profiles"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (
  auth.uid() = id AND 
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  )
);

CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Anyone can view meetups"
ON meetups
FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  )
);

CREATE POLICY "Only admins can manage meetups"
ON meetups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Anyone can view courses"
ON courses
FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  )
);

CREATE POLICY "Only admins can manage courses"
ON courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);