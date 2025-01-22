/*
  # Add RLS policies for content items

  1. Security
    - Enable RLS on content_items table
    - Add policy for public read access to content items
    - Add policy for admin management of content items

  2. Changes
    - Enable row level security
    - Add SELECT policy for all users
    - Add ALL policy for admin users
*/

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Content items are viewable by everyone"
ON content_items FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage content items"
ON content_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
