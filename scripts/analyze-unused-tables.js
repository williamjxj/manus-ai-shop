#!/usr/bin/env node

/**
 * Analyze Unused Tables Script
 *
 * This script analyzes which Supabase tables are defined but not used in the application code
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
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

// Tables defined in migrations
const DEFINED_TABLES = [
  // Initial schema (20241201000001)
  'profiles',
  'products',
  'cart_items',
  'orders',
  'order_items',
  'points_transactions',
  'subscriptions',

  // Media support (20250106000001)
  'media_files',

  // Categories (20250106000002)
  'categories',

  // Product media (20250107000005)
  'product_media',

  // Enhanced product management (20250107000006)
  'product_variants',
  'product_collections',
  'product_collection_items',
  'product_tags',
  'product_tag_items',
  'product_analytics',
  'wishlists',

  // Additional tables mentioned in scripts
  'webhook_events',
  'product_reviews',
  'review_votes',
  'content_reports',
]

// Tables actually used in application code (based on .from() calls)
const USED_TABLES = [
  'profiles', // Used in points/page.tsx, profile management
  'products', // Used extensively in products API, pages
  'cart_items', // Used in cart functionality
  'orders', // Used in orders/page.tsx
  'order_items', // Used in orders/page.tsx (nested query)
  'points_transactions', // Used in points/page.tsx
  'product_media', // Used in products API (nested query)
  'media_files', // Used in adult-media-utils.ts
  'webhook_events', // Used in stripe webhook handler
  'categories', // Used in products API (nested query)
  'product_tags', // Used in products API (nested query)
  'product_tag_items', // Used in products API (nested query)
  'product_reviews', // Used in products API (nested query)
  'product_variants', // Used in products API (nested query)
]

async function analyzeTableUsage() {
  try {
    console.log('🔍 Analyzing table usage...\n')

    // Check which tables actually exist in the database
    console.log('📊 Checking existing tables in database...')
    const existingTables = []

    for (const table of DEFINED_TABLES) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        existingTables.push({ name: table, count: count || 0 })
        console.log(`   ✅ ${table}: ${count || 0} records`)
      } catch (error) {
        console.log(`   ❌ ${table}: Does not exist (${error.message})`)
      }
    }

    // Identify unused tables
    const unusedTables = DEFINED_TABLES.filter(
      (table) => !USED_TABLES.includes(table)
    )
    const usedTables = DEFINED_TABLES.filter((table) =>
      USED_TABLES.includes(table)
    )

    console.log('\n📋 Analysis Results:')
    console.log('='.repeat(50))

    console.log('\n✅ USED TABLES (Keep these):')
    usedTables.forEach((table) => {
      const existing = existingTables.find((t) => t.name === table)
      const status = existing ? `${existing.count} records` : 'Not found'
      console.log(`   - ${table} (${status})`)
    })

    console.log('\n⚠️  UNUSED TABLES (Can be removed):')
    unusedTables.forEach((table) => {
      const existing = existingTables.find((t) => t.name === table)
      const status = existing ? `${existing.count} records` : 'Not found'
      console.log(`   - ${table} (${status})`)
    })

    // Special analysis for media_files
    console.log('\n🔍 Special Analysis:')
    console.log('\n📁 media_files table usage:')
    console.log('   - Used in: src/lib/adult-media-utils.ts')
    console.log('   - Purpose: Stores metadata for uploaded media files')
    console.log(
      '   - When populated: When users upload media via adult-media-utils'
    )
    console.log(
      '   - Current status: Used but may be empty if no uploads via that utility'
    )

    // Check if media_files has data
    try {
      const { count: mediaFilesCount } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true })

      if (mediaFilesCount === 0) {
        console.log(
          '   - Current data: Empty (no uploads via adult-media-utils)'
        )
        console.log(
          '   - Note: product_media is used for current product uploads'
        )
      } else {
        console.log(`   - Current data: ${mediaFilesCount} files`)
      }
    } catch (error) {
      console.log('   - Status: Table does not exist')
    }

    return { usedTables, unusedTables, existingTables }
  } catch (error) {
    console.error('❌ Error analyzing tables:', error)
    return null
  }
}

async function generateCleanupScript(unusedTables) {
  const sqlContent = `-- =====================================================
-- Remove Unused Tables Script
-- =====================================================
-- This script removes tables that are not used in the application code
-- WARNING: This will permanently delete these tables and their data!

${unusedTables
  .map(
    (table) => `
-- Drop ${table} table
DROP TABLE IF EXISTS ${table} CASCADE;
SELECT 'Dropped ${table} table' as status;`
  )
  .join('')}

-- =====================================================
-- Verification
-- =====================================================

-- Check remaining tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (${USED_TABLES.map((t) => `'${t}'`).join(', ')}) THEN '✅ Used'
    ELSE '⚠️  Check if needed'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Unused tables cleanup completed! 🎉' as message;`

  const scriptPath = path.join(
    __dirname,
    '..',
    'supabase',
    'remove-unused-tables.sql'
  )
  fs.writeFileSync(scriptPath, sqlContent)

  console.log(`\n📝 Generated cleanup script: ${scriptPath}`)
  return scriptPath
}

async function main() {
  console.log('🚀 Starting table usage analysis...\n')

  const analysis = await analyzeTableUsage()

  if (!analysis) {
    console.log('\n❌ Analysis failed.')
    process.exit(1)
  }

  const { usedTables, unusedTables, existingTables } = analysis

  if (unusedTables.length > 0) {
    console.log('\n🛠️  Generating cleanup script...')
    const scriptPath = await generateCleanupScript(unusedTables)

    console.log('\n📋 Recommendations:')
    console.log('='.repeat(50))
    console.log('1. Review the unused tables list carefully')
    console.log('2. Backup your database before running cleanup')
    console.log('3. Run the generated SQL script in Supabase Dashboard')
    console.log(`4. Script location: ${scriptPath}`)

    console.log('\n⚠️  Tables to remove:')
    unusedTables.forEach((table) => {
      console.log(`   - ${table}`)
    })
  } else {
    console.log('\n✅ All defined tables are being used!')
  }

  console.log('\n🎉 Analysis complete!')
}

// Run the analysis
main().catch(console.error)
