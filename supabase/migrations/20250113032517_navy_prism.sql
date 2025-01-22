/*
  # Create admin user

  1. Changes
    - Updates a specified user's role to admin
    - Adds necessary admin policies
*/

-- Update the specified user to be an admin (replace the email with your actual email)
UPDATE profiles 
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'admin@example.com'
);

-- Add admin-specific policies for news articles
CREATE POLICY "Admins can manage news articles" ON news_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin-specific policies for meetups
CREATE POLICY "Admins can manage meetups" ON meetups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
