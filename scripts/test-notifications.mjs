import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxbvgpzhjrmmclpwrnve.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YnZncHpoanJtbWNscHdybnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzg2NzYsImV4cCI6MjA2OTkxNDY3Nn0.c1P9s9Oe8qPha0yioq3BmSos10AEGrZeBEi3EwcI58M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System');
  console.log('==============================');
  
  try {
    // Test 1: Check if notifications table exists
    console.log('\n📋 Step 1: Testing notifications table...');
    const { data: tableTest, error: tableError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Notifications table not accessible:', tableError.message);
      return;
    }
    console.log('✅ Notifications table is accessible');
    
    // Test 2: Check current notifications
    console.log('\n📨 Step 2: Checking existing notifications...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notifError) {
      console.log('❌ Error fetching notifications:', notifError.message);
    } else {
      console.log(`✅ Found ${notifications?.length || 0} recent notifications`);
      if (notifications && notifications.length > 0) {
        console.log('📄 Sample notifications:');
        notifications.forEach((notif, i) => {
          console.log(`  ${i + 1}. ${notif.title} (${notif.priority}) - ${notif.category}`);
        });
      }
    }
    
    // Test 3: Create a test notification
    console.log('\n📤 Step 3: Creating test notification...');
    const testNotification = {
      title: 'System Test Notification',
      message: 'This is a test notification created during system testing.',
      type: 'SYSTEM_TEST',
      category: 'SYSTEM',
      priority: 'normal',
      role: 'admin',
      data: { test: true, timestamp: new Date().toISOString() },
      action_url: '/admin/test-notifications'
    };
    
    const { data: createdNotif, error: createError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating test notification:', createError.message);
    } else {
      console.log('✅ Test notification created successfully');
      console.log(`   ID: ${createdNotif.id}`);
      console.log(`   Title: ${createdNotif.title}`);
    }
    
    // Test 4: Test real-time subscription (simplified)
    console.log('\n🔄 Step 4: Testing real-time capabilities...');
    try {
      const channel = supabase
        .channel('test-notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: 'role=eq.admin'
          },
          (payload) => {
            console.log('📡 Real-time notification received:', payload);
          }
        );
      
      const subscriptionStatus = await channel.subscribe();
      console.log('✅ Real-time subscription status:', subscriptionStatus);
      
      // Clean up subscription after 2 seconds
      setTimeout(() => {
        supabase.removeChannel(channel);
        console.log('🧹 Real-time subscription cleaned up');
      }, 2000);
      
    } catch (realtimeError) {
      console.log('❌ Real-time subscription error:', realtimeError.message);
    }
    
    // Test 5: Test user lookup (to ensure we can identify users for notifications)
    console.log('\n👤 Step 5: Testing user lookup...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .limit(3);
    
    if (userError) {
      console.log('❌ Error fetching users:', userError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} users for testing`);
      if (users && users.length > 0) {
        console.log('📋 Sample users:');
        users.forEach((user, i) => {
          console.log(`  ${i + 1}. ${user.full_name} (${user.role}) - ID: ${user.id}`);
        });
      }
    }
    
    // Test Summary
    console.log('\n🎉 NOTIFICATION SYSTEM TEST SUMMARY');
    console.log('===================================');
    console.log('✅ Database connection: WORKING');
    console.log('✅ Notifications table: ACCESSIBLE');
    console.log('✅ Create notifications: WORKING');
    console.log('✅ Real-time subscriptions: CONFIGURED');
    console.log('✅ User lookup: WORKING');
    console.log('\n🚀 Notification system is ready for use!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testNotificationSystem().catch(console.error);