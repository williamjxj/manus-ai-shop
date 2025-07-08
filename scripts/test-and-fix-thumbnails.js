#!/usr/bin/env node

/**
 * Test and Fix Thumbnail Upload Issues
 * 
 * This script tests thumbnail upload and provides solutions for RLS issues
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testThumbnailUpload() {
  try {
    console.log('🧪 Testing thumbnail upload...')

    // Create a small test image blob (1x1 pixel JPEG)
    const testImageData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x80, 0xFF, 0xD9
    ])

    const testBlob = new Blob([testImageData], { type: 'image/jpeg' })
    const testFileName = `test-thumbnail-${Date.now()}.jpg`
    const testPath = `thumbnails/${testFileName}`

    console.log(`   📁 Uploading test file: ${testPath}`)

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(testPath, testBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      })

    if (uploadError) {
      console.log(`   ❌ Upload failed: ${uploadError.message}`)
      
      if (uploadError.message.includes('row-level security') || 
          uploadError.message.includes('policy') ||
          uploadError.statusCode === '403') {
        console.log('   🔧 This is a Row Level Security (RLS) policy issue')
        return { success: false, needsPolicyFix: true, error: uploadError }
      } else {
        console.log('   🔧 This is a different issue (not RLS)')
        return { success: false, needsPolicyFix: false, error: uploadError }
      }
    } else {
      console.log('   ✅ Upload successful!')
      
      // Clean up test file
      await supabase.storage.from('thumbnails').remove([testPath])
      console.log('   🧹 Test file cleaned up')
      
      return { success: true, needsPolicyFix: false }
    }

  } catch (error) {
    console.error('❌ Unexpected error during test:', error)
    return { success: false, needsPolicyFix: false, error }
  }
}

async function checkCurrentPolicies() {
  try {
    console.log('🔍 Checking current storage policies...')

    // Try to get policies using a simple query
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return false
    }

    const thumbnailsBucket = buckets.find(b => b.id === 'thumbnails')
    
    if (!thumbnailsBucket) {
      console.log('❌ Thumbnails bucket does not exist!')
      return false
    }

    console.log(`✅ Thumbnails bucket exists (public: ${thumbnailsBucket.public})`)
    return true

  } catch (error) {
    console.error('❌ Error checking policies:', error)
    return false
  }
}

async function provideSolution() {
  console.log('\n🛠️  SOLUTION:')
  console.log('='.repeat(50))
  console.log('The thumbnail upload is failing due to Row Level Security (RLS) policies.')
  console.log('\n📋 To fix this issue:')
  console.log('\n1. 🗄️  Go to your Supabase Dashboard')
  console.log('2. 📝 Navigate to SQL Editor')
  console.log('3. 📋 Copy and paste the following SQL:')
  
  console.log('\n' + '='.repeat(50))
  console.log(`
-- Fix Thumbnail Upload Policies
DROP POLICY IF EXISTS "Public read access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete thumbnails" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails'
    AND auth.role() = 'authenticated'
  );

SELECT 'Thumbnail policies fixed! 🎉' as status;
  `)
  console.log('='.repeat(50))
  
  console.log('\n4. ▶️  Click "Run" to execute the SQL')
  console.log('5. 🧪 Test uploading a product with images again')
  console.log('\n💡 Alternative: You can also run the SQL file:')
  console.log('   📁 supabase/fix-thumbnail-upload-policies.sql')
}

async function main() {
  console.log('🚀 Thumbnail Upload Diagnostic Tool\n')

  // Check current setup
  const policiesOk = await checkCurrentPolicies()
  
  if (!policiesOk) {
    console.log('\n❌ Basic setup issues detected.')
    await provideSolution()
    return
  }

  // Test upload
  const testResult = await testThumbnailUpload()

  if (testResult.success) {
    console.log('\n🎉 Thumbnail upload is working correctly!')
    console.log('✨ The RLS policies are properly configured.')
    console.log('\n📋 If you\'re still getting errors:')
    console.log('   1. Make sure you\'re logged in when uploading')
    console.log('   2. Check browser console for additional errors')
    console.log('   3. Verify the file format is supported (JPEG, PNG, WebP)')
  } else if (testResult.needsPolicyFix) {
    console.log('\n❌ Thumbnail upload failed due to RLS policy issues.')
    await provideSolution()
  } else {
    console.log('\n❌ Thumbnail upload failed for other reasons:')
    console.log(`   Error: ${testResult.error?.message || 'Unknown error'}`)
    console.log('\n🔧 This might be:')
    console.log('   - Network connectivity issue')
    console.log('   - Bucket configuration problem')
    console.log('   - File format/size issue')
  }
}

// Run the diagnostic
main().catch(console.error)
