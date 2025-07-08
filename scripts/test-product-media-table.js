#!/usr/bin/env node

/**
 * Test Product Media Table Script
 * Tests if the product_media table exists and is accessible
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

async function testProductMediaTable() {
  console.log('🔍 Testing product_media table...')

  try {
    // Test if we can access the table
    const { data, error } = await supabase
      .from('product_media')
      .select('id')
      .limit(1)

    if (error) {
      console.log('❌ Product media table not found or not accessible')
      console.log('Error:', error.message)
      console.log(
        '\n📋 Please create the table manually in Supabase dashboard:'
      )
      console.log(
        'Go to: https://supabase.com/dashboard/project/vkiaiuaijkawfawhwmtn/editor'
      )
      console.log('\nRun this SQL:')
      console.log(`
CREATE TABLE IF NOT EXISTS product_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  alt_text TEXT,
  file_size BIGINT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_is_primary ON product_media(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON product_media(product_id, sort_order);

-- Ensure only one primary media per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_one_primary 
ON product_media(product_id) 
WHERE is_primary = true;

-- Enable Row Level Security
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product media" ON product_media FOR SELECT USING (true);

CREATE POLICY "Users can insert media for own products" ON product_media FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update media for own products" ON product_media FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete media for own products" ON product_media FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = product_media.product_id 
    AND products.user_id = auth.uid()
  )
);
      `)
      return false
    }

    console.log('✅ Product media table is accessible!')
    console.log(`📊 Current records: ${data?.length || 0}`)
    return true
  } catch (error) {
    console.error('❌ Error testing table:', error)
    return false
  }
}

async function main() {
  console.log('🧪 Testing product media table setup...\n')
  const tableExists = await testProductMediaTable()

  if (tableExists) {
    console.log('\n🎉 Product media table is ready!')
    console.log('✅ You can now test the new upload workflow')
  } else {
    console.log('\n⚠️ Product media table needs to be created manually')
    console.log('📋 Follow the SQL instructions above')
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the test
main().catch(console.error)
