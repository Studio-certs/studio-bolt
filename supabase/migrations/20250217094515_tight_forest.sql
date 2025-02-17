-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a maximally simplified handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at,
    blocked
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'user',
    NOW(),
    NOW(),
    false
  );

  -- Create wallet
  INSERT INTO user_wallets (
    user_id,
    tokens
  ) VALUES (
    NEW.id,
    0
  );

  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';