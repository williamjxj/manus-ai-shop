-- =====================================================
-- Add Missing Thumbnail Storage Policies
-- =====================================================
-- This script adds the missing RLS policies for the thumbnails bucket

-- First, check if policies already exist and drop them if they do
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete thumbnails" ON storage.objects;

-- Policy: Allow public read access to thumbnails
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to upload thumbnails  
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.role() = 'authenticated'
  );

-- Policy: Allow authenticated users to update thumbnails
CREATE POLICY "Authenticated users can update thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

-- Policy: Allow authenticated users to delete thumbnails
CREATE POLICY "Authenticated users can delete thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

-- Alternative: More permissive policies if the above are too restrictive
-- Uncomment these if you need less restrictive access:

-- DROP POLICY IF EXISTS "Anyone can access thumbnails" ON storage.objects;
-- CREATE POLICY "Anyone can access thumbnails" ON storage.objects
--   FOR ALL USING (bucket_id = 'thumbnails');

-- Show completion
SELECT 'Thumbnail storage policies created successfully! 🎉' as status;
