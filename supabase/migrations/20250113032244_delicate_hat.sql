/*
  # Fix user registration trigger function

  1. Changes
    - Update handle_new_user function to safely handle missing metadata
    - Add error handling for null values
    - Ensure proper type casting of metadata

  2. Security
    - Maintain existing RLS policies
    - Keep security definer setting for proper permissions
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
