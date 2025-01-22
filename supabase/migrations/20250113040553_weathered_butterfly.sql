/*
  # Add Module Management Policies

  1. Security
    - Enable RLS policies for modules table
    - Add policies for admin users to manage modules
    - Add policies for viewing modules
*/

-- Add policies for modules table
CREATE POLICY "Modules are viewable by everyone"
ON modules FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage modules"
ON modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
