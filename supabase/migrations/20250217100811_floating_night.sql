-- First, drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all constraints from profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Recreate profiles table with absolute minimal constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role user_role DEFAULT 'user',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

-- Create a maximally simplified handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
BEGIN
  -- Create profile with minimal fields
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  RETURNING id INTO _wallet_id;

  -- Only create wallet if profile was created successfully
  IF _wallet_id IS NOT NULL THEN
    INSERT INTO user_wallets (user_id)
    VALUES (_wallet_id);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with minimal constraints';
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';