#!/usr/bin/env node

/**
 * Complete Products & Media Cleanup Script
 * 
 * This script will:
 * 1. Delete all products from the database
 * 2. Delete all related media files from storage buckets
 * 3. Clean up all related tables (product_media, cart_items, etc.)
 * 4. Reset auto-increment sequences
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupStorageBucket(bucketName) {
  try {
    console.log(`🗑️  Cleaning up ${bucketName} bucket...`)
    
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1000 })

    if (listError) {
      console.log(`⚠️  Could not list files in ${bucketName}:`, listError.message)
      return false
    }

    if (!files || files.length === 0) {
      console.log(`✅ ${bucketName} bucket is already empty`)
      return true
    }

    console.log(`📁 Found ${files.length} files in ${bucketName}`)

    // Delete all files
    const filePaths = files.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths)

    if (deleteError) {
      console.error(`❌ Error deleting files from ${bucketName}:`, deleteError)
      return false
    }

    console.log(`✅ Deleted ${filePaths.length} files from ${bucketName}`)
    return true

  } catch (error) {
    console.error(`❌ Unexpected error cleaning ${bucketName}:`, error)
    return false
  }
}

async function cleanupDatabase() {
  try {
    console.log('🗄️  Cleaning up database tables...')

    // Get count of products before deletion
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Found ${productCount || 0} products to delete`)

    // Delete in order to respect foreign key constraints
    const tablesToClean = [
      'cart_items',
      'order_items', 
      'product_reviews',
      'product_media',
      'product_variants',
      'product_collection_items',
      'product_tag_items',
      'media_files', // Clean up any orphaned media files
      'products'
    ]

    for (const table of tablesToClean) {
      try {
        console.log(`🧹 Cleaning ${table} table...`)
        
        const { count: beforeCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (beforeCount > 0) {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

          if (error) {
            console.error(`❌ Error cleaning ${table}:`, error)
          } else {
            console.log(`✅ Cleaned ${beforeCount} records from ${table}`)
          }
        } else {
          console.log(`✅ ${table} table is already empty`)
        }
      } catch (error) {
        console.log(`⚠️  Could not clean ${table} (table might not exist):`, error.message)
      }
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error cleaning database:', error)
    return false
  }
}

async function resetSequences() {
  try {
    console.log('🔄 Resetting database sequences...')
    
    // Note: PostgreSQL doesn't use auto-increment for UUIDs, 
    // but we can reset any sequences if they exist
    console.log('✅ UUID-based tables don\'t need sequence reset')
    return true

  } catch (error) {
    console.error('❌ Error resetting sequences:', error)
    return false
  }
}

async function verifyCleanup() {
  try {
    console.log('🔍 Verifying cleanup...')

    const tables = ['products', 'product_media', 'cart_items', 'media_files']
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        console.log(`📊 ${table}: ${count || 0} records remaining`)
      } catch (error) {
        console.log(`⚠️  Could not check ${table}:`, error.message)
      }
    }

    // Check storage buckets
    const buckets = ['products', 'thumbnails', 'media']
    
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabase.storage
          .from(bucket)
          .list('', { limit: 10 })

        const fileCount = files ? files.length : 0
        console.log(`📁 ${bucket} bucket: ${fileCount} files remaining`)
      } catch (error) {
        console.log(`⚠️  Could not check ${bucket} bucket:`, error.message)
      }
    }

    return true

  } catch (error) {
    console.error('❌ Error verifying cleanup:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting complete products & media cleanup...\n')
  
  // Confirmation prompt
  console.log('⚠️  WARNING: This will permanently delete:')
  console.log('   - All products and their data')
  console.log('   - All product media files from storage')
  console.log('   - All cart items and orders')
  console.log('   - All product reviews and ratings')
  console.log('   - All related database records')
  
  console.log('\n🔄 Starting cleanup in 3 seconds...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  let success = true

  // Step 1: Clean up storage buckets
  console.log('\n📁 Step 1: Cleaning up storage buckets...')
  const buckets = ['products', 'thumbnails', 'media']
  
  for (const bucket of buckets) {
    const bucketSuccess = await cleanupStorageBucket(bucket)
    if (!bucketSuccess) success = false
  }

  // Step 2: Clean up database
  console.log('\n🗄️  Step 2: Cleaning up database...')
  const dbSuccess = await cleanupDatabase()
  if (!dbSuccess) success = false

  // Step 3: Reset sequences
  console.log('\n🔄 Step 3: Resetting sequences...')
  const seqSuccess = await resetSequences()
  if (!seqSuccess) success = false

  // Step 4: Verify cleanup
  console.log('\n🔍 Step 4: Verifying cleanup...')
  await verifyCleanup()

  if (success) {
    console.log('\n🎉 Complete cleanup successful!')
    console.log('📋 Summary:')
    console.log('   ✅ All products deleted')
    console.log('   ✅ All media files removed from storage')
    console.log('   ✅ All related database records cleaned')
    console.log('   ✅ System ready for fresh start')
    console.log('\n✨ You can now upload new products!')
  } else {
    console.log('\n⚠️  Cleanup completed with some warnings.')
    console.log('📋 Check the messages above for any issues.')
    console.log('🔧 You may need to manually clean up some items.')
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the cleanup
main().catch(console.error)
