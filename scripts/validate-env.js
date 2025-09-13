#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Environment validation script for SwamIDesk
 * Validates required environment variables before build/deployment
 */

const environment = process.argv[2] || 'development';

console.log(`🔍 Validating environment variables for: ${environment}`);

// Required environment variables for different environments
const requiredVars = {
  development: [
    // Development can work with minimal variables
  ],
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  test: [
    // Test environment variables
  ]
};

// Optional but recommended variables
const recommendedVars = {
  production: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]
};

const required = requiredVars[environment] || [];
const recommended = recommendedVars[environment] || [];

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('\n📋 Checking required environment variables...');
for (const varName of required) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
}

// Check recommended variables
if (recommended.length > 0) {
  console.log('\n⚠️  Checking recommended environment variables...');
  for (const varName of recommended) {
    if (!process.env[varName]) {
      console.warn(`⚠️  Missing recommended environment variable: ${varName}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }
}

// Validate Supabase URL format if present
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL is a valid URL');
  } catch (error) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    hasErrors = true;
  }
}

// Summary
console.log('\n📊 Validation Summary:');
if (hasErrors) {
  console.error('❌ Environment validation failed. Please fix the missing required variables.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  Environment validation completed with warnings.');
  if (environment === 'production') {
    console.log('🚀 Proceeding with build despite warnings...');
  }
} else {
  console.log('✅ All environment variables are properly configured.');
}

console.log(`🎉 Environment validation completed for ${environment}`);