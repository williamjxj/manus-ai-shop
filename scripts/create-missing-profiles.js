#!/usr/bin/env node

/**
 * Create Missing Profiles Script
 * Creates profiles for existing auth users who don't have profiles
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

async function createMissingProfiles() {
  console.log('🔍 Checking for users without profiles...')

  try {
    // Get all auth users
    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`📊 Found ${users.length} auth users`)

    // Get existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    const existingProfileIds = new Set(profiles.map((p) => p.id))
    console.log(`📊 Found ${profiles.length} existing profiles`)

    // Find users without profiles
    const usersWithoutProfiles = users.filter(
      (user) => !existingProfileIds.has(user.id)
    )

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users already have profiles!')
      return
    }

    console.log(
      `🔧 Creating profiles for ${usersWithoutProfiles.length} users...`
    )

    // Create profiles for users without them
    const newProfiles = usersWithoutProfiles.map((user) => ({
      id: user.id,
      email: user.email,
      points: 100, // Legacy points column
      privacy_settings: {
        show_email: false,
        show_purchase_history: false,
        allow_friend_requests: true,
        discrete_billing: true,
        anonymous_reviews: false,
      },
      content_preferences: {
        blocked_categories: [],
        content_warnings_enabled: true,
        blur_explicit_content: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data: createdProfiles, error: createError } = await supabase
      .from('profiles')
      .insert(newProfiles)
      .select()

    if (createError) {
      console.error('❌ Error creating profiles:', createError)
      return
    }

    console.log(`✅ Successfully created ${createdProfiles.length} profiles!`)

    // Show created profiles
    createdProfiles.forEach((profile) => {
      console.log(`   📝 ${profile.email} (${profile.points_balance} points)`)
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function main() {
  console.log('🚀 Starting profile creation for existing users...\n')
  await createMissingProfiles()
  console.log('\n🎉 Profile creation complete!')
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the script
main().catch(console.error)
