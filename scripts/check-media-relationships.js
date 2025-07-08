#!/usr/bin/env node

/**
 * Check Media Relationships
 * 
 * This script checks the relationship between products and their media
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

async function checkMediaRelationships() {
  try {
    console.log('🔍 Checking product-media relationships...\n')

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return
    }

    console.log(`📊 Found ${products?.length || 0} products`)

    // Get all media records
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('product_media')
      .select('id, product_id, media_type, is_primary, sort_order')

    if (mediaError) {
      console.error('❌ Error fetching media:', mediaError)
      return
    }

    console.log(`📁 Found ${mediaRecords?.length || 0} media records`)

    if (!products || !mediaRecords) return

    // Group media by product
    const mediaByProduct = {}
    mediaRecords.forEach(media => {
      if (!mediaByProduct[media.product_id]) {
        mediaByProduct[media.product_id] = []
      }
      mediaByProduct[media.product_id].push(media)
    })

    console.log('\n📋 Product-Media Relationships:')
    console.log('='.repeat(60))

    products.forEach(product => {
      const productMedia = mediaByProduct[product.id] || []
      console.log(`\n📦 ${product.name}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Media count: ${productMedia.length}`)
      
      if (productMedia.length > 0) {
        productMedia
          .sort((a, b) => a.sort_order - b.sort_order)
          .forEach((media, index) => {
            const primaryBadge = media.is_primary ? ' ⭐ PRIMARY' : ''
            console.log(`      ${index + 1}. ${media.media_type.toUpperCase()}${primaryBadge} (sort: ${media.sort_order})`)
          })
      } else {
        console.log('      (No media files)')
      }
    })

    // Find products with multiple media
    const productsWithMultipleMedia = products.filter(product => {
      const mediaCount = mediaByProduct[product.id]?.length || 0
      return mediaCount > 1
    })

    console.log('\n🎯 Gallery Test Candidates:')
    console.log('='.repeat(40))
    
    if (productsWithMultipleMedia.length > 0) {
      console.log('✅ Products with multiple media (gallery should work):')
      productsWithMultipleMedia.forEach(product => {
        const mediaCount = mediaByProduct[product.id].length
        console.log(`   - ${product.name} (${mediaCount} files)`)
        console.log(`     URL: /products/${product.id}`)
      })
    } else {
      console.log('⚠️  No products with multiple media found')
      console.log('💡 To test the gallery:')
      console.log('   1. Go to /upload')
      console.log('   2. Upload multiple images/videos to ONE product')
      console.log('   3. Visit the product detail page')
    }

    // Test the actual query used by the app
    console.log('\n🧪 Testing app query...')
    if (products.length > 0) {
      const testProductId = products[0].id
      
      const { data: testProduct, error: testError } = await supabase
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
        .eq('id', testProductId)
        .single()

      if (testError) {
        console.error('❌ App query failed:', testError)
      } else {
        console.log(`✅ App query successful for: ${testProduct.name}`)
        console.log(`   Media loaded: ${testProduct.media?.length || 0} files`)
        
        if (testProduct.media && testProduct.media.length > 0) {
          console.log('   Media details:')
          testProduct.media.forEach((media, index) => {
            console.log(`      ${index + 1}. ${media.media_type} (primary: ${media.is_primary})`)
          })
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function main() {
  console.log('🚀 Media Relationships Check\n')
  await checkMediaRelationships()
}

// Run the check
main().catch(console.error)
