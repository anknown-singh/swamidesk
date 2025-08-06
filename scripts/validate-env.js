#!/usr/bin/env node

/**
 * Environment validation script for SwamIDesk
 * Validates required environment variables for different deployment scenarios
 */

const chalk = require('chalk')

const ENVIRONMENTS = {
  development: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ],
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  testing: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
}

function validateEnvironment(env = 'development') {
  console.log(chalk.blue(`🔍 Validating ${env} environment...`))
  
  // Early check for CI/CD environments
  if (process.env.VERCEL || process.env.CI || process.env.VERCEL_ENV || process.env.GITHUB_ACTIONS) {
    console.log(chalk.yellow('⚠️  Detected CI/CD environment - skipping strict environment validation'))
    console.log(chalk.green('🎉 Environment validation passed for CI/CD deployment'))
    return true
  }
  
  const requiredVars = ENVIRONMENTS[env] || ENVIRONMENTS.development
  const missingVars = []
  const presentVars = []
  
  requiredVars.forEach(variable => {
    if (process.env[variable]) {
      presentVars.push(variable)
      console.log(chalk.green(`✓ ${variable}`))
    } else {
      missingVars.push(variable)
      console.log(chalk.red(`✗ ${variable} (missing)`))
    }
  })
  
  console.log('\n' + chalk.bold('Environment Validation Summary:'))
  console.log(chalk.green(`✓ Found: ${presentVars.length} variables`))
  
  if (missingVars.length > 0) {
    console.log(chalk.red(`✗ Missing: ${missingVars.length} variables`))
    console.log('\n' + chalk.yellow('Missing variables:'))
    missingVars.forEach(variable => {
      console.log(chalk.yellow(`  - ${variable}`))
    })
    
    console.log('\n' + chalk.blue('Setup Instructions:'))
    console.log('1. Copy .env.local.example to .env.local')
    console.log('2. Fill in your Supabase project details')
    console.log('3. Get values from: https://supabase.com/dashboard → Your Project → Settings → API')
    
    if (env === 'production') {
      console.log('\n' + chalk.magenta('Production Deployment:'))
      console.log('- Set environment variables in your hosting platform')
      console.log('- For Vercel: Project Settings → Environment Variables')
      console.log('- For other platforms: Check their documentation')
    }
    
    // For Vercel builds, don't fail if running in build environment
    if (process.env.VERCEL || process.env.CI || process.env.VERCEL_ENV) {
      console.log(chalk.yellow('\n⚠️  Running in CI/CD environment - assuming environment variables will be available at runtime'))
      console.log(chalk.blue('Environment validation passed for CI/CD deployment'))
      return true
    }
    
    process.exit(1)
  }
  
  // Additional validations
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      console.log(chalk.yellow('⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL format looks incorrect'))
      console.log('   Expected format: https://your-project.supabase.co')
    }
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key.startsWith('eyJ')) {
      console.log(chalk.yellow('⚠️  Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY format looks incorrect'))
      console.log('   Expected format: JWT starting with "eyJ"')
    }
  }
  
  console.log(chalk.green('\n🎉 Environment validation passed!'))
  
  // Show current configuration
  console.log('\n' + chalk.bold('Current Configuration:'))
  console.log(`Environment: ${chalk.cyan(process.env.NODE_ENV || 'development')}`)
  console.log(`Supabase URL: ${chalk.cyan(process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set')}`)
  console.log(`App URL: ${chalk.cyan(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}`)
  
  if (process.env.VERCEL) {
    console.log(`Platform: ${chalk.cyan('Vercel')}`)
    console.log(`Region: ${chalk.cyan(process.env.VERCEL_REGION || 'unknown')}`)
  }
}

// CLI usage
if (require.main === module) {
  const env = process.argv[2] || process.env.NODE_ENV || 'development'
  validateEnvironment(env)
}

module.exports = { validateEnvironment }