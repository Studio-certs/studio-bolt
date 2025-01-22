-- Update content_type enum to include all required types
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'text';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'image';

-- Ensure content_items table uses the updated enum
ALTER TABLE content_items 
  ALTER COLUMN type TYPE content_type USING type::text::content_type;
