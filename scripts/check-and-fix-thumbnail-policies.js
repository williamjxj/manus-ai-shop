#!/usr/bin/env node

/**
 * Check and Fix Thumbnail Storage Policies
 *
 * This script checks existing storage policies and adds missing ones for thumbnails
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

async function checkAndFixPolicies() {
  try {
    console.log('🔍 Checking existing storage policies...')

    // Check existing policies
    const { data: policies, error: policiesError } = await supabase.rpc(
      'exec_sql',
      {
        sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
        ORDER BY policyname;
      `,
      }
    )

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError)
      return false
    }

    console.log(`📋 Found ${policies.length} existing storage policies`)

    // Check for thumbnail-specific policies
    const thumbnailPolicies = policies.filter((p) =>
      p.policyname.toLowerCase().includes('thumbnail')
    )

    console.log(
      `🖼️  Found ${thumbnailPolicies.length} thumbnail-specific policies`
    )

    if (thumbnailPolicies.length === 0) {
      console.log('⚠️  No thumbnail policies found. Creating them...')

      // Create thumbnail policies
      const thumbnailPolicySQL = `
        -- Policy: Allow public read access to thumbnails
        CREATE POLICY "Public read access to thumbnails" ON storage.objects
          FOR SELECT USING (bucket_id = 'thumbnails');

        -- Policy: Allow authenticated users to upload thumbnails  
        CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'thumbnails' 
            AND auth.role() = 'authenticated'
          );

        -- Policy: Allow authenticated users to update thumbnails
        CREATE POLICY "Authenticated users can update thumbnails" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'thumbnails'
            AND auth.role() = 'authenticated'
          );

        -- Policy: Allow authenticated users to delete thumbnails
        CREATE POLICY "Authenticated users can delete thumbnails" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'thumbnails'
            AND auth.role() = 'authenticated'
          );
      `

      const statements = thumbnailPolicySQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        console.log(`   Creating policy ${i + 1}/${statements.length}...`)

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        })

        if (error) {
          console.error(`❌ Error creating policy ${i + 1}:`, error)
          // Continue with other policies
        } else {
          console.log(`✅ Policy ${i + 1} created successfully`)
        }
      }
    } else {
      console.log('✅ Thumbnail policies already exist')
      thumbnailPolicies.forEach((policy) => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }

    // Test thumbnail access
    console.log('\n🧪 Testing thumbnail bucket access...')

    const { data: bucketFiles, error: listError } = await supabase.storage
      .from('thumbnails')
      .list('', { limit: 1 })

    if (listError) {
      console.error('❌ Error accessing thumbnails bucket:', listError)
      return false
    } else {
      console.log('✅ Thumbnails bucket is accessible')
    }

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Checking and fixing thumbnail policies...\n')

  const success = await checkAndFixPolicies()

  if (success) {
    console.log('\n🎉 Thumbnail policies check completed!')
    console.log('✨ Thumbnail uploads should now work properly.')
  } else {
    console.log('\n❌ Policy check failed. Please check the errors above.')
    process.exit(1)
  }
}

// Run the check
main().catch(console.error)
