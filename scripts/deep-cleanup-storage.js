#!/usr/bin/env node

/**
 * Deep Storage Cleanup Script
 * 
 * This script performs a thorough cleanup of storage buckets including nested folders
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

async function listAllFilesRecursively(bucketName, folder = '', allFiles = []) {
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(folder, { 
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.log(`⚠️  Error listing files in ${bucketName}/${folder}:`, error.message)
      return allFiles
    }

    if (!files || files.length === 0) {
      return allFiles
    }

    for (const file of files) {
      const fullPath = folder ? `${folder}/${file.name}` : file.name
      
      if (file.id === null) {
        // This is a folder, recurse into it
        console.log(`📁 Found folder: ${fullPath}`)
        await listAllFilesRecursively(bucketName, fullPath, allFiles)
      } else {
        // This is a file
        allFiles.push(fullPath)
      }
    }

    return allFiles
  } catch (error) {
    console.error(`❌ Error in recursive listing for ${bucketName}:`, error)
    return allFiles
  }
}

async function deepCleanupBucket(bucketName) {
  try {
    console.log(`🔍 Deep scanning ${bucketName} bucket...`)
    
    // Get all files recursively
    const allFiles = await listAllFilesRecursively(bucketName)

    if (allFiles.length === 0) {
      console.log(`✅ ${bucketName} bucket is empty`)
      return true
    }

    console.log(`📁 Found ${allFiles.length} files in ${bucketName}:`)
    allFiles.forEach((file, index) => {
      if (index < 10) { // Show first 10 files
        console.log(`   - ${file}`)
      } else if (index === 10) {
        console.log(`   ... and ${allFiles.length - 10} more files`)
      }
    })

    // Delete files in batches
    const batchSize = 50
    let deletedCount = 0

    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize)
      
      console.log(`   Deleting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allFiles.length/batchSize)} (${batch.length} files)...`)
      
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(batch)

      if (deleteError) {
        console.error(`❌ Error deleting batch from ${bucketName}:`, deleteError)
        // Try individual file deletion for this batch
        console.log(`   🔄 Trying individual file deletion...`)
        for (const filePath of batch) {
          const { error: singleDeleteError } = await supabase.storage
            .from(bucketName)
            .remove([filePath])
          
          if (!singleDeleteError) {
            deletedCount++
          } else {
            console.log(`   ❌ Failed to delete: ${filePath} - ${singleDeleteError.message}`)
          }
        }
      } else {
        deletedCount += batch.length
        console.log(`   ✅ Deleted ${batch.length} files`)
      }
    }

    console.log(`✅ Deleted ${deletedCount}/${allFiles.length} files from ${bucketName}`)
    return deletedCount === allFiles.length

  } catch (error) {
    console.error(`❌ Unexpected error cleaning ${bucketName}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Deep Storage Cleanup Tool\n')
  console.log('🔍 This will perform a thorough cleanup including nested folders')
  console.log('⚠️  WARNING: This will delete ALL files from ALL storage buckets!')
  console.log('🔄 Starting deep cleanup in 3 seconds...\n')
  
  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    // Get list of all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }

    console.log('📁 Available storage buckets:')
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`)
    })

    console.log('\n🗑️  Starting deep cleanup...')

    // Clean up each bucket
    let successCount = 0
    for (const bucket of buckets) {
      const success = await deepCleanupBucket(bucket.id)
      if (success) successCount++
      console.log('') // Add spacing between buckets
    }

    // Final verification
    console.log('🔍 Final verification...')
    for (const bucket of buckets) {
      const finalFiles = await listAllFilesRecursively(bucket.id)
      console.log(`📊 ${bucket.id}: ${finalFiles.length} files remaining`)
      
      if (finalFiles.length > 0) {
        console.log(`   Remaining files in ${bucket.id}:`)
        finalFiles.forEach(file => console.log(`     - ${file}`))
      }
    }

    console.log('\n📋 Deep Cleanup Summary:')
    console.log(`   ✅ Successfully cleaned: ${successCount}/${buckets.length} buckets`)
    
    if (successCount === buckets.length) {
      console.log('\n🎉 All storage buckets deeply cleaned!')
      console.log('✨ Ready for fresh testing!')
    } else {
      console.log('\n⚠️  Some buckets still have files. Check the logs above.')
    }

  } catch (error) {
    console.error('❌ Unexpected error during deep cleanup:', error)
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the deep cleanup
main().catch(console.error)
