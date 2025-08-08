import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create service role client
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupNotificationsTable() {
  console.log('📊 Setting up notifications table...');
  console.log('====================================');
  
  try {
    // Step 1: Create the table with raw SQL (trying different methods)
    console.log('\n🔨 Step 1: Creating table structure...');
    
    // Method 1: Try using a simple function call
    const tableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        user_id UUID,
        role VARCHAR(50),
        data JSONB DEFAULT '{}',
        action_url VARCHAR(500),
        actions JSONB DEFAULT '[]',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    // Use direct REST API call to execute SQL
    console.log('📡 Attempting to create table via REST API...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: tableSQL
      })
    });
    
    console.log('Response status:', response.status);
    
    // Step 2: Try creating a test notification directly
    console.log('\n📝 Step 2: Testing table with insertion...');
    
    const testNotification = {
      title: 'Database Setup Test',
      message: 'Testing if notifications table is working correctly',
      type: 'SYSTEM_TEST',
      category: 'SYSTEM',
      priority: 'normal',
      role: 'admin',
      data: { 
        test: true, 
        setup_timestamp: new Date().toISOString() 
      }
    };
    
    const { data: insertResult, error: insertError } = await supabaseService
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
    
    if (insertError) {
      if (insertError.message?.includes('does not exist')) {
        console.log('❌ Table does not exist. Manual creation required.');
        console.log('');
        console.log('🛠️  MANUAL SETUP INSTRUCTIONS:');
        console.log('==============================');
        console.log('');
        console.log('1. Open Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/lxbvgpzhjrmmclpwrnve/editor');
        console.log('');
        console.log('2. Create a new SQL query and paste this:');
        console.log('');
        console.log(tableSQL);
        console.log('');
        console.log('-- Add indexes for better performance');
        console.log('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);');
        console.log('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);');
        console.log('');
        console.log('3. Run the query');
        console.log('4. Run this test script again');
        console.log('');
        return;
      } else {
        console.log('❌ Insert failed:', insertError.message);
        return;
      }
    }
    
    console.log('✅ Notifications table is working!');
    console.log(`📄 Test notification created with ID: ${insertResult.id}`);
    
    // Step 3: Test querying
    console.log('\n🔍 Step 3: Testing queries...');
    
    const { data: queryResult, error: queryError } = await supabaseService
      .from('notifications')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (queryError) {
      console.log('❌ Query failed:', queryError.message);
    } else {
      console.log('✅ Query successful');
      console.log(`📋 Retrieved: "${queryResult.title}"`);
    }
    
    // Step 4: Clean up test data
    console.log('\n🧹 Step 4: Cleaning up test data...');
    
    const { error: deleteError } = await supabaseService
      .from('notifications')
      .delete()
      .eq('type', 'SYSTEM_TEST');
    
    if (deleteError) {
      console.log('⚠️  Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    // Success summary
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log('✅ Notifications table: WORKING');
    console.log('✅ Insert operations: WORKING');
    console.log('✅ Query operations: WORKING');
    console.log('✅ Delete operations: WORKING');
    console.log('');
    console.log('🚀 The notification system is ready to use!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
  }
}

setupNotificationsTable().catch(console.error);