-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role user_role := 'user';
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    default_role,
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
  RAISE; -- Re-raise the error to ensure the transaction fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all required columns have appropriate defaults
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN blocked SET DEFAULT false,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';