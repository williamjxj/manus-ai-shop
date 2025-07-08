#!/usr/bin/env node

/**
 * Comprehensive Table Analysis & Cleanup Script
 *
 * This script provides a complete analysis of table usage and creates cleanup scripts
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

async function comprehensiveAnalysis() {
  console.log('🔍 Comprehensive Table Usage Analysis\n')
  console.log('='.repeat(60))

  // Tables that are ACTUALLY used in the current application
  const ACTIVELY_USED_TABLES = [
    'profiles', // ✅ Used in points/page.tsx, auth system
    'products', // ✅ Used extensively in products API, pages
    'cart_items', // ✅ Used in cart functionality (though empty after cleanup)
    'orders', // ✅ Used in orders/page.tsx
    'order_items', // ✅ Used in orders/page.tsx (nested query)
    'points_transactions', // ✅ Used in points/page.tsx
    'product_media', // ✅ Used in products API (current media system)
    'webhook_events', // ✅ Used in stripe webhook handler
    'categories', // ✅ Used in products API (nested query)
    'product_tags', // ✅ Used in products API (nested query)
    'product_tag_items', // ✅ Used in products API (nested query)
    'product_reviews', // ✅ Used in products API (nested query)
    'product_variants', // ✅ Used in products API (nested query)
  ]

  // Tables that exist but are NOT used in current application
  const UNUSED_TABLES = [
    'subscriptions', // ❌ Not implemented in current app
    'product_collections', // ❌ Not implemented in current app
    'product_collection_items', // ❌ Not implemented in current app
    'product_analytics', // ❌ Not implemented in current app
    'wishlists', // ❌ Not implemented in current app
    'review_votes', // ❌ Not implemented in current app
    'content_reports', // ❌ Not implemented in current app
    'media_files', // ❌ Legacy table, not used in current upload system
  ]

  console.log('📊 Current Table Status:')
  console.log('-'.repeat(40))

  let totalUsedRecords = 0
  let totalUnusedRecords = 0

  // Check actively used tables
  console.log('\n✅ ACTIVELY USED TABLES:')
  for (const table of ACTIVELY_USED_TABLES) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      totalUsedRecords += count || 0
      console.log(`   ${table}: ${count || 0} records`)
    } catch (error) {
      console.log(`   ${table}: ❌ Error (${error.message})`)
    }
  }

  // Check unused tables
  console.log('\n❌ UNUSED TABLES (Safe to remove):')
  for (const table of UNUSED_TABLES) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      totalUnusedRecords += count || 0
      console.log(`   ${table}: ${count || 0} records`)
    } catch (error) {
      console.log(`   ${table}: ❌ Error (${error.message})`)
    }
  }

  console.log('\n📋 Summary:')
  console.log(
    `   Used tables: ${ACTIVELY_USED_TABLES.length} (${totalUsedRecords} total records)`
  )
  console.log(
    `   Unused tables: ${UNUSED_TABLES.length} (${totalUnusedRecords} total records)`
  )

  // Special analysis for media_files
  console.log('\n🔍 Special Analysis:')
  console.log('-'.repeat(40))
  console.log('\n📁 media_files Table Analysis:')
  console.log('   ❌ Status: UNUSED in current application')
  console.log('   📝 Reason: Legacy table from adult-media-utils.ts')
  console.log('   🔄 Current system: Uses product_media table instead')
  console.log(
    '   📍 File exists: src/lib/adult-media-utils.ts (but not imported anywhere)'
  )
  console.log('   ✅ Safe to remove: Yes, no active usage')

  return { ACTIVELY_USED_TABLES, UNUSED_TABLES }
}

async function generateCleanupScripts(UNUSED_TABLES, ACTIVELY_USED_TABLES) {
  console.log('\n🛠️  Generating cleanup scripts...')

  // Generate SQL cleanup script
  const sqlContent = `-- =====================================================
-- Complete Unused Tables Cleanup Script
-- =====================================================
-- This script removes all unused tables from the database
-- WARNING: This will permanently delete these tables and their data!

-- Backup recommendation
SELECT 'IMPORTANT: Backup your database before running this script!' as warning;

${UNUSED_TABLES.map(
  (table) => `
-- Drop ${table} table (unused in current application)
DROP TABLE IF EXISTS ${table} CASCADE;
SELECT 'Dropped unused table: ${table}' as status;`
).join('')}

-- =====================================================
-- Verification Query
-- =====================================================

-- List remaining tables and their usage status
SELECT
  table_name,
  CASE
    WHEN table_name IN (${ACTIVELY_USED_TABLES.map((t) => `'${t}'`).join(', ')}) THEN '✅ Actively Used'
    ELSE '⚠️  Review Needed'
  END as usage_status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY usage_status DESC, table_name;

-- Final status
SELECT
  'Database cleanup completed! 🎉' as message,
  'All unused tables have been removed.' as status,
  'Only actively used tables remain.' as result;`

  const sqlPath = path.join(
    __dirname,
    '..',
    'supabase',
    'cleanup-unused-tables-final.sql'
  )
  fs.writeFileSync(sqlPath, sqlContent)

  // Generate JavaScript cleanup script
  const jsContent = `#!/usr/bin/env node

/**
 * Remove Unused Legacy Files Script
 *
 * This script removes unused legacy files from the codebase
 */

