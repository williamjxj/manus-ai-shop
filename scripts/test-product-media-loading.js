#!/usr/bin/env node

/**
 * Test Product Media Loading
 * 
 * This script tests if product media is being loaded correctly
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

async function testProductMediaLoading() {
  try {
    console.log('🔍 Testing product media loading...\n')

    // Get all products with their media
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        media:product_media(
          id,
          media_type,
          media_url,
          thumbnail_url,
          is_primary,
          sort_order,
          alt_text
        )
      `)

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return false
    }

    if (!products || products.length === 0) {
      console.log('📋 No products found in database')
      console.log('💡 Create some products with media to test the gallery')
      return true
    }

    console.log(`📊 Found ${products.length} products`)
    console.log('='.repeat(50))

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`)
      console.log(`   ID: ${product.id}`)
      
      if (!product.media || product.media.length === 0) {
        console.log('   📁 Media: None')
      } else {
        console.log(`   📁 Media: ${product.media.length} files`)
        
        product.media.forEach((media, mediaIndex) => {
          const primaryBadge = media.is_primary ? ' (PRIMARY)' : ''
          console.log(`      ${mediaIndex + 1}. ${media.media_type.toUpperCase()}${primaryBadge}`)
          console.log(`         - URL: ${media.media_url}`)
          if (media.thumbnail_url) {
            console.log(`         - Thumbnail: ${media.thumbnail_url}`)
          }
          if (media.alt_text) {
            console.log(`         - Alt text: ${media.alt_text}`)
          }
          console.log(`         - Sort order: ${media.sort_order}`)
        })
      }
    })

    // Check for products with multiple media
    const productsWithMultipleMedia = products.filter(p => p.media && p.media.length > 1)
    
    console.log('\n📋 Summary:')
    console.log('='.repeat(50))
    console.log(`Total products: ${products.length}`)
    console.log(`Products with media: ${products.filter(p => p.media && p.media.length > 0).length}`)
    console.log(`Products with multiple media: ${productsWithMultipleMedia.length}`)

    if (productsWithMultipleMedia.length > 0) {
      console.log('\n✅ Products with multiple media (gallery should work):')
      productsWithMultipleMedia.forEach(product => {
        console.log(`   - ${product.name} (${product.media.length} files)`)
      })
      
      console.log('\n🎯 Test these products to verify the gallery works:')
      productsWithMultipleMedia.forEach(product => {
        console.log(`   - Visit: /products/${product.id}`)
      })
    } else {
      console.log('\n⚠️  No products with multiple media found')
      console.log('💡 Upload multiple images/videos to a single product to test the gallery')
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function checkProductMediaTable() {
  try {
    console.log('\n🔍 Checking product_media table structure...')

    // Get table info
    const { data: mediaRecords, error } = await supabase
      .from('product_media')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error accessing product_media table:', error)
      return false
    }

    console.log(`📊 Found ${mediaRecords?.length || 0} media records (showing first 5)`)
    
    if (mediaRecords && mediaRecords.length > 0) {
      console.log('\n📋 Sample media record structure:')
      const sample = mediaRecords[0]
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${typeof sample[key]} (${sample[key]})`)
      })
    }

    return true

  } catch (error) {
    console.error('❌ Error checking product_media table:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Product Media Loading Test\n')

  await checkProductMediaTable()
  await testProductMediaLoading()

  console.log('\n📋 How to test the media gallery:')
  console.log('1. 🔄 Upload multiple images/videos to a single product')
  console.log('2. 🌐 Visit the product detail page (/products/[id])')
  console.log('3. 🖼️  You should see navigation arrows and thumbnails')
  console.log('4. 🎯 Click arrows or thumbnails to navigate between media')
  console.log('5. 🔍 Click main image to open full-screen modal')

  console.log('\n🛠️  If gallery is not working:')
  console.log('1. ✅ Verify product has multiple media files')
  console.log('2. 🔍 Check browser console for errors')
  console.log('3. 📱 Test on both desktop and mobile')
  console.log('4. 🧪 Try refreshing the page')
}

// Run the test
main().catch(console.error)
