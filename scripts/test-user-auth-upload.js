#!/usr/bin/env node

/**
 * Test User Authentication for Upload
 * 
 * This script helps debug authentication issues during upload
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create both clients
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function testWithServiceRole() {
  console.log('🔧 Testing with Service Role (should work)...')
  
  const testImageData = new Uint8Array([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x80, 0xFF, 0xD9
  ])

  const testBlob = new Blob([testImageData], { type: 'image/jpeg' })
  const testFileName = `service-test-${Date.now()}.jpg`

  const { error } = await supabaseService.storage
    .from('thumbnails')
    .upload(`thumbnails/${testFileName}`, testBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    })

  if (error) {
    console.log(`   ❌ Service role failed: ${error.message}`)
    return false
  } else {
    console.log('   ✅ Service role upload successful')
    // Clean up
    await supabaseService.storage.from('thumbnails').remove([`thumbnails/${testFileName}`])
    return true
  }
}

async function testWithAnonKey() {
  console.log('🔓 Testing with Anonymous Key (simulates browser)...')
  
  const testImageData = new Uint8Array([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x80, 0xFF, 0xD9
  ])

  const testBlob = new Blob([testImageData], { type: 'image/jpeg' })
  const testFileName = `anon-test-${Date.now()}.jpg`

  const { error } = await supabaseAnon.storage
    .from('thumbnails')
    .upload(`thumbnails/${testFileName}`, testBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg'
    })

  if (error) {
    console.log(`   ❌ Anonymous upload failed: ${error.message}`)
    console.log(`   📋 Error details:`, error)
    return false
  } else {
    console.log('   ✅ Anonymous upload successful')
    // Clean up
    await supabaseAnon.storage.from('thumbnails').remove([`thumbnails/${testFileName}`])
    return true
  }
}

async function checkAuthState() {
  console.log('👤 Checking authentication state...')
  
  const { data: { user }, error } = await supabaseAnon.auth.getUser()
  
  if (error) {
    console.log(`   ❌ Auth check failed: ${error.message}`)
    return null
  }
  
  if (user) {
    console.log(`   ✅ User authenticated: ${user.email}`)
    return user
  } else {
    console.log('   ⚠️  No user authenticated (anonymous)') 
    return null
  }
}

async function main() {
  console.log('🚀 User Authentication Upload Test\n')

  // Test 1: Service role (should always work)
  const serviceWorks = await testWithServiceRole()
  console.log('')

  // Test 2: Check auth state
  const user = await checkAuthState()
  console.log('')

  // Test 3: Anonymous key (simulates browser without auth)
  const anonWorks = await testWithAnonKey()
  console.log('')

  // Analysis
  console.log('📊 Analysis:')
  console.log('='.repeat(40))
  
  if (serviceWorks && !anonWorks) {
    console.log('✅ Service role works, anonymous fails')
    console.log('🔧 This confirms RLS policies are working correctly')
    console.log('💡 The issue is likely:')
    console.log('   1. User not properly authenticated in browser')
    console.log('   2. Session expired during upload')
    console.log('   3. Client-side auth token not being sent')
    
    console.log('\n🛠️  SOLUTIONS:')
    console.log('1. 🔐 Make sure user is logged in before uploading')
    console.log('2. 🔄 Check if auth session is valid')
    console.log('3. 🧪 Test upload immediately after login')
    console.log('4. 🔍 Check browser network tab for auth headers')
    
  } else if (!serviceWorks && !anonWorks) {
    console.log('❌ Both service and anonymous fail')
    console.log('🔧 This indicates a bucket or policy configuration issue')
    console.log('💡 Run the thumbnail policies SQL script')
    
  } else if (serviceWorks && anonWorks) {
    console.log('✅ Both service and anonymous work')
    console.log('🔧 RLS policies might be too permissive')
    console.log('💡 This should work in browser too')
    
  } else {
    console.log('❓ Unexpected result - service fails but anonymous works')
    console.log('🔧 This is unusual and needs investigation')
  }

  console.log('\n📋 Next Steps:')
  console.log('1. 🌐 Test upload in browser while logged in')
  console.log('2. 🔍 Check browser console for auth errors')
  console.log('3. 🧪 Try uploading immediately after login')
  console.log('4. 📱 Verify user session is active')
}

// Run the test
main().catch(console.error)
