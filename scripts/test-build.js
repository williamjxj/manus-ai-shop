#!/usr/bin/env node

const { execSync } = require('child_process')

function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`)
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    })
    console.log(`✅ ${description} completed successfully`)
    return { success: true, output }
  } catch (error) {
    console.error(`❌ ${description} failed:`)
    console.error(error.stdout || error.message)
    return { success: false, error: error.stdout || error.message }
  }
}

function main() {
  console.log('🚀 Starting build test...\n')

  const commands = [
    {
      cmd: 'npm run type-check',
      desc: 'TypeScript type checking',
    },
    {
      cmd: 'npm run lint:check',
      desc: 'ESLint checking',
    },
    {
      cmd: 'npm run build',
      desc: 'Next.js build',
    },
  ]

  let allPassed = true

  for (const { cmd, desc } of commands) {
    const result = runCommand(cmd, desc)
    if (!result.success) {
      allPassed = false
      break
    }
  }

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 All checks passed! Build is ready for production.')
  } else {
    console.log('💥 Build failed. Please fix the errors above.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { runCommand }
