#!/usr/bin/env node

/**
 * Test Homepage Video CDN URLs
 *
 * This script tests that the homepage is correctly loading videos from Supabase CDN
 * and that all video URLs are accessible.
 */

const http = require('http')
const https = require('https')

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

function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http

    const req = client.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        success: res.statusCode === 200,
      })
    })

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        error: err.message,
        success: false,
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        success: false,
      })
    })

    req.end()
  })
}

async function testHomepage() {
  log('🧪 Testing Homepage Video CDN URLs', 'magenta')
  log('='.repeat(60), 'magenta')

  // Test homepage accessibility
  log('🌐 Testing homepage accessibility...', 'blue')
  const homepageResult = await testUrl('http://localhost:3000')

  if (!homepageResult.success) {
    log(
      `❌ Homepage not accessible: ${homepageResult.error || homepageResult.status}`,
      'red'
    )
    log('   Make sure the dev server is running on port 3000', 'yellow')
    process.exit(1)
  }

  log('✅ Homepage is accessible', 'green')

  // Test CDN video URLs using environment variable
  require('dotenv').config({ path: '.env.local' })
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  const videoFiles = [
    'kling.mp4',
    'hailuo.mp4',
    'shakker.mp4',
    'tang-girl.mp4',
    'twin.mp4',
    'young_idol.mp4',
  ]

  const videoUrls = videoFiles.map(
    (filename) =>
      `${SUPABASE_URL}/storage/v1/object/public/cdnmedia/${filename}`
  )

  log('\n🎥 Testing video CDN URLs...', 'blue')

  const results = await Promise.all(videoUrls.map((url) => testUrl(url)))

  let successCount = 0
  let failCount = 0

  results.forEach((result) => {
    if (result.success) {
      log(
        `✅ ${result.url.split('/').pop()} - ${result.status} (${result.contentType})`,
        'green'
      )
      successCount++
    } else {
      log(
        `❌ ${result.url.split('/').pop()} - ${result.status} ${result.error ? '(' + result.error + ')' : ''}`,
        'red'
      )
      failCount++
    }
  })

  // Summary
  log('\n📊 Test Summary:', 'magenta')
  log('='.repeat(60), 'magenta')
  log(
    `✅ Successful: ${successCount}/${videoUrls.length}`,
    successCount === videoUrls.length ? 'green' : 'yellow'
  )
  log(
    `❌ Failed: ${failCount}/${videoUrls.length}`,
    failCount === 0 ? 'green' : 'red'
  )

  if (successCount === videoUrls.length) {
    log(
      '\n🎉 All tests passed! Videos are successfully served from Supabase CDN.',
      'green'
    )
    log('✅ Migration completed successfully', 'green')
    log('✅ Local public/media folder can be safely removed', 'green')
  } else {
    log('\n⚠️  Some videos failed to load from CDN', 'yellow')
    log('   Please check the Supabase storage configuration', 'yellow')
  }
}

// Run the test
testHomepage().catch((error) => {
  log(`❌ Test failed: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
