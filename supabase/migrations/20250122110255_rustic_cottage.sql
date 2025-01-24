/*
  # Add price field to courses table

  1. Changes
    - Add price column to courses table with default value of 0
    - Make price non-negative using a check constraint
    - Add index for price-based queries
*/

-- Add price column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00 
CHECK (price >= 0);

-- Create index for price-based queries
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);

-- Add comment to explain the price field
COMMENT ON COLUMN courses.price IS 'Course price in USD. Default is 0.00 for free courses.';
