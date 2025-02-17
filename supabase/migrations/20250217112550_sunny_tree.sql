-- First, ensure we have no orphaned enrollments
DELETE FROM course_enrollments
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = course_enrollments.user_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE course_enrollments
DROP CONSTRAINT IF EXISTS course_enrollments_user_id_fkey;

ALTER TABLE course_enrollments
ADD CONSTRAINT course_enrollments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id
ON course_enrollments(user_id);

-- Add helpful comment
COMMENT ON CONSTRAINT course_enrollments_user_id_fkey ON course_enrollments IS 'Foreign key relationship between course enrollments and profiles';