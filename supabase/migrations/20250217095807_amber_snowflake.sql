-- First, drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all constraints from profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Recreate profiles table with correct constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First create the profile
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
    'user',
    false,
    NOW(),
    NOW()
  );

  -- Then create the wallet
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
  RAISE LOG 'Error in handle_new_user for user ID % (email: %): %', NEW.id, NEW.email, SQLERRM;
  RAISE LOG 'Error details: %', SQLSTATE;
  -- Re-raise the error to fail the transaction
  RAISE;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with proper constraints and defaults';
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up';