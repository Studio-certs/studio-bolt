-- First, ensure we have the correct foreign key relationships
-- Fix meetups organizer relationship
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

-- Fix meetup attendees relationship
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

-- Create index for meetup lookup
CREATE INDEX IF NOT EXISTS idx_meetup_attendees_meetup_id
ON meetup_attendees(meetup_id);

-- Add RLS policies for meetup attendees
DROP POLICY IF EXISTS "meetup_attendees_read" ON meetup_attendees;
CREATE POLICY "meetup_attendees_read" ON meetup_attendees
FOR SELECT USING (true);

DROP POLICY IF EXISTS "meetup_attendees_insert" ON meetup_attendees;
CREATE POLICY "meetup_attendees_insert" ON meetup_attendees
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "meetup_attendees_delete" ON meetup_attendees;
CREATE POLICY "meetup_attendees_delete" ON meetup_attendees
FOR DELETE USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON CONSTRAINT meetups_organizer_id_fkey ON meetups IS 'Foreign key relationship between meetups and their organizers';
COMMENT ON CONSTRAINT meetup_attendees_user_id_fkey ON meetup_attendees IS 'Foreign key relationship between meetup attendees and profiles';