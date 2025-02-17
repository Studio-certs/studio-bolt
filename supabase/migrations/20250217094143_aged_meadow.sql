-- First, drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TRIGGER IF EXISTS on_user_data_change ON profiles;
DROP FUNCTION IF EXISTS auth.handle_user_data();

-- Create a new, simplified handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile first
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user',
    NOW(),
    NOW()
  );

  -- Then create wallet
  INSERT INTO public.user_wallets (
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

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', 'user',
    'blocked', false
  )
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error details
  RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  -- Re-raise the error to fail the transaction
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all required columns have proper defaults
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

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

-- Create simplified RLS policies
CREATE POLICY "read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "read_all" ON news_articles FOR SELECT USING (true);
CREATE POLICY "read_all" ON meetups FOR SELECT USING (true);
CREATE POLICY "read_all" ON courses FOR SELECT USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Add helpful comments
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';