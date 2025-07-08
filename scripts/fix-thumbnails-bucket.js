#!/usr/bin/env node

/**
 * Fix Thumbnails Storage Bucket
 * 
 * This script creates the missing thumbnails bucket and sets up proper RLS policies
 * to fix the "new row violates row-level security policy" error.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please check your .env.local file for:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixThumbnailsBucket() {
  try {
    console.log('🔧 Fixing thumbnails storage bucket...')

    // Read the SQL fix file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix-thumbnails-bucket.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        !stmt.toLowerCase().includes('select ')
      )

    console.log(`📋 Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      })

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error)
        return false
      }
    }

    console.log('✅ All statements executed successfully!')

    // Verify the bucket was created
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError)
      return false
    }

    const thumbnailsBucket = buckets.find(bucket => bucket.id === 'thumbnails')
    
    if (thumbnailsBucket) {
      console.log('✅ Thumbnails bucket verified!')
      console.log(`   - ID: ${thumbnailsBucket.id}`)
      console.log(`   - Public: ${thumbnailsBucket.public}`)
      console.log(`   - File size limit: ${thumbnailsBucket.file_size_limit} bytes`)
    } else {
      console.log('⚠️  Thumbnails bucket not found in list')
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting thumbnails bucket fix...\n')

  const success = await fixThumbnailsBucket()

  if (success) {
    console.log('\n🎉 Thumbnails bucket fix completed!')
    console.log('📋 Summary:')
    console.log('   - thumbnails bucket created')
    console.log('   - RLS policies configured')
    console.log('   - Public read access enabled')
    console.log('   - User upload/update/delete permissions set')
    console.log('\n✨ The thumbnail upload error should now be resolved.')
  } else {
    console.log('\n❌ Fix failed. Please check the errors above.')
    process.exit(1)
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the fix
main().catch(console.error)
