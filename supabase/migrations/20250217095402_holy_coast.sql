-- First, drop all dependent policies
DROP POLICY IF EXISTS "Only admins can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Only admins can manage content items" ON content_items;
DROP POLICY IF EXISTS "Only admins can manage badges" ON badges;
DROP POLICY IF EXISTS "Only admins can manage user badges" ON user_badges;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Only admins can create transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON payment_transactions;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all constraints from profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Recreate profiles table with minimal constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role user_role DEFAULT 'user',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create a simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add primary key after trigger creation
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- Recreate the policies that were dropped
CREATE POLICY "Only admins can manage modules" ON modules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all enrollments" ON course_enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can manage content items" ON content_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can manage badges" ON badges
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can manage user badges" ON user_badges
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all transactions" ON transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can create transactions" ON transactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all payment transactions" ON payment_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates a new profile when a user signs up';