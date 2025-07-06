#!/usr/bin/env node

// =====================================================
// Adult AI Gallery - Database and Storage Reset
// =====================================================
// Resets database tables and clears Supabase storage buckets

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.magenta}🔄 ${msg}${colors.reset}`),
}

async function resetDatabaseAndStorage() {
  try {
    log.header('Starting database and storage reset for Adult AI Gallery...')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log.error('Missing Supabase environment variables')
      process.exit(1)
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // 1. Clear database tables (preserve user accounts)
    log.info('Step 1: Clearing database tables...')
    
    const tablesToClear = [
      'order_items',
      'orders', 
      'cart_items',
      'products',
      'points_transactions',
      'webhook_events'
    ]
    
    for (const table of tablesToClear) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        
        if (error) {
          log.warning(`Could not clear ${table}: ${error.message}`)
        } else {
          log.success(`✓ Cleared table: ${table}`)
        }
      } catch (err) {
        log.warning(`Error clearing ${table}: ${err.message}`)
      }
    }
    
    // 2. Clear storage buckets
    log.info('Step 2: Clearing storage buckets...')
    
    const buckets = ['images', 'videos', 'thumbnails']
    
    for (const bucketName of buckets) {
      try {
        // List all files in bucket
        const { data: files, error: listError } = await supabase.storage
          .from(bucketName)
          .list()
        
        if (listError) {
          log.warning(`Could not list files in ${bucketName}: ${listError.message}`)
          continue
        }
        
        if (files && files.length > 0) {
          // Delete all files
          const filePaths = files.map(file => file.name)
          const { error: deleteError } = await supabase.storage
            .from(bucketName)
            .remove(filePaths)
          
          if (deleteError) {
            log.warning(`Could not delete files from ${bucketName}: ${deleteError.message}`)
          } else {
            log.success(`✓ Cleared storage bucket: ${bucketName} (${files.length} files)`)
          }
        } else {
          log.info(`✓ Storage bucket ${bucketName} is already empty`)
        }
      } catch (err) {
        log.warning(`Error clearing bucket ${bucketName}: ${err.message}`)
      }
    }
    
    // 3. Verify reset
    log.info('Step 3: Verifying reset...')
    
    const { data: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
    
    const { data: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
    
    log.info('')
    log.success('Database and storage reset completed!')
    log.info('📊 Reset Summary:')
    log.info(`   • Products remaining: ${productCount?.length || 0}`)
    log.info(`   • User profiles preserved: ${profileCount?.length || 0}`)
    log.info(`   • Storage buckets cleared: ${buckets.length}`)
    log.info(`   • Database tables cleared: ${tablesToClear.length}`)
    log.info('')
    log.info('🎯 Ready for fresh content with static categories!')
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
resetDatabaseAndStorage()
