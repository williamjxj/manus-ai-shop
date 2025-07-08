#!/usr/bin/env node

/**
 * Fix Products Table - Add Missing updated_at Column (Simple Version)
 * 
 * This script checks if updated_at column exists and provides instructions to fix it.
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

async function checkAndFixProducts() {
  try {
    console.log('🔍 Checking products table schema...')

    // Try to select from products table to see what columns exist
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('❌ Error accessing products table:', selectError)
      return false
    }

    if (products && products.length > 0) {
      const columns = Object.keys(products[0])
      console.log('📊 Current products table columns:')
      columns.forEach(col => console.log(`   - ${col}`))
      
      if (columns.includes('updated_at')) {
        console.log('✅ updated_at column already exists!')
        
        // Test if we can update it
        console.log('🧪 Testing update functionality...')
        const { error: updateError } = await supabase
          .from('products')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', products[0].id)

        if (updateError) {
          console.error('❌ Update test failed:', updateError)
          console.log('\n📋 Manual fix required:')
          console.log('1. Go to your Supabase Dashboard → SQL Editor')
          console.log('2. Run the SQL from: supabase/fix-products-updated-at.sql')
          return false
        } else {
          console.log('✅ Update test successful! The issue should be resolved.')
          return true
        }
      } else {
        console.log('❌ updated_at column is missing!')
        console.log('\n📋 Manual fix required:')
        console.log('1. Go to your Supabase Dashboard → SQL Editor')
        console.log('2. Copy and paste the following SQL:')
        console.log('\n' + '='.repeat(50))
        console.log(`
-- Add updated_at column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records
UPDATE products 
SET updated_at = COALESCE(created_at, NOW()) 
WHERE updated_at IS NULL;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
        `)
        console.log('='.repeat(50))
        console.log('\n3. Click "Run" to execute the SQL')
        console.log('4. Try saving your product again')
        return false
      }
    } else {
      console.log('⚠️  No products found in table, but we can still check the schema')
      console.log('\n📋 Manual fix recommended:')
      console.log('1. Go to your Supabase Dashboard → SQL Editor')
      console.log('2. Run the SQL from: supabase/fix-products-updated-at.sql')
      return false
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.log('\n📋 Manual fix required:')
    console.log('1. Go to your Supabase Dashboard → SQL Editor')
    console.log('2. Run the SQL from: supabase/fix-products-updated-at.sql')
    return false
  }
}

async function main() {
  console.log('🚀 Checking products table for updated_at column...\n')

  const success = await checkAndFixProducts()

  if (success) {
    console.log('\n🎉 Products table is working correctly!')
    console.log('✨ You should now be able to save product changes.')
  } else {
    console.log('\n⚠️  Manual intervention required.')
    console.log('📁 SQL fix file location: supabase/fix-products-updated-at.sql')
  }
}

// Run the check
main().catch(console.error)
