#!/usr/bin/env node

/**
 * Script to create a test user account for development and testing
 * Run with: node scripts/create-test-user.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createTestUser() {
  console.log('🚀 Creating test user account...')

  try {
    // Test user credentials
    const testUserEmail = 'test-user@example.com'
    const testUserPassword = '123456'

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(
      (user) => user.email === testUserEmail
    )

    if (existingUser) {
      console.log('👤 Test user already exists:', testUserEmail)
      console.log('📧 Email:', testUserEmail)
      console.log('🔐 Password:', testUserPassword)
      console.log('🆔 User ID:', existingUser.id)
      return existingUser
    }

    // Create the test user with admin API
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: 'Test User',
          is_test_account: true,
        },
      })

    if (createError) {
      console.error('❌ Error creating user:', createError.message)
      throw createError
    }

    console.log('✅ Test user created successfully!')
    console.log('📧 Email:', testUserEmail)
    console.log('🔐 Password:', testUserPassword)
    console.log('🆔 User ID:', newUser.user.id)

    // Check if profile was created automatically
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it manually
      console.log('📝 Creating user profile...')
      const { error: insertError } = await supabase.from('profiles').insert({
        id: newUser.user.id,
        email: testUserEmail,
        points: 1000, // Give test user some points
      })

      if (insertError) {
        console.warn(
          '⚠️ Warning: Could not create profile:',
          insertError.message
        )
      } else {
        console.log('✅ Profile created with 1000 points')
      }
    } else if (profile) {
      console.log('✅ Profile exists with', profile.points, 'points')
    }

    return newUser.user
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🔧 Setting up test user account...\n')

  try {
    const user = await createTestUser()

    console.log('\n🎉 Test account setup complete!')
    console.log('\n📋 Test Account Details:')
    console.log('   Email: test-user@example.com')
    console.log('   Password: 123456')
    console.log('   Points: 1000 (for testing purchases)')
    console.log('\n💡 Use these credentials to test:')
    console.log('   - User authentication')
    console.log('   - Points purchases')
    console.log('   - Product purchases')
    console.log('   - Cart functionality')
    console.log('\n🔗 Login at: http://localhost:3000/login')
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { createTestUser }
