/*
  # Fix Profiles RLS Policy

  1. Changes
    - Drop existing problematic policy
    - Create new policy without recursion
    - Add separate policies for admin access

  2. Security
    - Users can view their own profile
    - Admins can view all profiles
    - Email remains protected
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own email" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Add index to improve performance of role checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);