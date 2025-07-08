-- =====================================================
-- Fix Thumbnail Upload Policies
-- =====================================================
-- This script fixes the RLS policies for thumbnail uploads

-- First, check if the thumbnails bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails', 
  true,
  5242880, -- 5MB limit (thumbnails should be smaller)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload thumbnails" ON storage.objects;

-- Create permissive policies for thumbnails bucket
-- Policy: Allow public read access to thumbnails
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to upload thumbnails (most permissive)
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

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%thumbnail%'
ORDER BY policyname;

-- Show completion status
SELECT 
  'Thumbnail upload policies fixed! 🎉' as status,
  'Authenticated users can now upload thumbnails.' as message;
