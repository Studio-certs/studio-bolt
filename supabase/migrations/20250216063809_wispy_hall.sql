-- First, drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "News articles are viewable by everyone" ON news_articles;
DROP POLICY IF EXISTS "Admins can manage news articles" ON news_articles;
DROP POLICY IF EXISTS "Meetups are viewable by everyone" ON meetups;
DROP POLICY IF EXISTS "Admins can manage meetups" ON meetups;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Create new policies with unique names
CREATE POLICY "global_profiles_select" ON profiles
FOR SELECT USING (true);

CREATE POLICY "user_profiles_update" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "global_news_select" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "admin_news_all" ON news_articles
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "global_meetups_select" ON meetups
FOR SELECT USING (true);

CREATE POLICY "admin_meetups_all" ON meetups
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "global_courses_select" ON courses
FOR SELECT USING (true);

CREATE POLICY "admin_courses_all" ON courses
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add comment explaining the changes
COMMENT ON TABLE profiles IS 'User profiles with unique policy names to prevent conflicts';