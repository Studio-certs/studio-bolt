-- First, drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all constraints and defaults from profiles table
ALTER TABLE profiles
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN role DROP NOT NULL,
ALTER COLUMN created_at DROP NOT NULL,
ALTER COLUMN updated_at DROP NOT NULL;

-- Create a basic handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile when a user signs up';