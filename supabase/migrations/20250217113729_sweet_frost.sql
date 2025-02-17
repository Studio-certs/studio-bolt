-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a robust handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Create profile with all required fields
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
  )
  RETURNING id INTO profile_id;

  -- Only create wallet if profile was created successfully
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
  -- Log detailed error information
  RAISE LOG 'Error in handle_new_user for user ID % (email: %): %', NEW.id, NEW.email, SQLERRM;
  RAISE LOG 'Error details: %', SQLSTATE;
  -- Re-raise the error to ensure the transaction fails properly
  RAISE;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile and wallet when a user signs up, with improved error handling';