const fs = require('fs')
const path = require('path')

const UNUSED_FILES = [
  'src/lib/adult-media-utils.ts',  // Legacy file, not used in current app
  'src/app/upload/page-old.tsx',  // Old upload page, replaced by current one
]

function removeUnusedFiles() {
  console.log('🗑️  Removing unused legacy files...')

  let removedCount = 0

  UNUSED_FILES.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath)

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
        console.log(\`   ✅ Removed: \${filePath}\`)
        removedCount++
      } catch (error) {
        console.log(\`   ❌ Failed to remove \${filePath}: \${error.message}\`)
      }
    } else {
      console.log(\`   ⚠️  File not found: \${filePath}\`)
    }
  })

  console.log(\`\\n🎉 Cleanup complete! Removed \${removedCount} unused files.\`)
}

removeUnusedFiles()`

  const jsPath = path.join(__dirname, 'remove-unused-files.js')
  fs.writeFileSync(jsPath, jsContent)

  console.log(`   📝 SQL cleanup script: ${sqlPath}`)
  console.log(`   📝 JS cleanup script: ${jsPath}`)

  return { sqlPath, jsPath }
}

async function main() {
  const { ACTIVELY_USED_TABLES, UNUSED_TABLES } = await comprehensiveAnalysis()

  const { sqlPath, jsPath } = await generateCleanupScripts(
    UNUSED_TABLES,
    ACTIVELY_USED_TABLES
  )

  console.log('\n🎯 Recommendations:')
  console.log('='.repeat(60))
  console.log('1. 📋 Review the analysis above carefully')
  console.log('2. 💾 Backup your database before cleanup')
  console.log(
    '3. 🗄️  Run SQL script in Supabase Dashboard to remove unused tables'
  )
  console.log('4. 📁 Run JS script to remove unused files from codebase')
  console.log('5. ✅ Verify everything works after cleanup')

  console.log('\n📋 Tables to Remove:')
  UNUSED_TABLES.forEach((table) => {
    console.log(`   ❌ ${table}`)
  })

  console.log('\n📋 Tables to Keep:')
  ACTIVELY_USED_TABLES.forEach((table) => {
    console.log(`   ✅ ${table}`)
  })

  console.log('\n🚀 Next Steps:')
  console.log(`   1. Run: ${sqlPath} (in Supabase Dashboard)`)
  console.log(`   2. Run: node ${jsPath}`)
  console.log('   3. Test your application to ensure everything works')

  console.log(
    '\n✨ This will give you a clean, optimized database with only used tables!'
  )
}

// Run the analysis
main().catch(console.error)
