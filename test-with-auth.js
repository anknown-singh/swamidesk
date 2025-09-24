const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function testWithAuth() {
  console.log('🔍 Testing realtime with user authentication...\n')

  try {
    // First, sign in as the test pharmacist
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pharmacist1@swamidesk.com',
      password: 'password123'
    })

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    console.log('✅ Signed in as:', authData.user.email)
    console.log('🔑 User ID:', authData.user.id)
    
    // Now test realtime subscription
    console.log('\n🔌 Testing authenticated realtime subscription...')
    
    const channel = supabase
      .channel('test-auth-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'category=eq.pharmacy'
      }, (payload) => {
        console.log('✅ Received notification:', payload.new.title)
      })
      .subscribe((status) => {
        console.log('📡 Channel status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed with authentication!')
          
          setTimeout(async () => {
            console.log('\n📨 Inserting authenticated test notification...')
            const { error } = await supabase
              .from('notifications')
              .insert({
                title: 'Authenticated Test',
                message: 'Testing with authenticated user',
                type: 'medication_out_of_stock',
                category: 'pharmacy',
                priority: 'normal',
                role: 'pharmacist',
                is_read: false
              })

            if (error) {
              console.error('❌ Insert error:', error)
            } else {
              console.log('✅ Notification inserted with auth')
            }
          }, 1000)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ Connection failed:', status)
        }
      })

    setTimeout(() => {
      console.log('\n🔧 Cleaning up...')
      supabase.removeChannel(channel)
      process.exit(0)
    }, 5000)

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testWithAuth()