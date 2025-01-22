/*
  # Add Course Enrollment Policies

  1. Changes
    - Add RLS policies for course_enrollments table
    - Allow users to manage their own enrollments
    - Allow admins to view all enrollments
  
  2. Security
    - Enable RLS on course_enrollments table
    - Add policies for authenticated users to manage their enrollments
    - Add policies for admins to view all enrollments
*/

-- Ensure RLS is enabled
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON course_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to enroll in courses
CREATE POLICY "Users can enroll in courses"
ON course_enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own enrollment progress
CREATE POLICY "Users can update their own enrollment progress"
ON course_enrollments
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to unenroll from courses
CREATE POLICY "Users can delete their own enrollments"
ON course_enrollments
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON course_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
