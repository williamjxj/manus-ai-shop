#!/usr/bin/env node

/**
 * Clean Up All Storage Buckets Script
 * 
 * This script deletes all files from storage buckets for fresh testing
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

async function cleanupStorageBucket(bucketName) {
  try {
    console.log(`🗑️  Cleaning up ${bucketName} bucket...`)
    
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { 
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.log(`⚠️  Could not list files in ${bucketName}:`, listError.message)
      return false
    }

    if (!files || files.length === 0) {
      console.log(`✅ ${bucketName} bucket is already empty`)
      return true
    }

    console.log(`📁 Found ${files.length} files in ${bucketName}`)

    // Delete files in batches to avoid timeout
    const batchSize = 50
    let deletedCount = 0

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const filePaths = batch.map(file => file.name)
      
      console.log(`   Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(files.length/batchSize)} (${filePaths.length} files)...`)
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths)

      if (deleteError) {
        console.error(`❌ Error deleting batch from ${bucketName}:`, deleteError)
        // Continue with next batch
      } else {
        deletedCount += filePaths.length
        console.log(`   ✅ Deleted ${filePaths.length} files`)
      }
    }

    console.log(`✅ Deleted ${deletedCount}/${files.length} files from ${bucketName}`)
    return true

  } catch (error) {
    console.error(`❌ Unexpected error cleaning ${bucketName}:`, error)
    return false
  }
}

async function cleanupAllStorageBuckets() {
  try {
    console.log('🚀 Starting storage buckets cleanup...\n')

    // Get list of all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return false
    }

    console.log('📁 Available storage buckets:')
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`)
    })

    console.log('\n🗑️  Starting cleanup...')

    // Clean up each bucket
    let successCount = 0
    for (const bucket of buckets) {
      const success = await cleanupStorageBucket(bucket.id)
      if (success) successCount++
      console.log('') // Add spacing between buckets
    }

    console.log('📋 Cleanup Summary:')
    console.log(`   ✅ Successfully cleaned: ${successCount}/${buckets.length} buckets`)
    
    if (successCount === buckets.length) {
      console.log('\n🎉 All storage buckets cleaned successfully!')
      console.log('✨ Ready for fresh testing!')
    } else {
      console.log('\n⚠️  Some buckets had issues. Check the logs above.')
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error)
    return false
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...')

    const { data: buckets } = await supabase.storage.listBuckets()
    
    for (const bucket of buckets) {
      const { data: files } = await supabase.storage
        .from(bucket.id)
        .list('', { limit: 10 })

      const fileCount = files ? files.length : 0
      console.log(`📊 ${bucket.id}: ${fileCount} files remaining`)
    }

    return true

  } catch (error) {
    console.error('❌ Error verifying cleanup:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Storage Buckets Cleanup Tool\n')
  console.log('⚠️  WARNING: This will delete ALL files from ALL storage buckets!')
  console.log('🔄 Starting cleanup in 3 seconds...\n')
  
  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000))

  const success = await cleanupAllStorageBuckets()
  
  if (success) {
    await verifyCleanup()
    
    console.log('\n✨ Storage cleanup complete!')
    console.log('📋 Next steps:')
    console.log('   1. Go to /upload page')
    console.log('   2. Test uploading new images and videos')
    console.log('   3. Verify thumbnails are generated properly')
  } else {
    console.log('\n❌ Cleanup failed. Please check the errors above.')
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the cleanup
main().catch(console.error)
