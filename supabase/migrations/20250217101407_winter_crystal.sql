-- First, ensure profiles table has correct structure
ALTER TABLE profiles
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN full_name SET DEFAULT '',
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN blocked SET DEFAULT false,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Re-enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "news_read" ON news_articles FOR SELECT USING (true);
CREATE POLICY "meetups_read" ON meetups FOR SELECT USING (true);
CREATE POLICY "courses_read" ON courses FOR SELECT USING (true);
CREATE POLICY "enrollments_read" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_read" ON module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "content_read" ON content_items FOR SELECT USING (true);
CREATE POLICY "badges_read" ON badges FOR SELECT USING (true);
CREATE POLICY "user_badges_read" ON user_badges FOR SELECT USING (true);
CREATE POLICY "quiz_attempts_read" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_read" ON user_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_read" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payment_transactions_read" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    blocked,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    false,
    NOW(),
    NOW()
  );

  -- Create wallet
  INSERT INTO user_wallets (
    user_id,
    tokens,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW; -- Return NEW to ensure user creation succeeds
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with proper constraints and RLS';
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';