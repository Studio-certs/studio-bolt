-- First, drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all constraints from profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Recreate profiles table with minimal but necessary constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'user',
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Create a minimal but robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with minimal required fields
  INSERT INTO profiles (
    id,
    email,
    full_name
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NULL; -- This will rollback the transaction
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

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profiles with minimal required fields';
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile when a user signs up';