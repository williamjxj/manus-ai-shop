#!/usr/bin/env node

/**
 * Apply Product Media Migration
 * Creates the product_media table directly using SQL
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function applyMigration() {
  try {
    console.log('🚀 Applying product media migration...')

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20250107000005_create_product_media_table.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*')
      )

    console.log(`📋 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        })

        if (error) {
          // Some errors are expected (like table already exists)
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')
          ) {
            console.log(`⚠️ Expected error (skipping): ${error.message}`)
          } else {
            console.error(`❌ Error executing statement: ${error.message}`)
            console.error(`Statement: ${statement}`)
          }
        } else {
          console.log(`✅ Statement executed successfully`)
        }
      }
    }

    // Test the table creation
    console.log('🧪 Testing product_media table...')
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Table test failed:', error.message)
      return false
    }

    console.log('✅ Product media table is working!')
    console.log('🎉 Migration completed successfully!')

    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

async function main() {
  console.log('🏗️ Starting product media migration...\n')

  const success = await applyMigration()

  if (success) {
    console.log('\n✨ Migration complete! The product_media table is ready.')
    console.log('📋 You can now upload products with multiple media files.')
  } else {
    console.log('\n❌ Migration failed. Please check the errors above.')
    process.exit(1)
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the migration
main().catch(console.error)
