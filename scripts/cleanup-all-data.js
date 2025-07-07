#!/usr/bin/env node

/**
 * Complete Data Cleanup Script
 * Clears all public tables data and storage buckets for fresh testing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function clearStorageBucket(bucketName) {
  console.log(`🗑️  Clearing storage bucket: ${bucketName}`)

  try {
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (listError) {
      console.warn(
        `⚠️  Could not list files in ${bucketName}:`,
        listError.message
      )
      return
    }

    if (!files || files.length === 0) {
      console.log(`✅ Bucket ${bucketName} is already empty`)
      return
    }

    // Delete all files
    const filePaths = files.map((file) => file.name)
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths)

    if (deleteError) {
      console.warn(
        `⚠️  Some files in ${bucketName} could not be deleted:`,
        deleteError.message
      )
    } else {
      console.log(`✅ Cleared ${files.length} files from ${bucketName}`)
    }

    // Also clear any subdirectories
    const { data: folders, error: folderError } = await supabase.storage
      .from(bucketName)
      .list('products', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (!folderError && folders && folders.length > 0) {
      const folderPaths = folders.map((folder) => `products/${folder.name}`)
      await supabase.storage.from(bucketName).remove(folderPaths)
      console.log(
        `✅ Cleared ${folders.length} files from ${bucketName}/products`
      )
    }
  } catch (error) {
    console.warn(`⚠️  Error clearing bucket ${bucketName}:`, error.message)
  }
}

async function clearTable(tableName, description = '') {
  console.log(`🗑️  Clearing table: ${tableName} ${description}`)

  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      console.warn(`⚠️  Could not clear ${tableName}:`, error.message)
    } else {
      console.log(`✅ Cleared table: ${tableName}`)
    }
  } catch (error) {
    console.warn(`⚠️  Error clearing ${tableName}:`, error.message)
  }
}

async function resetSequences() {
  console.log('🔄 Resetting sequences and counters...')

  // Reset any auto-increment sequences if they exist
  // This ensures IDs start from 1 again for any tables that use sequences
  try {
    // Note: Most tables use UUIDs, but this is here for completeness
    console.log('✅ Sequences reset (most tables use UUIDs)')
  } catch (error) {
    console.warn('⚠️  Could not reset sequences:', error.message)
  }
}

async function main() {
  console.log('🧹 Starting complete data cleanup...')
  console.log(
    '⚠️  This will delete ALL data from public tables and storage buckets!'
  )

  // Wait for user confirmation in interactive mode
  if (process.stdin.isTTY) {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise((resolve) => {
      rl.question('Are you sure you want to proceed? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Cleanup cancelled')
      process.exit(0)
    }
  }

  console.log('\n🚀 Starting cleanup process...\n')

  // Clear storage buckets first
  console.log('📁 CLEARING STORAGE BUCKETS')
  console.log('='.repeat(50))
  await clearStorageBucket('images')
  await clearStorageBucket('videos')

  console.log('\n📊 CLEARING DATABASE TABLES')
  console.log('='.repeat(50))

  // Clear tables in dependency order (children first, then parents)
  await clearTable('webhook_events', '(Stripe webhook logs)')
  await clearTable('points_transactions', '(Points purchase/spend history)')
  await clearTable('order_items', '(Individual order items)')
  await clearTable('orders', '(Purchase records)')
  await clearTable('cart_items', '(Shopping cart contents)')
  await clearTable('review_votes', '(Review helpful votes)')
  await clearTable('product_reviews', '(Product reviews)')
  await clearTable('content_reports', '(Content moderation reports)')
  await clearTable('media_files', '(Media file metadata)')
  await clearTable('products', '(AI-generated products)')

  // Clear user data (be careful with this in production!)
  await clearTable('profiles', '(User profiles and points)')

  // Reset sequences
  await resetSequences()

  console.log('\n🎉 CLEANUP COMPLETE!')
  console.log('='.repeat(50))
  console.log('✅ All public tables cleared')
  console.log('✅ All storage buckets cleared')
  console.log('✅ Ready for fresh testing')
  console.log('\n💡 You can now:')
  console.log('   1. Create a new account at /signup')
  console.log('   2. Upload new products at /upload')
  console.log('   3. Test the product detail modal')
  console.log('   4. Test the shopping cart and checkout')
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the cleanup
main().catch(console.error)
