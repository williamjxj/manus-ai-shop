#!/usr/bin/env node

/**
 * Verify Products Cleanup Script
 * 
 * This script verifies that all products and related data have been cleaned up
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

async function verifyCleanup() {
  try {
    console.log('🔍 Verifying complete cleanup...\n')

    // Check database tables
    const tables = [
      'products',
      'product_media', 
      'cart_items',
      'order_items',
      'product_reviews',
      'product_variants',
      'product_collection_items',
      'product_tag_items',
      'media_files'
    ]
    
    console.log('📊 Database Tables:')
    let totalRecords = 0
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        const recordCount = count || 0
        totalRecords += recordCount
        
        const status = recordCount === 0 ? '✅' : '⚠️ '
        console.log(`   ${status} ${table}: ${recordCount} records`)
      } catch (error) {
        console.log(`   ❓ ${table}: Could not check (${error.message})`)
      }
    }

    // Check storage buckets
    const buckets = ['products', 'thumbnails', 'media']
    
    console.log('\n📁 Storage Buckets:')
    let totalFiles = 0
    
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1000 })

        const fileCount = files ? files.length : 0
        totalFiles += fileCount
        
        const status = fileCount === 0 ? '✅' : '⚠️ '
        console.log(`   ${status} ${bucket}: ${fileCount} files`)
      } catch (error) {
        console.log(`   ❓ ${bucket}: Could not check (${error.message})`)
      }
    }

    // Summary
    console.log('\n📋 Cleanup Summary:')
    console.log(`   📊 Total database records: ${totalRecords}`)
    console.log(`   📁 Total storage files: ${totalFiles}`)
    
    if (totalRecords === 0 && totalFiles === 0) {
      console.log('\n🎉 Perfect! Complete cleanup verified!')
      console.log('✨ System is ready for fresh products!')
    } else {
      console.log('\n⚠️  Some data remains:')
      if (totalRecords > 0) {
        console.log(`   - ${totalRecords} database records found`)
      }
      if (totalFiles > 0) {
        console.log(`   - ${totalFiles} storage files found`)
      }
      console.log('🔧 You may want to run the cleanup script again.')
    }

    return totalRecords === 0 && totalFiles === 0

  } catch (error) {
    console.error('❌ Error verifying cleanup:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting cleanup verification...\n')
  
  const isClean = await verifyCleanup()
  
  if (isClean) {
    console.log('\n✅ Verification complete - system is clean!')
  } else {
    console.log('\n⚠️  Verification complete - some cleanup needed.')
  }
}

// Run the verification
main().catch(console.error)
