/*
  # Badge System Implementation

  1. New Tables
    - `badges`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_badges`
      - `user_id` (uuid, references profiles)
      - `badge_id` (uuid, references badges)
      - `awarded_at` (timestamp)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for admin management and public viewing
*/

-- Create badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_badges junction table
CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for badges
CREATE POLICY "Badges are viewable by everyone"
ON badges FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage badges"
ON badges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for user_badges
CREATE POLICY "User badges are viewable by everyone"
ON user_badges FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage user badges"
ON user_badges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
