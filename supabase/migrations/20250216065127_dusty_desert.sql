-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS sync_user_role ON profiles;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS auth.sync_user_role();

-- Create maximally simplified policies
CREATE POLICY "allow_read" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "allow_update" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Create a new, simpler function to handle role updates
CREATE OR REPLACE FUNCTION auth.handle_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role::text)
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new trigger with a different name
CREATE TRIGGER on_role_update
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_role_update();

-- Add helpful comments
COMMENT ON FUNCTION auth.handle_role_update() IS 'Updates user role in metadata when role changes';