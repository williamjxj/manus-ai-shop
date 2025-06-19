# 🗂️ Storage Bucket Setup for Upload Feature

## Quick Setup Guide

To enable the upload feature, you need to create the storage bucket in your Supabase instance.

### For Local Supabase Development:

1. **Run the storage setup script:**

   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/setup-storage-bucket.sql
   ```

2. **Verify the setup:**
   - Check that the `product-images` bucket was created
   - Confirm public access is enabled
   - Test upload functionality at `/upload`

### For Production/Remote Supabase:

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage section**
3. **Run the SQL from `supabase/setup-storage-bucket.sql` in the SQL Editor**

### What the Script Does:

- ✅ Creates `product-images` storage bucket
- ✅ Sets up public access for viewing images
- ✅ Configures upload policies for authenticated users
- ✅ Sets file size limit to 10MB
- ✅ Restricts to image file types (JPEG, PNG, GIF, WebP)

### Testing the Setup:

1. Navigate to `/upload` page
2. Login with your account
3. Try uploading an image
4. Check that the image appears in `/products`

### Troubleshooting:

**If upload fails with "bucket not found":**

- Run the storage setup script
- Check Supabase dashboard for bucket existence

**If images don't display:**

- Verify Next.js image configuration (already done)
- Check that bucket has public access enabled

The upload feature should now work perfectly! 🚀
