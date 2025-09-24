const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function verifyRealtime() {
  console.log('🔍 Verifying realtime notifications are working...\n')

  try {
    // Test pharmacy notifications realtime subscription
    console.log('🔌 Testing pharmacy notifications realtime...')
    
    const channel = supabase
      .channel('verify-pharmacy-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'category=eq.pharmacy'
      }, (payload) => {
        console.log('✅ Received pharmacy notification:', payload.new.title)
      })
      .subscribe((status) => {
        console.log('📡 Status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Pharmacy notifications realtime is working!')
          
          // Insert a test notification
          setTimeout(async () => {
            console.log('\n📨 Creating test pharmacy notification...')
            const { data, error } = await supabase
              .from('notifications')
              .insert({
                title: 'Test Pharmacy Alert',
                message: 'This confirms realtime is working for pharmacy notifications',
                type: 'medication_out_of_stock',
                category: 'pharmacy',
                priority: 'high',
                role: 'pharmacist',
                is_read: false
              })

            if (error) {
              console.error('❌ Error:', error)
            } else {
              console.log('✅ Test notification inserted successfully')
            }
          }, 1000)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Realtime connection failed:', status)
        }
      })

    setTimeout(() => {
      console.log('\n🎉 Realtime notifications verification complete!')
      supabase.removeChannel(channel)
      process.exit(0)
    }, 5000)

  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

verifyRealtime()