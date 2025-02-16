-- Add blocked column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION auth.check_user_blocked()
RETURNS trigger AS $$
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

-- Create policy to prevent blocked users from accessing anything
CREATE POLICY "Blocked users cannot access data"
ON profiles
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND blocked = true
  )
);

-- Add index for faster blocked status checks
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);

-- Add comment explaining the blocked column
COMMENT ON COLUMN profiles.blocked IS 'Whether the user is blocked from accessing the platform';