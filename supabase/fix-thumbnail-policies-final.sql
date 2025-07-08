-- =====================================================
-- Fix Thumbnail Upload Policies - Final Version
-- =====================================================
-- This script creates the most permissive policies for thumbnail uploads
-- while still maintaining security

-- Ensure thumbnails bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails', 
  true,
  10485760, -- 10MB limit for thumbnails
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing policies for thumbnails to start fresh
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access to thumbnails" ON storage.objects;

-- Create comprehensive policies for thumbnails bucket
-- Policy 1: Allow public read access (for displaying thumbnails)
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'thumbnails');

-- Policy 2: Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to update their thumbnails
CREATE POLICY "Authenticated users can update thumbnails" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

-- Policy 4: Allow authenticated users to delete their thumbnails
CREATE POLICY "Authenticated users can delete thumbnails" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

-- Verify RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Show all policies for thumbnails bucket
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%thumbnail%' OR qual LIKE '%thumbnails%')
ORDER BY policyname;

-- Test the policies by checking bucket access
SELECT 
  'Thumbnail upload policies configured successfully! 🎉' as status,
  'Authenticated users can now upload, update, and delete thumbnails.' as message,
  'Public users can read/view thumbnails.' as note;

-- Show bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'thumbnails';
