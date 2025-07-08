-- =====================================================
-- Enhanced Product Management System
-- =====================================================
-- Adds comprehensive product management features for adult marketplace

-- Add additional product management columns
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE, -- Stock Keeping Unit
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'discontinued', 'pre_order')),
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER, -- For physical products
  ADD COLUMN IF NOT EXISTS dimensions_cm JSONB, -- {"length": 10, "width": 5, "height": 3}
  ADD COLUMN IF NOT EXISTS shipping_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_download_url TEXT,
  ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'standard' CHECK (license_type IN ('standard', 'extended', 'commercial', 'exclusive')),
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchased_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create product_variants table for product variations (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL, -- e.g., "Size: Large, Color: Red"
  variant_options JSONB NOT NULL, -- {"size": "large", "color": "red"}
  sku TEXT UNIQUE,
  price_cents INTEGER, -- Override product price if different
  stock_quantity INTEGER DEFAULT 0,
  weight_grams INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_collections table for grouping products
CREATE TABLE IF NOT EXISTS product_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for product-collection relationships
CREATE TABLE IF NOT EXISTS product_collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES product_collections(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, collection_id)
);

-- Create product_tags table for better tag management
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for product-tag relationships
CREATE TABLE IF NOT EXISTS product_tag_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES product_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, tag_id)
);

-- Create product_analytics table for tracking
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'add_to_cart', 'purchase', 'favorite', 'share')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_collections_slug ON product_collections(slug);
CREATE INDEX IF NOT EXISTS idx_product_collection_items_product_id ON product_collection_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collection_items_collection_id ON product_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_slug ON product_tags(slug);
CREATE INDEX IF NOT EXISTS idx_product_tag_items_product_id ON product_tag_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_items_tag_id ON product_tag_items(tag_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event_type ON product_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_analytics_created_at ON product_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Enable RLS on new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variants
CREATE POLICY "Anyone can view product variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Users can manage variants for own products" ON product_variants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_variants.product_id 
    AND products.user_id = auth.uid()
  )
);

-- RLS Policies for product_collections
CREATE POLICY "Anyone can view active collections" ON product_collections FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage collections" ON product_collections FOR ALL USING (false); -- Admin only for now

-- RLS Policies for product_collection_items
CREATE POLICY "Anyone can view collection items" ON product_collection_items FOR SELECT USING (true);
CREATE POLICY "Users can manage collection items for own products" ON product_collection_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_collection_items.product_id 
    AND products.user_id = auth.uid()
  )
);

-- RLS Policies for product_tags
CREATE POLICY "Anyone can view tags" ON product_tags FOR SELECT USING (true);
CREATE POLICY "Users can create tags" ON product_tags FOR INSERT WITH CHECK (true);

-- RLS Policies for product_tag_items
CREATE POLICY "Anyone can view product tags" ON product_tag_items FOR SELECT USING (true);
CREATE POLICY "Users can manage tags for own products" ON product_tag_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_tag_items.product_id 
    AND products.user_id = auth.uid()
  )
);

-- RLS Policies for product_analytics
CREATE POLICY "Users can view own analytics" ON product_analytics FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_analytics.product_id 
    AND products.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can insert analytics" ON product_analytics FOR INSERT WITH CHECK (true);

-- RLS Policies for wishlists
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (user_id = auth.uid());

-- Function to update product rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total reviews for the product
  UPDATE products 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND moderation_status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND moderation_status = 'approved'
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for product rating updates
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_tags 
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_tags 
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag usage count
DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON product_tag_items;
CREATE TRIGGER trigger_update_tag_usage_count
  AFTER INSERT OR DELETE ON product_tag_items
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to generate SKU automatically
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate SKU if not provided
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku = 'PRD-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for SKU generation
DROP TRIGGER IF EXISTS trigger_generate_product_sku ON products;
CREATE TRIGGER trigger_generate_product_sku
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION generate_product_sku();

-- Insert some default collections for adult products
INSERT INTO product_collections (name, slug, description, is_featured, sort_order) VALUES
('Featured Products', 'featured', 'Our most popular and highest-rated products', true, 1),
('New Arrivals', 'new-arrivals', 'Latest products added to our collection', true, 2),
('Best Sellers', 'best-sellers', 'Top-selling products this month', true, 3),
('Premium Collection', 'premium', 'High-end luxury products', false, 4),
('Beginner Friendly', 'beginner-friendly', 'Perfect for those new to adult products', false, 5),
('Couples Collection', 'couples', 'Products designed for couples to enjoy together', false, 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert common tags for adult products
INSERT INTO product_tags (name, slug, description) VALUES
('Premium', 'premium', 'High-quality premium products'),
('Beginner', 'beginner', 'Suitable for beginners'),
('Advanced', 'advanced', 'For experienced users'),
('Couples', 'couples', 'Designed for couples'),
('Solo', 'solo', 'For individual use'),
('Waterproof', 'waterproof', 'Water-resistant products'),
('Rechargeable', 'rechargeable', 'USB or wireless charging'),
('Quiet', 'quiet', 'Discreet and quiet operation'),
('Travel Size', 'travel-size', 'Compact and portable'),
('Body Safe', 'body-safe', 'Made with body-safe materials')
ON CONFLICT (slug) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE product_variants IS 'Product variations (size, color, etc.)';
COMMENT ON TABLE product_collections IS 'Curated collections of products';
COMMENT ON TABLE product_tags IS 'Searchable tags for products';
COMMENT ON TABLE product_analytics IS 'Product interaction tracking';
COMMENT ON TABLE wishlists IS 'User wishlist/favorites';

-- Show completion status
SELECT 
  'Enhanced product management schema created! 🎉' as status,
  'Added variants, collections, tags, analytics, and wishlist support.' as message;
