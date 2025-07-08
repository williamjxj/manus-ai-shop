-- =====================================================
-- Fix Products Table - Add Missing updated_at Column
-- =====================================================
-- This script adds the missing updated_at column to the products table

-- Add updated_at column if it doesn't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_at = created_at if created_at exists
UPDATE products 
SET updated_at = COALESCE(created_at, NOW()) 
WHERE updated_at IS NULL;

-- Create or replace trigger function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Create trigger to automatically update updated_at on product updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'updated_at';

-- Show completion message
SELECT 'Products table updated_at column added successfully! 🎉' as status;
