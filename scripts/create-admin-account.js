#!/usr/bin/env node

// =====================================================
// Adult AI Gallery - Admin Account Creation Script
// =====================================================
// Creates an admin user account for content management

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
}

async function createAdminAccount() {
  try {
    log.info('Starting admin account creation for Adult AI Gallery...')

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error('Missing Supabase environment variables')
      log.error(
        'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set'
      )
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Admin account details
    const adminEmail = 'admin@adultaigallery.com'
    const adminPassword = '123456'

    log.info('Creating admin user account...')

    // Create the admin user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: 'admin',
          name: 'Admin User',
          created_by: 'setup_script',
        },
      })

    if (authError) {
      if (authError.message.includes('already registered')) {
        log.warning('Admin user already exists')

        // Try to get existing user
        const { data: users, error: listError } =
          await supabase.auth.admin.listUsers()
        if (listError) {
          log.error(`Failed to list users: ${listError.message}`)
          return
        }

        const existingAdmin = users.users.find(
          (user) => user.email === adminEmail
        )
        if (existingAdmin) {
          log.success('Found existing admin user')
          log.info(`Admin User ID: ${existingAdmin.id}`)
          log.info(`Admin Email: ${existingAdmin.email}`)
          log.info('Password: 123456')
          return
        }
      } else {
        log.error(`Failed to create admin user: ${authError.message}`)
        return
      }
    }

    if (authData?.user) {
      log.success('Admin user created successfully!')
      log.info(`Admin User ID: ${authData.user.id}`)
      log.info(`Admin Email: ${authData.user.email}`)
      log.info('Password: 123456')

      // Create or update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        points: 10000, // Give admin some points for testing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        log.warning(`Profile creation warning: ${profileError.message}`)
      } else {
        log.success('Admin profile created with 10,000 points')
      }
    }

    log.success('Admin account setup completed!')
    log.info('')
    log.info('🔑 Admin Login Credentials:')
    log.info(`   Email: ${adminEmail}`)
    log.info('   Password: 123456')
    log.info('')
    log.info('🚀 You can now login and start uploading adult content!')
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
createAdminAccount()
