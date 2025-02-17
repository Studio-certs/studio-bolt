-- First, ensure we have the correct foreign key relationships
-- Fix meetups foreign key
ALTER TABLE meetups
DROP CONSTRAINT IF EXISTS meetups_organizer_id_fkey;

ALTER TABLE meetups
ADD CONSTRAINT meetups_organizer_id_fkey
FOREIGN KEY (organizer_id)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_meetups_organizer_id
ON meetups(organizer_id);

-- Fix courses foreign key
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

-- Add helpful comments
COMMENT ON CONSTRAINT meetups_organizer_id_fkey ON meetups IS 'Foreign key relationship between meetups and their organizers';
COMMENT ON CONSTRAINT courses_instructor_id_fkey ON courses IS 'Foreign key relationship between courses and their instructors';