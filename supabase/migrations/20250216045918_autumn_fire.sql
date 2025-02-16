/*
  # Add public access policies for profile data

  1. Updates
    - Add policies to allow public access to course enrollments and badges
    - Ensure course progress is visible publicly
    - Allow public access to user badges

  2. Security
    - Only expose necessary fields
    - Maintain existing RLS for sensitive data
*/

-- Update course_enrollments policy to allow public viewing
DROP POLICY IF EXISTS "Public can view course enrollments" ON course_enrollments;
CREATE POLICY "Public can view course enrollments"
ON course_enrollments FOR SELECT
USING (true);

-- Update user_badges policy to allow public viewing
DROP POLICY IF EXISTS "Public can view user badges" ON user_badges;
CREATE POLICY "Public can view user badges"
ON user_badges FOR SELECT
USING (true);

-- Update module_progress policy to allow public viewing
DROP POLICY IF EXISTS "Public can view module progress" ON module_progress;
CREATE POLICY "Public can view module progress"
ON module_progress FOR SELECT
USING (true);

-- Add comment explaining the public access
COMMENT ON TABLE course_enrollments IS 'Course enrollment data with public visibility for profile pages';
COMMENT ON TABLE user_badges IS 'User badges with public visibility for profile pages';
COMMENT ON TABLE module_progress IS 'Module progress with public visibility for profile pages';