-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_token_type_id uuid;
BEGIN
  -- Get the default token type ID (Studio Coins)
  SELECT id INTO default_token_type_id
  FROM token_types
  WHERE name = 'Studio Coins'
  LIMIT 1;

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

  -- Create wallet with token type
  INSERT INTO user_wallets (
    user_id,
    tokens,
    token_type_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    0,
    default_token_type_id,
    NOW(),
    NOW()
  );

  -- Update user metadata
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', 'user',
    'blocked', false,
    'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE LOG 'Error in handle_new_user for user ID % (email: %): %', NEW.id, NEW.email, SQLERRM;
  RAISE LOG 'Error details: %', SQLSTATE;
  
  -- Clean up any partial inserts if there was an error
  BEGIN
    DELETE FROM profiles WHERE id = NEW.id;
    DELETE FROM user_wallets WHERE user_id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log cleanup errors but don't fail
    RAISE LOG 'Error cleaning up failed user creation: %', SQLERRM;
  END;
  
  -- Re-raise the error
  RAISE;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure the Studio Coins token type exists
INSERT INTO token_types (
  id,
  name,
  description,
  conversion_rate,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Studio Coins',
  'Default platform currency',
  1.00,
  NOW(),
  NOW()
)
ON CONFLICT ON CONSTRAINT token_types_name_key 
DO UPDATE SET
  description = EXCLUDED.description,
  conversion_rate = EXCLUDED.conversion_rate,
  updated_at = NOW();

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up, with improved error handling and cleanup';