-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'user',
    NOW(),
    NOW()
  )
  RETURNING id INTO profile_id;

  -- Only proceed with wallet creation if profile was created
  IF profile_id IS NOT NULL THEN
    -- Create wallet
    INSERT INTO user_wallets (
      user_id,
      tokens,
      created_at,
      updated_at
    ) VALUES (
      profile_id,
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
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the full error details
  RAISE LOG 'Error in handle_new_user for user ID % (email: %): %', NEW.id, NEW.email, SQLERRM;
  RAISE LOG 'Error details: %', SQLSTATE;
  -- Re-raise the error to ensure the transaction fails properly
  RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all required columns have proper defaults and constraints
ALTER TABLE profiles 
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW(),
ALTER COLUMN blocked SET DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- Add helpful comments
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up, with improved error handling';