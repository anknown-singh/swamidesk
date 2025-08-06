import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { setupTestUser, cleanupTestData, createMockRealtimeClient } from '../utils/e2e-helpers'

test.describe('Complete Appointment Workflow E2E', () => {
  let receptionistPage: Page
  let doctorPage: Page
  let patientPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    
    // Create pages for different user roles
    receptionistPage = await context.newPage()
    doctorPage = await context.newPage()
    patientPage = await context.newPage()

    // Setup test users and mock data
    await setupTestUser(receptionistPage, 'receptionist')
    await setupTestUser(doctorPage, 'doctor')
  })

  test.afterAll(async () => {
    await cleanupTestData()
    await context.close()
  })

  test.describe('Patient Appointment Booking Flow', () => {
    test('should allow patient to book appointment through public interface', async () => {
      await patientPage.goto('/book-appointment')
      
      // Step 1: Select appointment type
      await expect(patientPage.locator('h1')).toContainText('Book Your Appointment')
      await patientPage.click('text=New Consultation')
      await patientPage.click('button:has-text("Next")')

      // Step 2: Select department
      await patientPage.click('text=General Medicine')
      await patientPage.click('button:has-text("Next")')

      // Step 3: Select doctor
      await patientPage.click('text=Dr. Sarah Smith')
      await patientPage.click('button:has-text("Next")')

      // Step 4: Select date and time
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      await patientPage.click(`[data-date="${dateStr}"]`)
      await patientPage.click('text=10:00 AM')
      await patientPage.click('button:has-text("Next")')

      // Step 5: Fill patient details
      await patientPage.fill('input[name="name"]', 'John Doe')
      await patientPage.fill('input[name="mobile"]', '+91-9876543210')
      await patientPage.fill('input[name="email"]', 'john.doe@email.com')
      await patientPage.fill('textarea[name="reason"]', 'Regular health checkup')
      await patientPage.click('button:has-text("Next")')

      // Step 6: Confirm appointment
      await expect(patientPage.locator('text=Review and confirm')).toBeVisible()
      await expect(patientPage.locator('text=John Doe')).toBeVisible()
      await expect(patientPage.locator('text=Dr. Sarah Smith')).toBeVisible()
      
      await patientPage.check('input[type="checkbox"]') // Terms agreement
      await patientPage.click('button:has-text("Confirm Appointment")')

      // Should show success message
      await expect(patientPage.locator('text=Appointment Booked Successfully')).toBeVisible()
      await expect(patientPage.locator('text=confirmation SMS and email')).toBeVisible()
    })

    test('should validate required fields during booking', async () => {
      await patientPage.goto('/book-appointment')
      
      // Try to proceed without selecting appointment type
      await patientPage.click('button:has-text("Next")')
      await expect(patientPage.locator('button:has-text("Next")')).toBeDisabled()

      // Select type and proceed to next step
      await patientPage.click('text=New Consultation')
      await patientPage.click('button:has-text("Next")')

      // Skip department selection and try next
      await patientPage.click('button:has-text("Next")')
      await expect(patientPage.locator('button:has-text("Next")')).toBeDisabled()
    })

    test('should handle appointment slot conflicts', async () => {
      await patientPage.goto('/book-appointment')
      
      // Book appointment for specific slot
      await patientPage.click('text=New Consultation')
      await patientPage.click('button:has-text("Next")')
      await patientPage.click('text=General Medicine')
      await patientPage.click('button:has-text("Next")')
      await patientPage.click('text=Dr. Sarah Smith')
      await patientPage.click('button:has-text("Next")')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      await patientPage.click(`[data-date="${dateStr}"]`)
      
      // If slot is already booked, should not be available
      const unavailableSlots = patientPage.locator('.slot-unavailable')
      const availableSlots = patientPage.locator('.slot-available')
      
      await expect(availableSlots.first()).toBeVisible()
    })
  })

  test.describe('Receptionist Appointment Management', () => {
    test('should allow receptionist to book appointments for patients', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Open booking form
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Fill appointment form
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="appointment_type"]', 'consultation')
      await receptionistPage.selectOption('select[name="department"]', 'general')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      await receptionistPage.selectOption('select[name="scheduled_time"]', '14:30')
      
      await receptionistPage.fill('input[name="title"]', 'Follow-up Consultation')
      await receptionistPage.fill('textarea[name="notes"]', 'Patient requested follow-up')
      
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Should show success and appointment in calendar
      await expect(receptionistPage.locator('text=Appointment booked successfully')).toBeVisible()
      await expect(receptionistPage.locator('text=Follow-up Consultation')).toBeVisible()
    })

    test('should manage appointment status and confirmations', async () => {
      await receptionistPage.goto('/receptionist/appointment-management')
      
      // Should show appointment list
      await expect(receptionistPage.locator('h1:has-text("Appointment Management")')).toBeVisible()
      
      // Select an appointment to manage
      await receptionistPage.click('[data-testid="appointment-item"]:first-child')
      
      // Should show status management panel
      await expect(receptionistPage.locator('text=Appointment Status')).toBeVisible()
      
      // Send confirmation
      await receptionistPage.click('button:has-text("Send Reminder")')
      await receptionistPage.click('button:has-text("SMS")')
      
      await expect(receptionistPage.locator('text=Reminder sent')).toBeVisible()
      
      // Update status
      await receptionistPage.click('button:has-text("Confirm")')
      await receptionistPage.click('button:has-text("Confirm")')
      
      await expect(receptionistPage.locator('text=Status updated')).toBeVisible()
    })

    test('should handle bulk appointment confirmations', async () => {
      await receptionistPage.goto('/receptionist/appointment-management')
      
      // Switch to confirmations tab
      await receptionistPage.click('button:has-text("Confirmations")')
      
      // Switch to bulk send
      await receptionistPage.click('button:has-text("Bulk Send")')
      
      // Select appointments
      await receptionistPage.check('input[type="checkbox"]:first-of-type') // Select all
      
      // Choose template
      await receptionistPage.selectOption('select[name="template"]', 'sms_confirmation')
      
      // Send bulk confirmations
      await receptionistPage.click('button:has-text("Send to")')
      
      await expect(receptionistPage.locator('text=Confirmations sent')).toBeVisible()
    })
  })

  test.describe('Real-time Updates and Collaboration', () => {
    test('should sync appointment updates across multiple users', async () => {
      // Receptionist books appointment
      await receptionistPage.goto('/receptionist/appointments')
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      await receptionistPage.selectOption('select[name="scheduled_time"]', '15:00')
      
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Doctor should see the appointment in real-time
      await doctorPage.goto('/doctor/availability')
      
      // Wait for real-time update
      await doctorPage.waitForTimeout(1000)
      
      await expect(doctorPage.locator('text=15:00')).toBeVisible()
      await expect(doctorPage.locator('.appointment-slot')).toContainText('Booked')
    })

    test('should handle real-time queue updates', async () => {
      await receptionistPage.goto('/receptionist/queue')
      await doctorPage.goto('/doctor/consultations')
      
      // Receptionist adds patient to queue
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.click('button:has-text("Add Patient")')
      
      // Doctor should see patient in queue immediately
      await expect(doctorPage.locator('[data-testid="queue-item"]')).toBeVisible()
      
      // Doctor calls patient
      await doctorPage.click('button:has-text("Call Next")')
      
      // Receptionist should see status update
      await expect(receptionistPage.locator('text=In Consultation')).toBeVisible()
    })

    test('should handle concurrent appointment booking conflicts', async () => {
      // Two receptionists try to book same slot simultaneously
      const receptionist2Page = await context.newPage()
      await setupTestUser(receptionist2Page, 'receptionist')
      
      await receptionistPage.goto('/receptionist/appointments')
      await receptionist2Page.goto('/receptionist/appointments')
      
      // Both start booking same slot
      await Promise.all([
        receptionistPage.click('button:has-text("Book Appointment")'),
        receptionist2Page.click('button:has-text("Book Appointment")')
      ])
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      
      // Both try to book same time slot
      await Promise.all([
        receptionistPage.fill('input[name="scheduled_date"]', dateStr),
        receptionist2Page.fill('input[name="scheduled_date"]', dateStr)
      ])
      
      await Promise.all([
        receptionistPage.selectOption('select[name="scheduled_time"]', '16:00'),
        receptionist2Page.selectOption('select[name="scheduled_time"]', '16:00')
      ])
      
      // Fill rest of form
      await Promise.all([
        (async () => {
          await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
          await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
        })(),
        (async () => {
          await receptionist2Page.selectOption('select[name="patient_id"]', 'pat2')
          await receptionist2Page.selectOption('select[name="doctor_id"]', 'doc1')
        })()
      ])
      
      // Submit simultaneously
      await Promise.all([
        receptionistPage.click('button:has-text("Book Appointment")'),
        receptionist2Page.click('button:has-text("Book Appointment")')
      ])
      
      // One should succeed, one should get conflict error
      const successMessage = receptionistPage.locator('text=Appointment booked successfully')
      const conflictMessage = receptionist2Page.locator('text=Time slot no longer available')
      
      await Promise.race([
        expect(successMessage).toBeVisible(),
        expect(conflictMessage).toBeVisible()
      ])
      
      await receptionist2Page.close()
    })

    test('should maintain data consistency during network issues', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Simulate network interruption
      await receptionistPage.route('**/api/**', route => route.abort())
      
      // Try to book appointment during network issue
      await receptionistPage.click('button:has-text("Book Appointment")')
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Should show offline indicator or error
      await expect(receptionistPage.locator('text=Network error')).toBeVisible()
      
      // Restore network
      await receptionistPage.unroute('**/api/**')
      
      // Should sync when connection restored
      await receptionistPage.click('button:has-text("Retry")')
      await expect(receptionistPage.locator('text=Appointment booked')).toBeVisible()
    })
  })

  test.describe('Doctor Availability and Schedule Management', () => {
    test('should allow doctor to set availability', async () => {
      await doctorPage.goto('/doctor/availability')
      
      await expect(doctorPage.locator('h2:has-text("Doctor Availability")')).toBeVisible()
      
      // Add new schedule
      await doctorPage.click('button:has-text("Add Schedule")')
      
      await doctorPage.selectOption('select[name="day_of_week"]', '1') // Monday
      await doctorPage.fill('input[name="start_time"]', '09:00')
      await doctorPage.fill('input[name="end_time"]', '17:00')
      await doctorPage.fill('input[name="break_start_time"]', '13:00')
      await doctorPage.fill('input[name="break_end_time"]', '14:00')
      await doctorPage.fill('input[name="appointment_duration"]', '30')
      await doctorPage.fill('input[name="buffer_time"]', '5')
      
      await doctorPage.click('button:has-text("Add Schedule")')
      
      await expect(doctorPage.locator('text=Schedule added successfully')).toBeVisible()
      await expect(doctorPage.locator('text=Monday')).toBeVisible()
      await expect(doctorPage.locator('text=09:00 - 17:00')).toBeVisible()
    })

    test('should allow doctor to request leave', async () => {
      await doctorPage.goto('/doctor/availability')
      
      // Switch to leave tab
      await doctorPage.click('button:has-text("Leave")')
      
      // Add leave request
      await doctorPage.click('button:has-text("Add Leave")')
      
      await doctorPage.selectOption('select[name="leave_type"]', 'vacation')
      
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const weekAfter = new Date()
      weekAfter.setDate(weekAfter.getDate() + 14)
      
      await doctorPage.fill('input[name="start_date"]', nextWeek.toISOString().split('T')[0])
      await doctorPage.fill('input[name="end_date"]', weekAfter.toISOString().split('T')[0])
      await doctorPage.fill('input[name="reason"]', 'Annual vacation')
      
      await doctorPage.click('button:has-text("Add Leave")')
      
      await expect(doctorPage.locator('text=Leave request submitted')).toBeVisible()
      await expect(doctorPage.locator('text=Vacation')).toBeVisible()
      await expect(doctorPage.locator('text=Pending')).toBeVisible()
    })

    test('should block appointments during doctor leave', async () => {
      // Doctor requests leave
      await doctorPage.goto('/doctor/availability')
      await doctorPage.click('button:has-text("Leave")')
      await doctorPage.click('button:has-text("Add Leave")')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await doctorPage.selectOption('select[name="leave_type"]', 'sick')
      await doctorPage.fill('input[name="start_date"]', tomorrow.toISOString().split('T')[0])
      await doctorPage.fill('input[name="end_date"]', tomorrow.toISOString().split('T')[0])
      await doctorPage.click('button:has-text("Add Leave")')
      
      // Admin approves leave (simulated)
      // In real test, would need admin approval workflow
      
      // Receptionist tries to book appointment for that day
      await receptionistPage.goto('/receptionist/appointments')
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      
      // Should show no available slots
      await expect(receptionistPage.locator('text=No available slots')).toBeVisible()
    })
  })

  test.describe('Performance and Scalability', () => {
    test('should handle large appointment lists efficiently', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Simulate large number of appointments
      const startTime = Date.now()
      
      // Wait for page to load with many appointments
      await receptionistPage.waitForSelector('[data-testid="appointment-calendar"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
      
      // Test scrolling performance
      await receptionistPage.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      
      await receptionistPage.waitForTimeout(100)
      
      // Should remain responsive
      await expect(receptionistPage.locator('h1')).toBeVisible()
    })

    test('should handle multiple concurrent users', async () => {
      // Simulate multiple users accessing system simultaneously
      const users = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ])
      
      await Promise.all([
        setupTestUser(users[0], 'receptionist'),
        setupTestUser(users[1], 'doctor'),
        setupTestUser(users[2], 'admin')
      ])
      
      // All users navigate to their dashboards simultaneously
      await Promise.all([
        users[0].goto('/receptionist/appointments'),
        users[1].goto('/doctor/consultations'),
        users[2].goto('/admin/appointment-management')
      ])
      
      // All should load successfully
      await Promise.all([
        expect(users[0].locator('text=Appointments')).toBeVisible(),
        expect(users[1].locator('text=Consultations')).toBeVisible(),
        expect(users[2].locator('text=Appointment Management')).toBeVisible()
      ])
      
      // Clean up
      await Promise.all(users.map(page => page.close()))
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle API timeouts gracefully', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Simulate slow API response
      await receptionistPage.route('**/api/appointments**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        route.continue()
      })
      
      // Should show loading state
      await expect(receptionistPage.locator('text=Loading')).toBeVisible()
      
      // Should eventually timeout and show error
      await expect(receptionistPage.locator('text=Request timed out')).toBeVisible({
        timeout: 10000
      })
      
      // Should offer retry option
      await expect(receptionistPage.locator('button:has-text("Retry")')).toBeVisible()
    })

    test('should recover from temporary data corruption', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Simulate corrupted response
      await receptionistPage.route('**/api/appointments**', route => {
        route.fulfill({
          status: 200,
          body: '{"invalid": json}'
        })
      })
      
      await receptionistPage.reload()
      
      // Should handle parsing error and show fallback
      await expect(receptionistPage.locator('text=Error loading appointments')).toBeVisible()
      
      // Restore normal response
      await receptionistPage.unroute('**/api/appointments**')
      await receptionistPage.click('button:has-text("Refresh")')
      
      // Should recover and work normally
      await expect(receptionistPage.locator('text=Appointments')).toBeVisible()
    })

    test('should maintain offline functionality', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      // Wait for initial load
      await expect(receptionistPage.locator('text=Appointments')).toBeVisible()
      
      // Go offline
      await receptionistPage.context().setOffline(true)
      
      // Should show offline indicator
      await expect(receptionistPage.locator('text=Offline')).toBeVisible()
      
      // Should still show cached data
      await expect(receptionistPage.locator('[data-testid="appointment-calendar"]')).toBeVisible()
      
      // Go back online
      await receptionistPage.context().setOffline(false)
      
      // Should sync and remove offline indicator
      await expect(receptionistPage.locator('text=Offline')).not.toBeVisible()
    })
  })

  test.describe('Security and Access Control', () => {
    test('should enforce role-based access control', async () => {
      // Receptionist shouldn't access doctor-only pages
      await receptionistPage.goto('/doctor/consultations')
      await expect(receptionistPage.locator('text=Access denied')).toBeVisible()
      
      // Doctor shouldn't access admin pages
      await doctorPage.goto('/admin/users')
      await expect(doctorPage.locator('text=Unauthorized')).toBeVisible()
    })

    test('should validate appointment ownership and permissions', async () => {
      await receptionistPage.goto('/receptionist/appointment-management')
      
      // Try to modify appointment not created by this user
      await receptionistPage.click('[data-testid="appointment-item"]')
      
      // Should only allow appropriate actions based on role
      await expect(receptionistPage.locator('button:has-text("Delete")')).not.toBeVisible()
      await expect(receptionistPage.locator('button:has-text("Confirm")')).toBeVisible()
    })

    test('should sanitize user input and prevent XSS', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Try to inject script in appointment title
      const maliciousInput = '<script>alert("xss")</script>'
      await receptionistPage.fill('input[name="title"]', maliciousInput)
      
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      await receptionistPage.selectOption('select[name="scheduled_time"]', '10:00')
      
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Should sanitize the input
      await expect(receptionistPage.locator('script')).not.toBeAttached()
      await expect(receptionistPage.locator('text=&lt;script&gt;')).toBeVisible()
    })
  })
})