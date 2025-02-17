-- First, ensure we have the correct foreign key relationship
ALTER TABLE modules
DROP CONSTRAINT IF EXISTS modules_course_id_fkey;

ALTER TABLE modules
ADD CONSTRAINT modules_course_id_fkey
  FOREIGN KEY (course_id)
  REFERENCES courses(id)
  ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "modules_select" ON modules;
DROP POLICY IF EXISTS "modules_admin" ON modules;

-- Create new policies for modules
CREATE POLICY "modules_select" ON modules
FOR SELECT TO public
USING (true);

CREATE POLICY "modules_insert" ON modules
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "modules_update" ON modules
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "modules_delete" ON modules
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle module creation
CREATE OR REPLACE FUNCTION handle_module_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Set timestamps
  NEW.created_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for module creation
DROP TRIGGER IF EXISTS on_module_created ON modules;
CREATE TRIGGER on_module_created
  BEFORE INSERT ON modules
  FOR EACH ROW
  EXECUTE FUNCTION handle_module_creation();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order_index ON modules(order_index);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at);

-- Add helpful comments
COMMENT ON TRIGGER on_module_created ON modules IS 'Sets timestamps when creating modules';
COMMENT ON POLICY "modules_select" ON modules IS 'Anyone can view modules';
COMMENT ON POLICY "modules_insert" ON modules IS 'Only admins can create modules';
COMMENT ON POLICY "modules_update" ON modules IS 'Only admins can update modules';
COMMENT ON POLICY "modules_delete" ON modules IS 'Only admins can delete modules';