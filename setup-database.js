#!/usr/bin/env node

/**
 * Database Setup Script for SwamiCare
 * This script helps set up the database schema and seed data
 * Run with: node setup-database.js
 */

const fs = require('fs');
const path = require('path');

function main() {
  console.log('🏥 SwamiCare Database Setup Helper\n');
  
  // Check if migrations exist
  const schemaPath = path.join(__dirname, 'supabase/migrations/20250804000001_initial_schema.sql');
  const rlsPath = path.join(__dirname, 'supabase/migrations/20250804000002_rls_policies.sql');
  const seedPath = path.join(__dirname, 'supabase/seed.sql');
  
  if (!fs.existsSync(schemaPath) || !fs.existsSync(rlsPath) || !fs.existsSync(seedPath)) {
    console.error('❌ Migration files not found. Please run this from the project root.');
    process.exit(1);
  }
  
  console.log('📋 Setup Instructions:');
  console.log('1. Create your Supabase project at https://supabase.com/dashboard');
  console.log('2. Go to Settings → API and copy your credentials');
  console.log('3. Create .env.local with your credentials');
  console.log('4. In Supabase SQL Editor, run these files IN ORDER:\n');
  
  console.log('   📄 Step 1 - Schema:');
  console.log('   Copy/paste content from: supabase/migrations/20250804000001_initial_schema.sql\n');
  
  console.log('   🔒 Step 2 - Security:');
  console.log('   Copy/paste content from: supabase/migrations/20250804000002_rls_policies.sql\n');
  
  console.log('   🌱 Step 3 - Demo Data:');
  console.log('   Copy/paste content from: supabase/seed.sql\n');
  
  console.log('5. Run: npm run dev');
  console.log('6. Login with: admin@swamicare.com / password123\n');
  
  console.log('🎯 Demo Accounts Ready:');
  console.log('   👤 Admin: admin@swamicare.com');
  console.log('   👨‍⚕️ Doctor: doctor@swamicare.com');
  console.log('   👩‍💼 Receptionist: receptionist@swamicare.com');
  console.log('   👨‍🔧 Attendant: attendant@swamicare.com');
  console.log('   💊 Pharmacist: pharmacist@swamicare.com');
  console.log('   🔑 Password: password123\n');
  
  console.log('📚 For detailed instructions, see: CLOUD_SETUP_GUIDE.md');
  console.log('✅ Foundation ready for testing!');
}

if (require.main === module) {
  main();
}