-- =====================================================
-- AI Shop - Media Support Migration
-- =====================================================
-- This migration adds support for both images and videos in products

-- Update products table to support multiple media types
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER; -- For videos

-- Update existing products to use new schema
UPDATE products 
SET 
  media_type = 'image',
  media_url = image_url
WHERE media_url IS NULL;

-- Make image_url nullable since we now have media_url
ALTER TABLE products ALTER COLUMN image_url DROP NOT NULL;

-- Create media_files table for better organization
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  bucket_name TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT, -- For video thumbnails
  duration_seconds INTEGER, -- For videos
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on media_files
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media_files
CREATE POLICY "Users can view all media files" ON media_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload media files" ON media_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media files" ON media_files FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media files" ON media_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_media_type ON products(media_type);

-- Create function to update media_files updated_at
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for media_files updated_at
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW EXECUTE FUNCTION update_media_files_updated_at();

-- Insert sample video products
INSERT INTO products (name, description, media_url, media_type, price_cents, points_price, category) VALUES
('AI Animation Demo', 'A stunning AI-generated animation showcasing futuristic technology', 'https://example.com/sample-video.mp4', 'video', 2999, 150, 'animation'),
('Digital Art Timelapse', 'Watch the creation of digital art in this mesmerizing timelapse', 'https://example.com/timelapse.mp4', 'video', 1999, 100, 'timelapse')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE media_files IS 'Stores metadata for uploaded media files (images and videos)';
COMMENT ON COLUMN products.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN products.media_url IS 'URL to the main media file (replaces image_url for new products)';
COMMENT ON COLUMN products.thumbnail_url IS 'URL to thumbnail image (especially useful for videos)';
COMMENT ON COLUMN products.duration_seconds IS 'Duration in seconds for video content';
