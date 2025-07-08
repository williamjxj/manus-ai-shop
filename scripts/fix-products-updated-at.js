#!/usr/bin/env node

/**
 * Fix Products Table - Add Missing updated_at Column
 *
 * This script adds the missing updated_at column to fix the
 * "Could not find the 'updated_at' column" error when saving products.
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
  console.error('Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixProductsUpdatedAt() {
  try {
    console.log('🔧 Fixing products table updated_at column...')

    // First, check if the column already exists
    console.log('📋 Checking current products table schema...')

    const { data: columns, error: schemaError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        ORDER BY ordinal_position;
      `,
      }
    )

    if (schemaError) {
      console.log(
        '⚠️  Could not check schema via RPC, proceeding with direct queries...'
      )
    } else {
      console.log('📊 Current products table columns:')
      columns.forEach((col) => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })

      const hasUpdatedAt = columns.some(
        (col) => col.column_name === 'updated_at'
      )
      if (hasUpdatedAt) {
        console.log('✅ updated_at column already exists!')
        return true
      }
    }

    console.log('🔨 Adding updated_at column...')

    // Add the updated_at column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `,
    })

    if (addColumnError) {
      console.error('❌ Error adding updated_at column:', addColumnError)
      return false
    }

    console.log('✅ updated_at column added successfully!')

    // Update existing records
    console.log('🔄 Updating existing records...')

    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE products 
        SET updated_at = COALESCE(created_at, NOW()) 
        WHERE updated_at IS NULL;
      `,
    })

    if (updateError) {
      console.error('❌ Error updating existing records:', updateError)
      return false
    }

    console.log('✅ Existing records updated!')

    // Create trigger function
    console.log('⚙️  Creating trigger function...')

    const { error: triggerFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    if (triggerFunctionError) {
      console.error('❌ Error creating trigger function:', triggerFunctionError)
      return false
    }

    console.log('✅ Trigger function created!')

    // Create trigger
    console.log('🎯 Creating trigger...')

    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_products_updated_at ON products;
        CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `,
    })

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError)
      return false
    }

    console.log('✅ Trigger created successfully!')

    // Test the fix by trying to update a product
    console.log('🧪 Testing the fix...')

    const { data: testProduct, error: testSelectError } = await supabase
      .from('products')
      .select('id, name, updated_at')
      .limit(1)
      .single()

    if (testSelectError) {
      console.log(
        '⚠️  No products found to test with, but column should be working'
      )
      return true
    }

    const { error: testUpdateError } = await supabase
      .from('products')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testProduct.id)

    if (testUpdateError) {
      console.error('❌ Test update failed:', testUpdateError)
      return false
    }

    console.log('✅ Test update successful!')

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting products table fix...\n')

  const success = await fixProductsUpdatedAt()

  if (success) {
    console.log('\n🎉 Products table fix completed!')
    console.log('📋 Summary:')
    console.log('   - updated_at column added to products table')
    console.log('   - Existing records updated with timestamps')
    console.log('   - Auto-update trigger created')
    console.log('\n✨ Product saving should now work properly!')
  } else {
    console.log('\n❌ Fix failed. Please check the errors above.')
    process.exit(1)
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the fix
main().catch(console.error)
