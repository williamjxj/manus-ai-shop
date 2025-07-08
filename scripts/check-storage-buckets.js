#!/usr/bin/env node

/**
 * Check Storage Buckets and Policies
 * 
 * This script checks what storage buckets exist and their policies
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

async function checkStorageBuckets() {
  try {
    console.log('🔍 Checking storage buckets...\n')

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return false
    }

    console.log('📁 Available storage buckets:')
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`)
    })

    // Check specific buckets we need
    const requiredBuckets = ['products', 'thumbnails', 'media']
    const existingBucketIds = buckets.map(b => b.id)

    console.log('\n📋 Required buckets status:')
    requiredBuckets.forEach(bucketId => {
      const exists = existingBucketIds.includes(bucketId)
      console.log(`   ${exists ? '✅' : '❌'} ${bucketId}`)
    })

    // Test access to each bucket
    console.log('\n🧪 Testing bucket access:')
    for (const bucketId of existingBucketIds) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(bucketId)
          .list('', { limit: 1 })

        if (listError) {
          console.log(`   ❌ ${bucketId}: ${listError.message}`)
        } else {
          console.log(`   ✅ ${bucketId}: Accessible (${files.length} files visible)`)
        }
      } catch (error) {
        console.log(`   ❌ ${bucketId}: ${error.message}`)
      }
    }

    // Test thumbnail upload specifically
    console.log('\n🖼️  Testing thumbnail upload capability...')
    
    try {
      // Create a small test blob
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testFileName = `test-${Date.now()}.txt`
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(testFileName, testBlob, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.log(`   ❌ Upload test failed: ${uploadError.message}`)
        
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          console.log('   🔧 This is likely a Row Level Security policy issue')
          console.log('   💡 Solution: Run the thumbnail policies SQL script')
        }
      } else {
        console.log('   ✅ Upload test successful')
        
        // Clean up test file
        await supabase.storage.from('thumbnails').remove([testFileName])
        console.log('   🧹 Test file cleaned up')
      }
    } catch (error) {
      console.log(`   ❌ Upload test error: ${error.message}`)
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting storage bucket check...\n')

  const success = await checkStorageBuckets()

  if (success) {
    console.log('\n📋 Summary:')
    console.log('   - If thumbnails bucket is missing: Create it manually in Supabase Dashboard')
    console.log('   - If upload fails with RLS error: Run supabase/fix-thumbnails-bucket.sql')
    console.log('   - Check Supabase Dashboard → Storage → Policies for current policies')
  } else {
    console.log('\n❌ Storage check failed.')
  }
}

// Run the check
main().catch(console.error)
