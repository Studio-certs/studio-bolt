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
  -- Create profile with minimal required fields
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''));

  -- Create wallet with minimal required fields
  INSERT INTO user_wallets (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure all columns have appropriate defaults
ALTER TABLE profiles
ALTER COLUMN full_name SET DEFAULT '',
ALTER COLUMN role SET DEFAULT 'user',
ALTER COLUMN blocked SET DEFAULT false,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_wallets
ALTER COLUMN tokens SET DEFAULT 0,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';