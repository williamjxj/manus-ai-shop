-- =====================================================
-- Product Media Gallery System
-- =====================================================
-- This migration creates a proper e-commerce product media system
-- following industry standards (Amazon, Shopify, Etsy, WooCommerce)

-- Create product_media table for one-to-many relationship
CREATE TABLE IF NOT EXISTS product_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT, -- For video thumbnails or optimized image previews
  is_primary BOOLEAN DEFAULT false, -- Primary/featured media
  sort_order INTEGER DEFAULT 0, -- For gallery ordering
  alt_text TEXT, -- Accessibility and SEO
  file_size BIGINT, -- File size in bytes
  duration_seconds INTEGER, -- For videos
  width INTEGER, -- Media dimensions
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_is_primary ON product_media(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON product_media(product_id, sort_order);

-- Ensure only one primary media per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_one_primary 
ON product_media(product_id) 
WHERE is_primary = true;

-- RLS Policies for product_media
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

-- Users can view all product media (public access)
CREATE POLICY "Anyone can view product media" ON product_media FOR SELECT USING (true);

-- Users can insert media for their own products
CREATE POLICY "Users can insert media for own products" ON product_media FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Users can update media for their own products
CREATE POLICY "Users can update media for own products" ON product_media FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Users can delete media for their own products
CREATE POLICY "Users can delete media for own products" ON product_media FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);

-- Function to automatically set sort_order
CREATE OR REPLACE FUNCTION set_product_media_sort_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If sort_order is not provided, set it to the next available number
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 
    INTO NEW.sort_order 
    FROM product_media 
    WHERE product_id = NEW.product_id;
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sort_order
CREATE TRIGGER trigger_set_product_media_sort_order
  BEFORE INSERT OR UPDATE ON product_media
  FOR EACH ROW EXECUTE FUNCTION set_product_media_sort_order();

-- Function to ensure primary media consistency
CREATE OR REPLACE FUNCTION ensure_primary_media_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is being set as primary, unset other primary media for the same product
  IF NEW.is_primary = true THEN
    UPDATE product_media 
    SET is_primary = false, updated_at = NOW()
    WHERE product_id = NEW.product_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  
  -- If this was the only primary and is being unset, set the first media as primary
  IF OLD.is_primary = true AND NEW.is_primary = false THEN
    UPDATE product_media 
    SET is_primary = true, updated_at = NOW()
    WHERE product_id = NEW.product_id 
    AND id != NEW.id
    AND id = (
      SELECT id FROM product_media 
      WHERE product_id = NEW.product_id 
      AND id != NEW.id
      ORDER BY sort_order ASC 
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for primary media consistency
CREATE TRIGGER trigger_ensure_primary_media_consistency
  AFTER UPDATE ON product_media
  FOR EACH ROW EXECUTE FUNCTION ensure_primary_media_consistency();

-- Function to handle media deletion
CREATE OR REPLACE FUNCTION handle_product_media_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- If the deleted media was primary, set the first remaining media as primary
  IF OLD.is_primary = true THEN
    UPDATE product_media 
    SET is_primary = true, updated_at = NOW()
    WHERE product_id = OLD.product_id 
    AND id = (
      SELECT id FROM product_media 
      WHERE product_id = OLD.product_id 
      ORDER BY sort_order ASC 
      LIMIT 1
    );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for media deletion
CREATE TRIGGER trigger_handle_product_media_deletion
  AFTER DELETE ON product_media
  FOR EACH ROW EXECUTE FUNCTION handle_product_media_deletion();

-- Add helper function to get primary media for a product
CREATE OR REPLACE FUNCTION get_product_primary_media(product_uuid UUID)
RETURNS TABLE (
  media_url TEXT,
  media_type TEXT,
  thumbnail_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT pm.media_url, pm.media_type, pm.thumbnail_url
  FROM product_media pm
  WHERE pm.product_id = product_uuid AND pm.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE product_media IS 'Media gallery for products - supports multiple images and videos per product';
COMMENT ON COLUMN product_media.is_primary IS 'Primary/featured media shown in product listings';
COMMENT ON COLUMN product_media.sort_order IS 'Order of media in gallery (0-based)';
COMMENT ON COLUMN product_media.alt_text IS 'Alternative text for accessibility and SEO';

-- Show completion status
SELECT 
  'Product media table created successfully! 🎉' as status,
  'E-commerce media gallery system ready.' as message;
