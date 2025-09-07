import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get recent test notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      )
    }

    // Filter test notifications (have test: true in data)
    const testNotifications = notifications?.filter(n => 
      n.data && typeof n.data === 'object' && (n.data as any).test === true
    ) || []

    return NextResponse.json({
      success: true,
      message: 'Notifications retrieved successfully',
      total_notifications: notifications?.length || 0,
      test_notifications: testNotifications.length,
      recent_notifications: notifications?.slice(0, 5).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message.substring(0, 100) + (n.message.length > 100 ? '...' : ''),
        type: n.type,
        category: n.category,
        priority: n.priority,
        user_id: n.user_id,
        role: n.role,
        is_test: n.data && typeof n.data === 'object' && (n.data as any).test === true,
        created_at: n.created_at
      })) || [],
      test_notifications_detail: testNotifications.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        priority: n.priority,
        target: n.user_id ? `user:${n.user_id}` : `role:${n.role}`,
        created_at: n.created_at,
        has_actions: n.actions && Array.isArray(n.actions) && n.actions.length > 0
      }))
    })

  } catch (error) {
    console.error('Error checking notifications:', error)
    return NextResponse.json(
      { error: 'Failed to check notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}