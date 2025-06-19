-- =====================================================
-- Supabase Storage Bucket Setup for Product Images
-- =====================================================
-- This script sets up the storage bucket for product image uploads
-- =====================================================

-- =====================================================
-- Create Storage Bucket
-- =====================================================

-- Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- Public bucket for product images
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']  -- Allowed image types
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- Storage Policies for Product Images
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their uploads" ON storage.objects;

-- Allow public access to view product images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update their uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete their uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Verification
-- =====================================================

-- Check if bucket was created successfully
SELECT 
  'Storage Bucket Check' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ product-images bucket exists'
    ELSE '❌ Bucket not found'
  END as result
FROM storage.buckets 
WHERE id = 'product-images';

-- Check storage policies
SELECT 
  'Storage Policies Check' as test,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Storage policies configured'
    ELSE '❌ Missing storage policies'
  END as result
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- =====================================================
-- Success Message
-- =====================================================

SELECT 
  '📁 STORAGE BUCKET SETUP COMPLETE! 📁' as status,
  'Product images can now be uploaded to the product-images bucket.' as message,
  'Public access is enabled for viewing images.' as note;

-- =====================================================
-- USAGE NOTES:
-- =====================================================

/*
BUCKET CONFIGURATION:
✅ Bucket Name: product-images
✅ Public Access: Enabled (for viewing images)
✅ File Size Limit: 10MB
✅ Allowed Types: JPEG, PNG, GIF, WebP

SECURITY POLICIES:
✅ Public can view all product images
✅ Authenticated users can upload images
✅ Users can only update/delete their own uploads
✅ Folder-based organization by user ID

UPLOAD PATH STRUCTURE:
- products/{timestamp}-{random}.{ext}
- Example: products/1703123456789-abc123.jpg

API USAGE:
// Upload file
const { data, error } = await supabase.storage
  .from('product-images')
  .upload('products/filename.jpg', file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl('products/filename.jpg')

IMPORTANT:
- Images are publicly accessible once uploaded
- File names should be unique to avoid conflicts
- Consider image optimization before upload
- Monitor storage usage and costs
*/
