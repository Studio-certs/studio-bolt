-- Drop problematic policies
DROP POLICY IF EXISTS "Blocked users cannot access data" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Anyone can view profiles"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

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

-- Update policies for news articles
DROP POLICY IF EXISTS "News articles are viewable by everyone" ON news_articles;
DROP POLICY IF EXISTS "Only admins can create news" ON news_articles;
DROP POLICY IF EXISTS "Only admins can manage news articles" ON news_articles;

CREATE POLICY "Anyone can view news articles"
ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage news articles"
ON news_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Update policies for meetups
DROP POLICY IF EXISTS "Meetups are viewable by everyone" ON meetups;
DROP POLICY IF EXISTS "Only admins can manage meetups" ON meetups;

CREATE POLICY "Anyone can view meetups"
ON meetups
FOR SELECT
USING (true);

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

-- Update policies for courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Only admins can manage courses" ON courses;

CREATE POLICY "Anyone can view courses"
ON courses
FOR SELECT
USING (true);

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