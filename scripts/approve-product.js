#!/usr/bin/env node

/**
 * Script to approve a specific product for public viewing
 * Usage: node scripts/approve-product.js [product-id]
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error(
    '   NEXT_PUBLIC_SUPABASE_URL:',
    supabaseUrl ? '✅ Set' : '❌ Missing'
  )
  console.error(
    '   SUPABASE_SERVICE_ROLE_KEY:',
    supabaseServiceKey ? '✅ Set' : '❌ Missing'
  )
  console.error(
    '\nPlease check your .env.local file or set these environment variables.'
  )
  process.exit(1)
}

console.log('🔗 Connecting to Supabase:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function approveProduct(productId) {
  try {
    console.log(`Approving product: ${productId}`)

    const { data, error } = await supabase
      .from('products')
      .update({
        moderation_status: 'approved',
        moderated_at: new Date().toISOString(),
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

async function listPendingProducts() {
  try {
    console.log('🔍 Finding pending products...')

    const { data: pendingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, moderation_status, created_at')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Supabase query error:', fetchError)
      throw fetchError
    }

    if (pendingProducts.length === 0) {
      console.log('✅ No pending products found')
      return []
    }

    console.log(`📋 Found ${pendingProducts.length} pending products:`)
    pendingProducts.forEach((product, index) => {
      const date = new Date(product.created_at).toLocaleDateString()
      console.log(
        `${index + 1}. ${product.name} (${product.id}) - Created: ${date}`
      )
    })

    return pendingProducts
  } catch (error) {
    console.error('❌ Error fetching pending products:')
    console.error('   Message:', error.message)
    console.error('   Details:', error.details || 'No additional details')
    console.error('   Hint:', error.hint || 'No hints available')
    console.error('   Code:', error.code || 'No error code')

    // Additional debugging info
    console.error('\n🔧 Debug Information:')
    console.error('   Supabase URL:', supabaseUrl)
    console.error('   Service Key:', supabaseServiceKey ? 'Present' : 'Missing')

    throw error
  }
}

async function approveAllPendingProducts() {
  try {
    const pendingProducts = await listPendingProducts()

    if (pendingProducts.length === 0) {
      return
    }

    console.log('\n🚀 Approving all pending products...')

    const { data, error } = await supabase
      .from('products')
      .update({
        moderation_status: 'approved',
        moderated_at: new Date().toISOString(),
      })
      .eq('moderation_status', 'pending')
      .select('id, name')

    if (error) throw error

    console.log(`✅ Successfully approved ${data.length} products:`)
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`)
    })

    return data
  } catch (error) {
    console.error('❌ Error approving products:', error.message)
    throw error
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('📋 Product Moderation Script')
    console.log('Usage:')
    console.log(
      '  node scripts/approve-product.js list         # List pending products'
    )
    console.log(
      '  node scripts/approve-product.js all          # Approve all pending products'
    )
    console.log(
      '  node scripts/approve-product.js <product-id> # Approve specific product'
    )
    console.log('')
    await listPendingProducts()
    return
  }

  if (args[0] === 'list') {
    await listPendingProducts()
  } else if (args[0] === 'all') {
    await approveAllPendingProducts()
  } else {
    const productId = args[0]
    const success = await approveProduct(productId)
    process.exit(success ? 0 : 1)
  }
}

main().catch(console.error)
