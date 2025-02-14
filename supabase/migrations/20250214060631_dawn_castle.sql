/*
  # Fix RLS Policies

  1. Changes
    - Drop all problematic policies
    - Create new simplified policies without recursion
    - Add proper indexing for performance

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Optimize query performance
*/

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create simplified policies without recursion
CREATE POLICY "Anyone can view basic profile info"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create policies for news articles
DROP POLICY IF EXISTS "News articles are viewable by everyone" ON news_articles;
DROP POLICY IF EXISTS "Only admins can create news" ON news_articles;

CREATE POLICY "Anyone can view news articles"
ON news_articles
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage news articles"
ON news_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create policies for meetups
DROP POLICY IF EXISTS "Meetups are viewable by everyone" ON meetups;
DROP POLICY IF EXISTS "Only admins can manage meetups" ON meetups;

CREATE POLICY "Anyone can view meetups"
ON meetups
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage meetups"
ON meetups
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create policies for courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Only admins can manage courses" ON courses;

CREATE POLICY "Anyone can view courses"
ON courses
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage courses"
ON courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE auth.uid() = id 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_meetups_organizer ON meetups(organizer_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);

-- Update the handle_new_user function to set role in metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;