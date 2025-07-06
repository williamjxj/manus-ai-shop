-- =====================================================
-- Adult AI Gallery - Static Categories Table
-- =====================================================
-- Creates a static categories table with predefined adult content categories

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  category_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Insert the 6 main adult content categories
INSERT INTO categories (category_name, category_description, is_active) VALUES
('artistic-nude', 'Artistic nude photography and fine art featuring tasteful nudity with emphasis on form, lighting, and composition', true),
('boudoir', 'Intimate boudoir photography featuring elegant poses, lingerie, and sensual styling in private settings', true),
('glamour', 'Professional glamour photography with high-end styling, makeup, and fashion elements', true),
('erotic-art', 'Artistic erotic content including digital art, paintings, and creative visual expressions of sensuality', true),
('adult-animation', 'Animated adult content including digital animations, motion graphics, and artistic video content', true),
('mature-content', 'General mature content for adult audiences including various themes and artistic expressions', true)
ON CONFLICT (category_name) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(category_name);

-- Update products table to reference categories table
ALTER TABLE products 
  ADD CONSTRAINT products_category_fkey 
  FOREIGN KEY (category) 
  REFERENCES categories(category_name) 
  ON UPDATE CASCADE;

-- Function to get active categories
CREATE OR REPLACE FUNCTION get_active_categories()
RETURNS TABLE(category_name TEXT, category_description TEXT) 
LANGUAGE sql STABLE
AS $$
  SELECT c.category_name, c.category_description 
  FROM categories c 
  WHERE c.is_active = true 
  ORDER BY c.created_at;
$$;
