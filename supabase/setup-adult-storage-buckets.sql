-- =====================================================
-- Adult Content Storage Buckets Setup
-- =====================================================
-- Creates secure storage buckets for adult content with proper access controls

-- Create adult-images bucket for explicit image content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'adult-images',
  'adult-images',
  true,
  15728640, -- 15MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create adult-videos bucket for explicit video content  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'adult-videos', 
  'adult-videos',
  true,
  209715200, -- 200MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Update existing images bucket for non-explicit content
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'images';

-- Update existing videos bucket for non-explicit content
UPDATE storage.buckets 
SET 
  file_size_limit = 104857600, -- 100MB limit  
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg']
WHERE id = 'videos';

-- =====================================================
-- Storage Policies for Adult Content
-- =====================================================

-- Policy: Allow authenticated users to upload to adult-images bucket
CREATE POLICY "Authenticated users can upload adult images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'adult-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'products'
  );

-- Policy: Allow authenticated users to upload to adult-videos bucket  
CREATE POLICY "Authenticated users can upload adult videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'adult-videos'
    AND auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] = 'products'
  );

-- Policy: Allow public read access to adult-images (with age verification on frontend)
CREATE POLICY "Public read access to adult images" ON storage.objects
  FOR SELECT USING (bucket_id = 'adult-images');

-- Policy: Allow public read access to adult-videos (with age verification on frontend)
CREATE POLICY "Public read access to adult videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'adult-videos');

-- Policy: Allow users to update their own adult content
CREATE POLICY "Users can update own adult images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'adult-images'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can update own adult videos" ON storage.objects  
  FOR UPDATE USING (
    bucket_id = 'adult-videos'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Policy: Allow users to delete their own adult content
CREATE POLICY "Users can delete own adult images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'adult-images'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Users can delete own adult videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'adult-videos' 
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- =====================================================
-- Enhanced Media Files Table for Adult Content
-- =====================================================

-- Add adult content specific columns to media_files table
ALTER TABLE media_files 
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_warnings TEXT[],
  ADD COLUMN IF NOT EXISTS age_restriction INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

-- Create index for content hash (deduplication)
CREATE INDEX IF NOT EXISTS idx_media_files_content_hash ON media_files(content_hash);

-- Create index for moderation status
CREATE INDEX IF NOT EXISTS idx_media_files_moderation_status ON media_files(moderation_status);

-- Create index for user content
CREATE INDEX IF NOT EXISTS idx_media_files_user_explicit ON media_files(user_id, is_explicit);

-- =====================================================
-- Content Deduplication Function
-- =====================================================

-- Function to check for duplicate content
CREATE OR REPLACE FUNCTION check_content_duplication(
  p_content_hash TEXT,
  p_user_id UUID
) RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_file_id UUID,
  existing_user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN true ELSE false END as is_duplicate,
    (SELECT id FROM media_files WHERE content_hash = p_content_hash LIMIT 1) as existing_file_id,
    (SELECT user_id FROM media_files WHERE content_hash = p_content_hash LIMIT 1) as existing_user_id
  FROM media_files 
  WHERE content_hash = p_content_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Storage Usage Tracking
-- =====================================================

-- Create storage_usage table for tracking user storage consumption
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  total_files INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  explicit_files INTEGER DEFAULT 0,
  explicit_size_bytes BIGINT DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bucket_name)
);

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO storage_usage (user_id, bucket_name, total_files, total_size_bytes, explicit_files, explicit_size_bytes)
    VALUES (
      NEW.user_id, 
      NEW.bucket_name, 
      1, 
      NEW.file_size,
      CASE WHEN NEW.is_explicit THEN 1 ELSE 0 END,
      CASE WHEN NEW.is_explicit THEN NEW.file_size ELSE 0 END
    )
    ON CONFLICT (user_id, bucket_name) 
    DO UPDATE SET
      total_files = storage_usage.total_files + 1,
      total_size_bytes = storage_usage.total_size_bytes + NEW.file_size,
      explicit_files = storage_usage.explicit_files + CASE WHEN NEW.is_explicit THEN 1 ELSE 0 END,
      explicit_size_bytes = storage_usage.explicit_size_bytes + CASE WHEN NEW.is_explicit THEN NEW.file_size ELSE 0 END,
      last_updated = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE storage_usage 
    SET 
      total_files = GREATEST(0, total_files - 1),
      total_size_bytes = GREATEST(0, total_size_bytes - OLD.file_size),
      explicit_files = GREATEST(0, explicit_files - CASE WHEN OLD.is_explicit THEN 1 ELSE 0 END),
      explicit_size_bytes = GREATEST(0, explicit_size_bytes - CASE WHEN OLD.is_explicit THEN OLD.file_size ELSE 0 END),
      last_updated = NOW()
    WHERE user_id = OLD.user_id AND bucket_name = OLD.bucket_name;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for storage usage tracking
DROP TRIGGER IF EXISTS trigger_update_storage_usage ON media_files;
CREATE TRIGGER trigger_update_storage_usage
  AFTER INSERT OR DELETE ON media_files
  FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

-- =====================================================
-- RLS Policies for Media Files
-- =====================================================

-- Enable RLS on media_files table
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own media files
CREATE POLICY "Users can view own media files" ON media_files
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own media files  
CREATE POLICY "Users can insert own media files" ON media_files
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own media files
CREATE POLICY "Users can update own media files" ON media_files
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own media files
CREATE POLICY "Users can delete own media files" ON media_files
  FOR DELETE USING (user_id = auth.uid());

-- Policy: Moderators can view all media files (for moderation)
CREATE POLICY "Moderators can view all media files" ON media_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- =====================================================
-- Storage Bucket Comments
-- =====================================================

COMMENT ON TABLE storage_usage IS 'Tracks storage usage per user and bucket for quota management';
COMMENT ON COLUMN media_files.content_hash IS 'SHA-256 hash of file content for deduplication';
COMMENT ON COLUMN media_files.is_explicit IS 'Whether the content contains explicit adult material';
COMMENT ON COLUMN media_files.content_warnings IS 'Array of content warning codes';
COMMENT ON COLUMN media_files.age_restriction IS 'Minimum age required to view content';
COMMENT ON COLUMN media_files.moderation_status IS 'Content moderation status';

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant usage on storage schema to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions on new tables
GRANT ALL ON storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_content_duplication(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_storage_usage() TO authenticated;
