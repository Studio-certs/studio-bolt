-- First, remove any orphaned meetups
DELETE FROM meetups
WHERE organizer_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = meetups.organizer_id
);

-- Drop and recreate the foreign key with proper constraints
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

-- Add helpful comment
COMMENT ON CONSTRAINT meetups_organizer_id_fkey ON meetups IS 'Foreign key relationship between meetups and their organizers';