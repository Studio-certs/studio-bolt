-- Drop the problematic trigger
DROP TRIGGER IF EXISTS check_blocked_status ON profiles;

-- Update the check_user_blocked function to be more specific
CREATE OR REPLACE FUNCTION auth.check_user_blocked()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND blocked = true
    ) THEN
      RAISE EXCEPTION 'User is blocked';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger that only runs for UPDATE and DELETE
CREATE TRIGGER check_blocked_status
  BEFORE UPDATE OR DELETE
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_user_blocked();

-- Add helpful comments
COMMENT ON FUNCTION auth.check_user_blocked() IS 'Prevents blocked users from modifying data';
COMMENT ON TRIGGER check_blocked_status ON profiles IS 'Enforces blocked user restrictions on data modifications';