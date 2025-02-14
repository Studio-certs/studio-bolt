/*
  # Add Email Column to Profiles

  1. Changes
    - Add email column to profiles table
    - Create function to sync email from auth.users
    - Create trigger to keep email in sync
    - Update existing profiles with emails from auth.users

  2. Security
    - Email is readable by the user and admins
    - Email is not publicly accessible
*/

-- Add email column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep email in sync
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Update existing profiles with emails from auth.users
UPDATE profiles
SET email = users.email
FROM auth.users
WHERE profiles.id = users.id;

-- Add policy to protect email visibility
CREATE POLICY "Users can view own email"
ON profiles
FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);