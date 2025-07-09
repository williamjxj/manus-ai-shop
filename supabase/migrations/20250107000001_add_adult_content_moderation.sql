-- =====================================================
-- Adult Content Moderation & Metadata Migration
-- =====================================================
-- Adds content moderation fields and adult content specific metadata

-- Add content moderation and adult content fields to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  ADD COLUMN IF NOT EXISTS content_warnings TEXT[], -- Array of content warning tags
  ADD COLUMN IF NOT EXISTS age_restriction INTEGER DEFAULT 18 CHECK (age_restriction >= 18),
  ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Product owner
  ADD COLUMN IF NOT EXISTS tags TEXT[], -- Searchable tags
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;

-- Add content moderation and preferences to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS content_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_content_creator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"discrete_billing": true, "anonymous_reviews": false}';

-- Create content_reports table for user reporting
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate', 'copyright', 'spam', 'illegal', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reporter_id, product_id) -- Prevent duplicate reports from same user
);

-- Create product_reviews table for user reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES auth.users(id),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id) -- One review per user per product
);

-- Create review_votes table for helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Create content_warnings lookup table
CREATE TABLE IF NOT EXISTS content_warning_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warning_code TEXT NOT NULL UNIQUE,
  warning_label TEXT NOT NULL,
  warning_description TEXT,
  severity_level INTEGER DEFAULT 1 CHECK (severity_level >= 1 AND severity_level <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard content warning types
INSERT INTO content_warning_types (warning_code, warning_label, warning_description, severity_level) VALUES
('nudity', 'Nudity', 'Contains full or partial nudity', 3),
('sexual-content', 'Sexual Content', 'Contains explicit sexual content', 4),
('fetish', 'Fetish Content', 'Contains fetish or kink related content', 4),
('bdsm', 'BDSM', 'Contains BDSM or bondage content', 4),
('violence', 'Violence', 'Contains violent or aggressive content', 5),
('substance-use', 'Substance Use', 'Contains drug or alcohol use', 2),
('mature-themes', 'Mature Themes', 'Contains mature themes and situations', 2),
('fantasy', 'Fantasy Content', 'Contains fantasy or fictional scenarios', 1)
ON CONFLICT (warning_code) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_reports
CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Create RLS policies for product_reviews
CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Users can view own reviews" ON product_reviews
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create reviews" ON product_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON product_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for review_votes
CREATE POLICY "Users can view all votes" ON review_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON review_votes
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_moderation_status ON products(moderation_status);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, moderation_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);

-- Create function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count +
      CASE WHEN NEW.is_helpful THEN 1 ELSE 0 END -
      CASE WHEN OLD.is_helpful THEN 1 ELSE 0 END
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE 0 END
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review helpful count
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_votes;
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Create function to update product stats
CREATE OR REPLACE FUNCTION update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'order_items' THEN
    UPDATE products
    SET purchase_count = purchase_count + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product purchase count
DROP TRIGGER IF EXISTS trigger_update_product_purchase_count ON order_items;
CREATE TRIGGER trigger_update_product_purchase_count
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stats();

-- Update existing products to have approved status for backward compatibility
UPDATE products
SET moderation_status = 'approved',
    moderated_at = NOW(),
    is_explicit = true,
    age_restriction = 18
WHERE moderation_status IS NULL OR moderation_status = 'pending';

-- Add comments for documentation
COMMENT ON COLUMN products.moderation_status IS 'Content moderation status: pending, approved, rejected, flagged';
COMMENT ON COLUMN products.content_warnings IS 'Array of content warning codes';
COMMENT ON COLUMN products.age_restriction IS 'Minimum age required to view content (18+)';
COMMENT ON COLUMN products.is_explicit IS 'Whether content contains explicit adult material';
COMMENT ON COLUMN products.user_id IS 'ID of the user who uploaded this product';
COMMENT ON COLUMN profiles.age_verified IS 'Whether user has completed age verification';
COMMENT ON COLUMN profiles.content_preferences IS 'User content filtering preferences';
COMMENT ON COLUMN profiles.privacy_settings IS 'User privacy and billing preferences';
COMMENT ON TABLE content_reports IS 'User reports for inappropriate content';
COMMENT ON TABLE product_reviews IS 'User reviews and ratings for products';
COMMENT ON TABLE content_warning_types IS 'Standardized content warning types and labels';
