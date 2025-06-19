# Upload Feature Setup Guide

This guide will help you set up the complete upload feature for your AI Shop application.

## 🎯 Overview

The upload feature allows authenticated users to:

- Upload AI-generated images to Supabase storage
- Add product details (name, description, pricing)
- Categorize products
- Automatically save products to the database

## 📋 Prerequisites

1. ✅ Local or Remote Supabase instance running
2. ✅ Authentication system working
3. ✅ Products table exists in database
4. ⚠️ **Storage bucket needs to be created**

## 🚀 Setup Instructions

### Step 1: Create Storage Bucket

**For Local Supabase:**

```bash
# Run the storage setup script
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/setup-storage-bucket.sql
```

**For Remote Supabase:**

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Run the SQL from `supabase/setup-storage-bucket.sql` in the SQL Editor

### Step 2: Verify Storage Setup

After running the setup script, you should see:

- ✅ `product-images` bucket created
- ✅ Public access enabled for viewing
- ✅ Upload policies for authenticated users
- ✅ File size limit: 10MB
- ✅ Allowed types: JPEG, PNG, GIF, WebP

### Step 3: Test Upload Feature

1. **Navigate to Upload Page:**

   ```
   http://localhost:3000/upload
   ```

2. **Login Required:**

   - Only authenticated users can access upload
   - Redirects to login if not authenticated

3. **Upload Process:**
   - Drag & drop or click to select image
   - Fill in product details
   - Submit form
   - Redirects to products page on success

## 🔧 Technical Implementation

### File Structure

```
src/
├── app/upload/page.tsx          # Main upload page
├── lib/upload-utils.ts          # Upload utility functions
└── components/Navbar.tsx        # Updated with Upload link

supabase/
├── setup-storage-bucket.sql     # Storage bucket setup
└── UPLOAD_FEATURE_SETUP.md     # This guide
```

### Key Features

#### 🖼️ **Image Upload**

- Drag & drop interface
- File validation (type, size)
- Image preview
- Compression utilities available

#### 📝 **Product Form**

- Name (required, unique)
- Description (required)
- Price in cents (e.g., 999 = $9.99)
- Points price (alternative pricing)
- Category selection (8 categories available)

#### 🔒 **Security**

- Authentication required
- File type validation
- Size limits (10MB)
- RLS policies on storage

#### 🎨 **User Experience**

- Real-time price formatting
- Loading states
- Error handling
- Success feedback
- Responsive design

## 📊 Database Schema

The upload feature uses the existing `products` table:

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  points_price INTEGER NOT NULL,
  category TEXT DEFAULT 'ai-art',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🗂️ Storage Structure

Images are stored in the following structure:

```
product-images/
└── products/
    ├── 1703123456789-abc123.jpg
    ├── 1703123456790-def456.png
    └── ...
```

## 🔍 Troubleshooting

### Common Issues

**1. Storage Bucket Not Found**

```
Error: The resource was not found
```

**Solution:** Run the storage setup script

**2. Upload Permission Denied**

```
Error: new row violates row-level security policy
```

**Solution:** Ensure user is authenticated and policies are set up

**3. File Too Large**

```
Error: Image size must be less than 10MB
```

**Solution:** Compress image or use smaller file

**4. Invalid File Type**

```
Error: Please select a valid image file
```

**Solution:** Use JPEG, PNG, GIF, or WebP format

### Debug Steps

1. **Check Authentication:**

   ```javascript
   const {
     data: { user },
   } = await supabase.auth.getUser()
   console.log('User:', user)
   ```

2. **Check Storage Bucket:**

   ```sql
   SELECT * FROM storage.buckets WHERE id = 'product-images';
   ```

3. **Check Storage Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'storage';
   ```

## 🎉 Success Indicators

When everything is working correctly:

1. ✅ Upload page loads without errors
2. ✅ Image drag & drop works
3. ✅ Form validation works
4. ✅ Upload progress shows
5. ✅ Success message appears
6. ✅ New product appears in products page
7. ✅ Image displays correctly

## 🔄 Next Steps

After setup is complete:

1. **Test with different image formats**
2. **Test file size limits**
3. **Test authentication flow**
4. **Add image optimization (optional)**
5. **Monitor storage usage**

## 📞 Support

If you encounter issues:

1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify storage bucket exists
4. Ensure authentication is working
5. Test with a fresh browser session

The upload feature is now ready for production use! 🚀
