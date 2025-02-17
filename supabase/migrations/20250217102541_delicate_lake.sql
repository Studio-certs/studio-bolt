-- First, ensure we have no orphaned attendees
DELETE FROM meetup_attendees
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = meetup_attendees.user_id
);

-- Drop and recreate the foreign key with proper constraints
ALTER TABLE meetup_attendees
DROP CONSTRAINT IF EXISTS meetup_attendees_user_id_fkey;

ALTER TABLE meetup_attendees
ADD CONSTRAINT meetup_attendees_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_meetup_attendees_user_id
ON meetup_attendees(user_id);

-- Add helpful comment
COMMENT ON CONSTRAINT meetup_attendees_user_id_fkey ON meetup_attendees IS 'Foreign key relationship between meetup attendees and profiles';