-- =====================================================
-- Fix Product Media RLS Policies
-- =====================================================
-- This migration fixes conflicting RLS policies for product_media table

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can manage media for own products" ON product_media;
DROP POLICY IF EXISTS "Users can insert media for own products" ON product_media;
DROP POLICY IF EXISTS "Users can update media for own products" ON product_media;
DROP POLICY IF EXISTS "Users can delete media for own products" ON product_media;

-- Create clear, specific policies for product_media
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

-- Show completion status
SELECT 
  'Product media RLS policies fixed! 🎉' as status,
  'Media upload should now work properly.' as message;
