-- First, remove any orphaned courses
DELETE FROM courses
WHERE instructor_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = courses.instructor_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

ALTER TABLE courses
ADD CONSTRAINT courses_instructor_id_fkey
FOREIGN KEY (instructor_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id
ON courses(instructor_id);

-- Add helpful comment
COMMENT ON CONSTRAINT courses_instructor_id_fkey ON courses IS 'Foreign key relationship between courses and their instructors';