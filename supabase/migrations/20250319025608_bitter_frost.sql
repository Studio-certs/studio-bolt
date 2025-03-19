/*
  # Add Token Types Table

  1. New Tables
    - token_types
      - id (uuid, primary key)
      - name (text, not null)
      - description (text)
      - image_url (text)
      - conversion_rate (decimal, not null)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for admin management
*/

-- Create token_types table
CREATE TABLE token_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  conversion_rate DECIMAL(10,2) NOT NULL CHECK (conversion_rate > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE token_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "token_types_select" ON token_types
FOR SELECT TO public
USING (true);

CREATE POLICY "token_types_insert" ON token_types
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "token_types_update" ON token_types
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "token_types_delete" ON token_types
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_token_types_name ON token_types(name);
CREATE INDEX idx_token_types_created_at ON token_types(created_at);

-- Add helpful comments
COMMENT ON TABLE token_types IS 'Different types of tokens available in the system';
COMMENT ON COLUMN token_types.conversion_rate IS 'Rate at which real currency is converted to tokens (e.g., 1 Cleen Token = X tokens)';