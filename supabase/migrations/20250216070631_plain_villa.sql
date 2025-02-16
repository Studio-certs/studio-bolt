-- Create a function to check if a user is blocked before any operation
CREATE OR REPLACE FUNCTION auth.check_user_blocked()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  ) THEN
    RAISE EXCEPTION 'User is blocked';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to check blocked status before any operation
CREATE TRIGGER check_blocked_status
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_user_blocked();

-- Update the handle_user_data function to properly sync blocked status
CREATE OR REPLACE FUNCTION auth.handle_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if role or blocked status has changed
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.blocked IS DISTINCT FROM NEW.blocked) THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
      'role', NEW.role,
      'blocked', COALESCE(NEW.blocked, false)
    )
    WHERE id = NEW.id;

    -- If user is being blocked, terminate their sessions
    IF NEW.blocked = true THEN
      DELETE FROM auth.sessions WHERE user_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster blocked status checks
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);

-- Add comment explaining the blocked functionality
COMMENT ON COLUMN profiles.blocked IS 'Whether the user is blocked from accessing the platform. Blocked users cannot log in or access any data.';