import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority
} from '@/lib/notifications/realtime-notification-system'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get available users from database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('is_active', true)
      .limit(10)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No active users found' },
        { status: 404 }
      )
    }

    const results = []

    // Test 1: Send NORMAL priority notification to first doctor
    const doctor = users.find(u => u.role === 'doctor')
    if (doctor) {
      const { data: normalNotification, error: normalError } = await supabase
        .from('notifications')
        .insert({
          title: 'Test Notification - Normal Priority',
          message: `Hello ${doctor.full_name}, this is a test notification with normal priority.`,
          type: 'patient_arrival',
          category: 'patient_care',
          priority: 'normal',
          user_id: doctor.id,
          data: { test: true, user_role: doctor.role },
          action_url: '/doctor/dashboard',
          is_read: false
        })
        .select('id')
        .single()

      if (normalError) {
        console.error('Error creating normal notification:', normalError)
      } else {
        results.push({
          type: 'user_notification',
          user: doctor.email,
          priority: 'normal',
          notification_id: normalNotification?.id
        })
      }
    }

    // Test 2: Send HIGH priority notification to receptionist role
    const { data: highNotification, error: highError } = await supabase
      .from('notifications')
      .insert({
        title: 'Test Alert - High Priority',
        message: 'A new patient has arrived and needs immediate attention at the front desk.',
        type: 'patient_arrival',
        category: 'patient_care',
        priority: 'high',
        role: 'receptionist',
        data: { 
          test: true, 
          patient_name: 'Test Patient',
          arrival_time: new Date().toISOString()
        },
        action_url: '/receptionist/queue',
        actions: [
          {
            id: 'acknowledge',
            label: 'Acknowledge',
            action: 'acknowledge',
            style: 'primary'
          },
          {
            id: 'view_queue',
            label: 'View Queue',
            action: 'navigate',
            url: '/receptionist/queue',
            style: 'secondary'
          }
        ],
        is_read: false
      })
      .select('id')
      .single()

    if (highError) {
      console.error('Error creating high priority notification:', highError)
    } else {
      results.push({
        type: 'role_notification',
        role: 'receptionist',
        priority: 'high',
        notification_id: highNotification?.id
      })
    }

    // Test 3: Send URGENT notification to pharmacist role
    const { data: urgentNotification, error: urgentError } = await supabase
      .from('notifications')
      .insert({
        title: 'Low Stock Alert - Urgent',
        message: 'Paracetamol is running critically low (5 units remaining). Immediate restocking required.',
        type: 'medication_out_of_stock',
        category: 'pharmacy',
        priority: 'urgent',
        role: 'pharmacist',
        data: { 
          test: true,
          medicine_name: 'Paracetamol',
          current_stock: 5,
          minimum_stock: 50
        },
        action_url: '/pharmacy/inventory',
        actions: [
          {
            id: 'reorder',
            label: 'Reorder Now',
            action: 'navigate',
            url: '/pharmacy/inventory?reorder=paracetamol',
            style: 'primary'
          }
        ],
        is_read: false
      })
      .select('id')
      .single()

    if (urgentError) {
      console.error('Error creating urgent notification:', urgentError)
    } else {
      results.push({
        type: 'role_notification',
        role: 'pharmacist',
        priority: 'urgent',
        notification_id: urgentNotification?.id
      })
    }

    // Test 4: Send CRITICAL emergency alert to admin
    const { data: criticalNotification, error: criticalError } = await supabase
      .from('notifications')
      .insert({
        title: 'CRITICAL: System Security Alert',
        message: 'Multiple failed login attempts detected from suspicious IP addresses. Immediate attention required.',
        type: 'security_alert',
        category: 'emergency',
        priority: 'critical',
        role: 'admin',
        data: { 
          test: true,
          suspicious_ip: '192.168.1.100',
          failed_attempts: 15,
          timestamp: new Date().toISOString()
        },
        actions: [
          {
            id: 'investigate',
            label: 'Investigate',
            action: 'navigate',
            url: '/admin/security/logs',
            style: 'danger'
          }
        ],
        is_read: false
      })
      .select('id')
      .single()

    if (criticalError) {
      console.error('Error creating critical notification:', criticalError)
    } else {
      results.push({
        type: 'role_notification',
        role: 'admin',
        priority: 'critical',
        notification_id: criticalNotification?.id
      })
    }

    // Test 5: Send specific user notification to admin
    const admin = users.find(u => u.role === 'admin')
    if (admin) {
      const { data: adminNotification, error: adminError } = await supabase
        .from('notifications')
        .insert({
          title: 'System Report Available',
          message: 'Daily system health report is ready for review. All services are operating normally.',
          type: 'system_maintenance',
          category: 'system',
          priority: 'normal',
          user_id: admin.id,
          data: { 
            test: true,
            report_date: new Date().toDateString(),
            system_health: 'good'
          },
          action_url: '/admin/reports/daily',
          actions: [
            {
              id: 'view_report',
              label: 'View Report',
              action: 'navigate',
              url: '/admin/reports/daily',
              style: 'primary'
            },
            {
              id: 'download',
              label: 'Download PDF',
              action: 'download',
              style: 'secondary'
            }
          ],
          is_read: false
        })
        .select('id')
        .single()

      if (adminError) {
        console.error('Error creating admin notification:', adminError)
      } else {
        results.push({
          type: 'user_notification',
          user: admin.email,
          priority: 'normal',
          notification_id: adminNotification?.id
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test notifications sent successfully',
      notifications_sent: results.length,
      results,
      users_available: users.map(u => ({ 
        email: u.email, 
        role: u.role, 
        name: u.full_name 
      }))
    })

  } catch (error) {
    console.error('Error sending test notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send test notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Notification API',
    usage: 'Send a POST request to create test notifications',
    available_tests: [
      'Normal priority user notification to doctor',
      'High priority role notification to receptionists', 
      'Urgent priority role notification to pharmacists',
      'Critical emergency alert to admins',
      'System notification with actions to admin'
    ]
  })
}