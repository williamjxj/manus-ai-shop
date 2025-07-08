#!/usr/bin/env node

/**
 * Remove Unused Legacy Files Script
 *
 * This script removes unused legacy files from the codebase
 */

const fs = require('fs')
const path = require('path')

const UNUSED_FILES = [
  'src/lib/adult-media-utils.ts', // Legacy file, not used in current app
  'src/app/upload/page-old.tsx', // Old upload page, replaced by current one
]

function removeUnusedFiles() {
  console.log('🗑️  Removing unused legacy files...')

  let removedCount = 0

  UNUSED_FILES.forEach((filePath) => {
    const fullPath = path.join(__dirname, '..', filePath)

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
        console.log(`   ✅ Removed: ${filePath}`)
        removedCount++
      } catch (error) {
        console.log(`   ❌ Failed to remove ${filePath}: ${error.message}`)
      }
    } else {
      console.log(`   ⚠️  File not found: ${filePath}`)
    }
  })

  console.log(`\n🎉 Cleanup complete! Removed ${removedCount} unused files.`)
}

removeUnusedFiles()
