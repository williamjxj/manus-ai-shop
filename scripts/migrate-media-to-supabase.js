#!/usr/bin/env node

/**
 * Migrate Local Media Files to Supabase Storage
 *
 * This script moves all MP4 files from /public/media/ to Supabase storage 'cdnmedia' bucket
 * and provides the CDN URLs for updating the homepage.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET_NAME = 'cdnmedia'
const LOCAL_MEDIA_DIR = path.join(process.cwd(), 'public', 'media')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkBucketExists() {
  log('🔍 Checking if cdnmedia bucket exists...', 'blue')

  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    log(`❌ Error checking buckets: ${error.message}`, 'red')
    return false
  }

  const bucketExists = buckets.some((bucket) => bucket.id === BUCKET_NAME)

  if (bucketExists) {
    log('✅ cdnmedia bucket exists', 'green')
    return true
  } else {
    log('⚠️  cdnmedia bucket does not exist', 'yellow')
    return false
  }
}

async function createBucket() {
  log('🗂️  Creating cdnmedia bucket...', 'blue')

  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    fileSizeLimit: 100 * 1024 * 1024, // 100MB
  })

  if (error) {
    log(`❌ Error creating bucket: ${error.message}`, 'red')
    return false
  }

  log('✅ cdnmedia bucket created successfully', 'green')
  return true
}

async function getLocalMediaFiles() {
  log('📁 Scanning local media directory...', 'blue')

  if (!fs.existsSync(LOCAL_MEDIA_DIR)) {
    log(`❌ Local media directory not found: ${LOCAL_MEDIA_DIR}`, 'red')
    return []
  }

  const files = fs
    .readdirSync(LOCAL_MEDIA_DIR)
    .filter((file) => file.toLowerCase().endsWith('.mp4'))
    .map((file) => ({
      name: file,
      path: path.join(LOCAL_MEDIA_DIR, file),
      size: fs.statSync(path.join(LOCAL_MEDIA_DIR, file)).size,
    }))

  log(`📊 Found ${files.length} MP4 files:`, 'cyan')
  files.forEach((file) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    log(`   • ${file.name} (${sizeMB} MB)`, 'cyan')
  })

  return files
}

async function uploadFileToSupabase(file) {
  log(`⬆️  Uploading ${file.name}...`, 'blue')

  try {
    const fileBuffer = fs.readFileSync(file.path)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(file.name, fileBuffer, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
        contentType: 'video/mp4',
      })

    if (error) {
      log(`❌ Failed to upload ${file.name}: ${error.message}`, 'red')
      return null
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name)

    log(`✅ Successfully uploaded ${file.name}`, 'green')
    log(`   📎 URL: ${publicUrl}`, 'cyan')

    return {
      fileName: file.name,
      publicUrl: publicUrl,
    }
  } catch (err) {
    log(`❌ Error uploading ${file.name}: ${err.message}`, 'red')
    return null
  }
}

async function generateUrlMapping(uploadedFiles) {
  log('\n📋 URL Mapping for Homepage Update:', 'magenta')
  log('='.repeat(60), 'magenta')

  const urlMapping = {}

  uploadedFiles.forEach((file) => {
    if (file) {
      const oldUrl = `/media/${file.fileName}`
      urlMapping[oldUrl] = file.publicUrl
      log(`${oldUrl} → ${file.publicUrl}`, 'cyan')
    }
  })

  return urlMapping
}

async function updateHomepageUrls(urlMapping) {
  const homepagePath = path.join(process.cwd(), 'src', 'app', 'page.tsx')

  if (!fs.existsSync(homepagePath)) {
    log(`❌ Homepage file not found: ${homepagePath}`, 'red')
    return false
  }

  log('\n🔄 Updating homepage URLs...', 'blue')

  let content = fs.readFileSync(homepagePath, 'utf8')
  let updated = false

  // Update the video array in homepage to use environment variables
  Object.keys(urlMapping).forEach((oldUrl) => {
    const filename = oldUrl.replace('/media/', '')
    const envTemplate = `\`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cdnmedia/${filename}\``

    if (content.includes(`'${oldUrl}'`)) {
      content = content.replace(`'${oldUrl}'`, envTemplate)
      updated = true
      log(`✅ Updated: ${oldUrl} → environment variable template`, 'green')
    }
  })

  // Also update any hardcoded /media/ references to use environment variables
  const mediaRegex = /\/media\/([^'"\s]+\.mp4)/g
  content = content.replace(mediaRegex, (match, filename) => {
    const envUrl =
      '${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cdnmedia/' +
      filename
    updated = true
    log(`✅ Updated regex match: ${match} → ${envUrl}`, 'green')
    return '`' + envUrl + '`'
  })

  if (updated) {
    // Create backup
    const backupPath = `${homepagePath}.backup-${Date.now()}`
    fs.writeFileSync(backupPath, fs.readFileSync(homepagePath))
    log(`💾 Backup created: ${backupPath}`, 'yellow')

    // Write updated content
    fs.writeFileSync(homepagePath, content)
    log('✅ Homepage updated successfully', 'green')
    return true
  } else {
    log('⚠️  No URLs found to update in homepage', 'yellow')
    return false
  }
}

async function main() {
  log('🚀 Starting Media Migration to Supabase Storage', 'magenta')
  log('='.repeat(60), 'magenta')

  // Check environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('❌ Missing Supabase environment variables', 'red')
    log(
      '   Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
      'red'
    )
    process.exit(1)
  }

  try {
    // Step 1: Check/create bucket
    const bucketExists = await checkBucketExists()
    if (!bucketExists) {
      const created = await createBucket()
      if (!created) {
        log('❌ Failed to create bucket. Exiting.', 'red')
        process.exit(1)
      }
    }

    // Step 2: Get local files
    const localFiles = await getLocalMediaFiles()
    if (localFiles.length === 0) {
      log('⚠️  No MP4 files found in local media directory', 'yellow')
      process.exit(0)
    }

    // Step 3: Upload files
    log('\n⬆️  Starting file uploads...', 'blue')
    const uploadPromises = localFiles.map((file) => uploadFileToSupabase(file))
    const uploadedFiles = await Promise.all(uploadPromises)

    const successfulUploads = uploadedFiles.filter((file) => file !== null)
    log(
      `\n📊 Upload Summary: ${successfulUploads.length}/${localFiles.length} files uploaded successfully`,
      'green'
    )

    if (successfulUploads.length === 0) {
      log('❌ No files were uploaded successfully', 'red')
      process.exit(1)
    }

    // Step 4: Generate URL mapping
    const urlMapping = await generateUrlMapping(successfulUploads)

    // Step 5: Update homepage
    const homepageUpdated = await updateHomepageUrls(urlMapping)

    // Step 6: Summary
    log('\n🎉 Migration Complete!', 'green')
    log('='.repeat(60), 'green')
    log(
      `✅ ${successfulUploads.length} files uploaded to Supabase storage`,
      'green'
    )
    if (homepageUpdated) {
      log('✅ Homepage URLs updated successfully', 'green')
    }
    log('\n📝 Next Steps:', 'yellow')
    log('1. Test the homepage to ensure videos load correctly', 'yellow')
    log(
      '2. If everything works, you can safely remove the public/media folder',
      'yellow'
    )
    log('3. Consider running: rm -rf public/media', 'yellow')
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run the migration
main()
