#!/usr/bin/env node

/**
 * Script to approve a specific product for public viewing
 * Usage: node scripts/approve-product.js [product-id]
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration (adjust for your local setup)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function approveProduct(productId) {
  try {
    console.log(`Approving product: ${productId}`)
    
    const { data, error } = await supabase
      .from('products')
      .update({
        moderation_status: 'approved',
        moderated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
    
    if (error) {
      console.error('Error approving product:', error)
      return false
    }
    
    if (data && data.length > 0) {
      console.log('✅ Product approved successfully!')
      console.log('Product:', data[0].name)
      console.log('Status:', data[0].moderation_status)
      return true
    } else {
      console.log('❌ Product not found')
      return false
    }
  } catch (error) {
    console.error('Script error:', error)
    return false
  }
}

// Get product ID from command line argument
const productId = process.argv[2] || 'a1556829-5442-4231-b05b-d69983bd9a68'

if (!productId) {
  console.log('Usage: node scripts/approve-product.js [product-id]')
  process.exit(1)
}

approveProduct(productId).then((success) => {
  process.exit(success ? 0 : 1)
})
