-- =====================================================
-- Fix Thumbnails Storage Bucket
-- =====================================================
-- Creates the missing thumbnails bucket and proper RLS policies

-- Create thumbnails bucket for thumbnail images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails', 
  true,
  5242880, -- 5MB limit (thumbnails should be smaller)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies for Thumbnails Bucket
-- =====================================================

-- Policy: Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.role() = 'authenticated'
  );

-- Policy: Allow public read access to thumbnails
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

-- Policy: Allow users to update their own thumbnails
CREATE POLICY "Users can update own thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow users to delete their own thumbnails
CREATE POLICY "Users can delete own thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Alternative: More permissive policies if needed
-- =====================================================

-- If the above policies are too restrictive, use these instead:

-- Policy: Allow anyone to upload thumbnails (less secure but more permissive)
-- CREATE POLICY "Anyone can upload thumbnails" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

-- Policy: Allow authenticated users to manage any thumbnails
-- CREATE POLICY "Authenticated users can manage thumbnails" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'thumbnails' 
--     AND auth.role() = 'authenticated'
--   );

-- Show completion status
SELECT 
  'Thumbnails bucket created successfully! 🎉' as status,
  'Thumbnail storage policies configured.' as message;
