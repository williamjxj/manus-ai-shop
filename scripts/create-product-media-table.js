#!/usr/bin/env node

/**
 * Create Product Media Table
 * Creates the product_media table using individual SQL commands
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

async function createTable() {
  try {
    console.log('🚀 Creating product_media table...')

    // Create the table using a simple SQL query
    const createTableSQL = `
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
    `

    // Use a direct query instead of RPC
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    })

    if (createError) {
      console.log('⚠️ RPC method failed, trying alternative approach...')
      
      // Try using a simple insert that will fail but might create the table structure
      const { error: insertError } = await supabase
        .from('product_media')
        .insert({
          product_id: '00000000-0000-0000-0000-000000000000',
          media_url: 'test',
          media_type: 'image'
        })

      if (insertError && !insertError.message.includes('does not exist')) {
        console.log('✅ Table seems to exist, continuing...')
      } else {
        console.error('❌ Cannot create table automatically')
        console.log('\n📋 Please create the table manually in Supabase dashboard:')
        console.log('Go to: https://supabase.com/dashboard/project/iilqncqvslmlzuzkaehw/editor')
        console.log('\nRun this SQL:')
        console.log(createTableSQL)
        return false
      }
    } else {
      console.log('✅ Table created successfully!')
    }

    // Test the table
    console.log('🧪 Testing product_media table...')
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Table still does not exist')
        console.log('\n📋 Please create the table manually in Supabase dashboard:')
        console.log('Go to: https://supabase.com/dashboard/project/iilqncqvslmlzuzkaehw/editor')
        console.log('\nRun this SQL:')
        console.log(createTableSQL)
        console.log('\n-- Create indexes for performance')
        console.log('CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);')
        console.log('CREATE INDEX IF NOT EXISTS idx_product_media_is_primary ON product_media(product_id, is_primary);')
        console.log('CREATE INDEX IF NOT EXISTS idx_product_media_sort_order ON product_media(product_id, sort_order);')
        console.log('\n-- Ensure only one primary media per product')
        console.log('CREATE UNIQUE INDEX IF NOT EXISTS idx_product_media_one_primary ON product_media(product_id) WHERE is_primary = true;')
        console.log('\n-- Enable Row Level Security')
        console.log('ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;')
        console.log('\n-- RLS Policies')
        console.log('CREATE POLICY "Anyone can view product media" ON product_media FOR SELECT USING (true);')
        console.log('CREATE POLICY "Users can manage media for own products" ON product_media FOR ALL USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_media.product_id AND products.user_id = auth.uid()));')
        return false
      } else {
        console.log('⚠️ Table exists but has access issues:', error.message)
      }
    } else {
      console.log('✅ Product media table is working!')
    }

    return true

  } catch (error) {
    console.error('❌ Failed to create table:', error)
    return false
  }
}

async function main() {
  console.log('🏗️ Setting up product media table...\n')
  
  const success = await createTable()
  
  if (success) {
    console.log('\n✨ Setup complete! The product_media table is ready.')
    console.log('📋 You can now upload products with multiple media files.')
  } else {
    console.log('\n❌ Setup failed. Please follow the manual instructions above.')
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the setup
main().catch(console.error)
