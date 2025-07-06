#!/usr/bin/env node

// =====================================================
// Adult AI Gallery - Create Categories Table
// =====================================================
// Creates the static categories table with predefined categories

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
}

// Static categories data
const categories = [
  {
    category_name: 'artistic-nude',
    category_description: 'Artistic nude photography and fine art featuring tasteful nudity with emphasis on form, lighting, and composition',
    is_active: true
  },
  {
    category_name: 'boudoir',
    category_description: 'Intimate boudoir photography featuring elegant poses, lingerie, and sensual styling in private settings',
    is_active: true
  },
  {
    category_name: 'glamour',
    category_description: 'Professional glamour photography with high-end styling, makeup, and fashion elements',
    is_active: true
  },
  {
    category_name: 'erotic-art',
    category_description: 'Artistic erotic content including digital art, paintings, and creative visual expressions of sensuality',
    is_active: true
  },
  {
    category_name: 'adult-animation',
    category_description: 'Animated adult content including digital animations, motion graphics, and artistic video content',
    is_active: true
  },
  {
    category_name: 'mature-content',
    category_description: 'General mature content for adult audiences including various themes and artistic expressions',
    is_active: true
  }
]

async function createCategoriesTable() {
  try {
    log.info('Creating static categories table...')
    
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
    
    // Note: Table creation needs to be done manually in Supabase dashboard
    // This script will populate the categories once the table exists
    
    log.info('Inserting static categories...')
    
    let successCount = 0
    let errorCount = 0
    
    for (const category of categories) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(category, { onConflict: 'category_name' })
          .select()
        
        if (error) {
          log.error(`Failed to insert ${category.category_name}: ${error.message}`)
          errorCount++
        } else {
          log.success(`✓ Added: ${category.category_name}`)
          successCount++
        }
      } catch (err) {
        log.error(`Error inserting ${category.category_name}: ${err.message}`)
        errorCount++
      }
    }
    
    log.info('')
    log.success(`Categories table setup completed!`)
    log.info(`📊 Results:`)
    log.info(`   • Successfully added: ${successCount} categories`)
    log.info(`   • Errors: ${errorCount}`)
    log.info('')
    log.info('🎯 Static categories are now ready!')
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`)
    log.info('')
    log.info('📝 Manual Setup Required:')
    log.info('   1. Go to Supabase Dashboard > SQL Editor')
    log.info('   2. Run the SQL from: supabase/migrations/20250106000002_create_categories_table.sql')
    log.info('   3. Then run this script again to populate categories')
  }
}

// Run the script
createCategoriesTable()
