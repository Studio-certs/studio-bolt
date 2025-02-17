-- Temporarily disable RLS on all tables to resolve recursion issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetups DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid any conflicts
DROP POLICY IF EXISTS "profiles_read_070200" ON profiles;
DROP POLICY IF EXISTS "profiles_update_070200" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_070200" ON profiles;
DROP POLICY IF EXISTS "news_read_070200" ON news_articles;
DROP POLICY IF EXISTS "news_admin_070200" ON news_articles;
DROP POLICY IF EXISTS "meetups_read_070200" ON meetups;
DROP POLICY IF EXISTS "meetups_admin_070200" ON meetups;
DROP POLICY IF EXISTS "courses_read_070200" ON courses;
DROP POLICY IF EXISTS "courses_admin_070200" ON courses;

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with RLS temporarily disabled';
COMMENT ON TABLE news_articles IS 'News articles with RLS temporarily disabled';
COMMENT ON TABLE meetups IS 'Meetups with RLS temporarily disabled';
COMMENT ON TABLE courses IS 'Courses with RLS temporarily disabled';