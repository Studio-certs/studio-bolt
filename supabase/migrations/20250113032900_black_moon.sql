-- Update the specified user to be an admin
UPDATE profiles 
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'alexbonti83@hotmail.com'
);
