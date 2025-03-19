/*
  # Add Unique Constraint to Token Types

  1. Changes
    - Add unique constraint on token_types name column
    - Ensure no duplicate names exist before adding constraint
*/

-- First, remove any potential duplicates
DELETE FROM token_types a USING token_types b
WHERE a.id > b.id 
AND a.name = b.name;

-- Add unique constraint on name
ALTER TABLE token_types
ADD CONSTRAINT token_types_name_key UNIQUE (name);

-- Add helpful comment
COMMENT ON CONSTRAINT token_types_name_key ON token_types IS 'Ensures token type names are unique';