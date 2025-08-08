import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxbvgpzhjrmmclpwrnve.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YnZncHpoanJtbWNscHdybnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzg2NzYsImV4cCI6MjA2OTkxNDY3Nn0.c1P9s9Oe8qPha0yioq3BmSos10AEGrZeBEi3EwcI58M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createNotificationsTable() {
  console.log('📊 Testing notifications table...');
  
  try {
    // Test creating a notification directly to check if table exists
    console.log('🧪 Testing table by inserting a test record...');
    
    const testNotification = {
      title: 'Table Creation Test',
      message: 'Testing if we can create and insert into notifications table',
      type: 'SYSTEM_TEST',
      category: 'SYSTEM',
      priority: 'normal',
      role: 'admin',
      data: { test: true }
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('notifications')
      .insert([testNotification])
      .select()
      .single();
    
    if (insertError) {
      console.log('Insert error details:', insertError);
      if (insertError.message && insertError.message.includes('does not exist')) {
        console.log('❌ Table does not exist and cannot be created with current permissions');
        console.log('');
        console.log('📝 Manual Setup Required:');
        console.log('========================');
        console.log('');
        console.log('1. Go to Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/lxbvgpzhjrmmclpwrnve/editor');
        console.log('');
        console.log('2. Execute this SQL in the SQL Editor:');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS notifications (
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Add Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow role-based notifications for authenticated users  
CREATE POLICY "Users can read role-based notifications" ON notifications
FOR SELECT USING (
  auth.jwt() ->> 'role' = role OR role IS NULL
);

-- Allow service role to insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);`);
        console.log('');
        console.log('3. After creating the table, run the test again');
        console.log('');
      } else {
        console.error('❌ Insert failed:', insertError.message);
        console.error('Full error:', insertError);
      }
    } else {
      console.log('✅ Notifications table exists and working!');
      console.log('📝 Created test notification:', insertTest.title);
      console.log('🔍 Notification ID:', insertTest.id);
      
      // Test reading the notification back
      const { data: readTest, error: readError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', insertTest.id)
        .single();
      
      if (readError) {
        console.log('⚠️ Could not read back notification:', readError.message);
      } else {
        console.log('✅ Successfully read back the notification');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createNotificationsTable().catch(console.error);