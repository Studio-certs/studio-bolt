-- First drop any existing policies
DROP POLICY IF EXISTS "read_all" ON profiles;
DROP POLICY IF EXISTS "update_own" ON profiles;
DROP POLICY IF EXISTS "read_all" ON news_articles;
DROP POLICY IF EXISTS "read_all" ON meetups;
DROP POLICY IF EXISTS "read_all" ON courses;

-- Create new policies with unique names
CREATE POLICY "profiles_select_20250217" ON profiles
FOR SELECT USING (true);

CREATE POLICY "profiles_update_20250217" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "news_select_20250217" ON news_articles
FOR SELECT USING (true);

CREATE POLICY "meetups_select_20250217" ON meetups
FOR SELECT USING (true);

CREATE POLICY "courses_select_20250217" ON courses
FOR SELECT USING (true);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with timestamped unique policy names';
COMMENT ON TABLE news_articles IS 'News articles with public read access';
COMMENT ON TABLE meetups IS 'Meetups with public read access';
COMMENT ON TABLE courses IS 'Courses with public read access';