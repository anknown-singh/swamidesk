import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { setupTestUser, cleanupTestData, createMockRealtimeClient } from '../utils/e2e-helpers'

test.describe('Complete Real-time System Integration E2E', () => {
  let adminPage: Page
  let receptionistPage: Page
  let doctorPage: Page
  let pharmacistPage: Page
  let attendantPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    
    // Create pages for all user roles
    adminPage = await context.newPage()
    receptionistPage = await context.newPage()
    doctorPage = await context.newPage()
    pharmacistPage = await context.newPage()
    attendantPage = await context.newPage()

    // Setup test users for all roles
    await setupTestUser(adminPage, 'admin')
    await setupTestUser(receptionistPage, 'receptionist')
    await setupTestUser(doctorPage, 'doctor')
    await setupTestUser(pharmacistPage, 'pharmacist')
    await setupTestUser(attendantPage, 'attendant')
  })

  test.afterAll(async () => {
    await cleanupTestData()
    await context.close()
  })

  test.describe('Cross-Module Real-time Communication', () => {
    test('should sync patient registration across all modules in real-time', async () => {
      // Receptionist registers new patient
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Real-time')
      await receptionistPage.fill('input[name="last_name"]', 'Sync-Test')
      await receptionistPage.fill('input[name="date_of_birth"]', '1990-01-01')
      await receptionistPage.fill('input[name="mobile"]', '+91-9999888777')
      await receptionistPage.fill('input[name="email"]', 'realtime@test.com')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // All other users should see the new patient immediately
      await Promise.all([
        adminPage.goto('/admin/patients'),
        doctorPage.goto('/doctor/consultations'),
        pharmacistPage.goto('/pharmacy/pharmacy'),
        attendantPage.goto('/attendant/queue')
      ])

      // Wait for real-time sync
      await Promise.all([
        expect(adminPage.locator('text=Real-time Sync-Test')).toBeVisible(),
        expect(doctorPage.locator('option:has-text("Real-time Sync-Test")')).toBeVisible(),
        expect(pharmacistPage.locator('option:has-text("Real-time Sync-Test")')).toBeVisible(),
        expect(attendantPage.locator('option:has-text("Real-time Sync-Test")')).toBeVisible()
      ])
    })

    test('should propagate queue changes across all relevant modules', async () => {
      // Receptionist adds patient to queue
      await receptionistPage.goto('/receptionist/queue')
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.selectOption('select[name="visit_type"]', 'consultation')
      await receptionistPage.fill('textarea[name="reason"]', 'Real-time queue test')
      
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Doctor should see patient in queue
      await doctorPage.goto('/doctor/consultations')
      await expect(doctorPage.locator('text=Real-time queue test')).toBeVisible()
      
      // Attendant should see patient in queue
      await attendantPage.goto('/attendant/queue')
      await expect(attendantPage.locator('text=Real-time queue test')).toBeVisible()
      
      // Admin should see queue statistics update
      await adminPage.goto('/admin/queue')
      await expect(adminPage.locator('[data-testid="queue-count"]')).toContainText('1')
    })

    test('should sync appointment changes across all stakeholders', async () => {
      // Receptionist books appointment
      await receptionistPage.goto('/receptionist/appointments')
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      await receptionistPage.selectOption('select[name="scheduled_time"]', '14:00')
      
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      // Doctor should see appointment in their schedule
      await doctorPage.goto('/doctor/availability')
      await expect(doctorPage.locator('text=14:00')).toBeVisible()
      await expect(doctorPage.locator('.appointment-booked')).toBeVisible()
      
      // Admin should see appointment statistics update
      await adminPage.goto('/admin/appointment-management')
      await expect(adminPage.locator('[data-testid="appointments-today"]')).toBeVisible()
    })
  })

  test.describe('Real-time Medical Workflow', () => {
    test('should sync consultation workflow from queue to billing', async () => {
      // Start with patient in queue
      await receptionistPage.goto('/receptionist/queue')
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Doctor calls patient
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('button:has-text("Call Next")')
      
      // Receptionist should see status update
      await expect(receptionistPage.locator('text=In Consultation')).toBeVisible()
      
      // Doctor completes consultation
      await doctorPage.fill('textarea[name="consultation_notes"]', 'Patient doing well')
      await doctorPage.click('button:has-text("Complete Consultation")')
      
      // Should automatically appear in billing
      await receptionistPage.goto('/receptionist/billing')
      await expect(receptionistPage.locator('text=Ready for billing')).toBeVisible()
    })

    test('should sync prescription workflow from doctor to pharmacy to billing', async () => {
      // Doctor creates prescription
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      await doctorPage.click('button:has-text("Prescription")')
      
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Amoxicillin')
      await doctorPage.click('text=Amoxicillin 500mg')
      await doctorPage.fill('input[name="dosage"]', '500mg')
      await doctorPage.selectOption('select[name="frequency"]', 'TID')
      await doctorPage.click('button:has-text("Add to Prescription")')
      
      await doctorPage.click('button:has-text("Finalize Prescription")')
      
      // Pharmacist should see prescription in real-time
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.waitForSelector('[data-testid="new-prescription-notification"]', {
        timeout: 5000
      })
      await expect(pharmacistPage.locator('text=New prescription received')).toBeVisible()
      
      // Pharmacist dispenses medication
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('button:has-text("Complete Prescription")')
      
      // Billing should automatically include medication costs
      await receptionistPage.goto('/receptionist/billing')
      await expect(receptionistPage.locator('text=Prescription medications')).toBeVisible()
    })

    test('should handle emergency patient priority across all modules', async () => {
      // Register emergency patient
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Emergency')
      await receptionistPage.fill('input[name="last_name"]', 'Patient')
      await receptionistPage.fill('input[name="date_of_birth"]', '1980-01-01')
      await receptionistPage.fill('input[name="mobile"]', '+91-9999111222')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Add to priority queue
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="priority"]', 'emergency')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.fill('textarea[name="reason"]', 'Chest pain - emergency')
      
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // All stakeholders should see emergency alert
      await Promise.all([
        doctorPage.waitForSelector('[data-testid="emergency-alert"]'),
        attendantPage.waitForSelector('[data-testid="emergency-alert"]'),
        adminPage.goto('/admin/queue')
      ])
      
      await Promise.all([
        expect(doctorPage.locator('text=Emergency Patient')).toBeVisible(),
        expect(attendantPage.locator('text=EMERGENCY')).toBeVisible(),
        expect(adminPage.locator('[data-testid="emergency-count"]')).toContainText('1')
      ])
    })
  })

  test.describe('Real-time Dashboard Updates', () => {
    test('should update dashboard metrics across all user roles', async () => {
      // Get initial metrics
      await adminPage.goto('/admin/dashboard')
      const initialPatients = await adminPage.locator('[data-testid="total-patients"]').textContent()
      const initialVisits = await adminPage.locator('[data-testid="total-visits"]').textContent()
      
      // Receptionist registers new patient and adds to queue
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Dashboard')
      await receptionistPage.fill('input[name="last_name"]', 'Test')
      await receptionistPage.fill('input[name="date_of_birth"]', '1985-05-15')
      await receptionistPage.fill('input[name="mobile"]', '+91-8888777666')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Add to queue (creates visit)
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Admin dashboard should update in real-time
      await adminPage.waitForTimeout(2000) // Allow for real-time sync
      
      const updatedPatients = await adminPage.locator('[data-testid="total-patients"]').textContent()
      const updatedVisits = await adminPage.locator('[data-testid="total-visits"]').textContent()
      
      expect(parseInt(updatedPatients || '0')).toBe(parseInt(initialPatients || '0') + 1)
      expect(parseInt(updatedVisits || '0')).toBe(parseInt(initialVisits || '0') + 1)
    })

    test('should show real-time queue status across all dashboards', async () => {
      // Check queue status on multiple dashboards
      await Promise.all([
        receptionistPage.goto('/receptionist/dashboard'),
        doctorPage.goto('/doctor/dashboard'),
        attendantPage.goto('/attendant/dashboard')
      ])
      
      // Add patient to queue
      await receptionistPage.goto('/receptionist/queue')
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // All dashboards should show updated queue status
      await Promise.all([
        receptionistPage.goto('/receptionist/dashboard'),
        doctorPage.goto('/doctor/dashboard'),
        attendantPage.goto('/attendant/dashboard')
      ])
      
      await Promise.all([
        expect(receptionistPage.locator('[data-testid="queue-length"]')).toContainText('1'),
        expect(doctorPage.locator('[data-testid="my-queue-length"]')).toContainText('1'),
        expect(attendantPage.locator('[data-testid="queue-length"]')).toContainText('1')
      ])
    })

    test('should update revenue metrics in real-time', async () => {
      await adminPage.goto('/admin/dashboard')
      const initialRevenue = await adminPage.locator('[data-testid="daily-revenue"]').textContent()
      
      // Process payment
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      await receptionistPage.click('button:has-text("Process Payment")')
      
      await receptionistPage.selectOption('select[name="payment_method"]', 'cash')
      await receptionistPage.fill('input[name="amount_received"]', '1000')
      await receptionistPage.click('button:has-text("Complete Payment")')
      
      // Admin dashboard should show updated revenue
      await adminPage.waitForTimeout(2000)
      const updatedRevenue = await adminPage.locator('[data-testid="daily-revenue"]').textContent()
      
      expect(parseInt(updatedRevenue?.replace(/[^\d]/g, '') || '0')).toBeGreaterThan(
        parseInt(initialRevenue?.replace(/[^\d]/g, '') || '0')
      )
    })
  })

  test.describe('Real-time Inventory and Stock Updates', () => {
    test('should sync medication dispensing with inventory levels', async () => {
      // Check initial stock level
      await pharmacistPage.goto('/pharmacy/inventory')
      await pharmacistPage.fill('input[name="search"]', 'Paracetamol')
      await pharmacistPage.press('input[name="search"]', 'Enter')
      
      const initialStock = await pharmacistPage.locator('[data-testid="stock-level"]').textContent()
      
      // Dispense medication
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '10')
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Stock level should update in real-time
      await pharmacistPage.goto('/pharmacy/inventory')
      await pharmacistPage.fill('input[name="search"]', 'Paracetamol')
      await pharmacistPage.press('input[name="search"]', 'Enter')
      
      const updatedStock = await pharmacistPage.locator('[data-testid="stock-level"]').textContent()
      
      expect(parseInt(updatedStock || '0')).toBe(parseInt(initialStock || '0') - 10)
      
      // Admin should also see updated inventory
      await adminPage.goto('/admin/inventory')
      await adminPage.fill('input[name="search"]', 'Paracetamol')
      await adminPage.press('input[name="search"]', 'Enter')
      
      const adminViewStock = await adminPage.locator('[data-testid="stock-level"]').textContent()
      expect(parseInt(adminViewStock || '0')).toBe(parseInt(initialStock || '0') - 10)
    })

    test('should trigger low stock alerts across relevant users', async () => {
      // Simulate dispensing that brings stock below threshold
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      // Dispense large quantity to trigger low stock
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '80')
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // If stock goes below threshold, should trigger alerts
      const lowStockAlert = pharmacistPage.locator('[data-testid="low-stock-alert"]')
      if (await lowStockAlert.isVisible()) {
        // Admin should also receive alert
        await adminPage.waitForSelector('[data-testid="inventory-alert"]', { timeout: 5000 })
        await expect(adminPage.locator('text=Low Stock Alert')).toBeVisible()
        
        // Attendant responsible for inventory should see alert
        await attendantPage.waitForSelector('[data-testid="inventory-alert"]', { timeout: 5000 })
        await expect(attendantPage.locator('text=Inventory Alert')).toBeVisible()
      }
    })
  })

  test.describe('Real-time Notification System', () => {
    test('should deliver notifications to appropriate user roles', async () => {
      // Doctor creates urgent prescription
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      await doctorPage.click('button:has-text("Prescription")')
      
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Morphine')
      await doctorPage.click('text=Morphine 10mg')
      
      // Mark as urgent
      await doctorPage.check('input[name="urgent_prescription"]')
      await doctorPage.click('button:has-text("Finalize Prescription")')
      
      // Pharmacist should receive urgent notification
      await pharmacistPage.waitForSelector('[data-testid="urgent-prescription-alert"]', {
        timeout: 5000
      })
      await expect(pharmacistPage.locator('text=Urgent Prescription Alert')).toBeVisible()
      
      // Admin should also be notified for controlled substances
      await adminPage.waitForSelector('[data-testid="controlled-substance-alert"]', {
        timeout: 5000
      })
      await expect(adminPage.locator('text=Controlled Substance Prescribed')).toBeVisible()
    })

    test('should broadcast system-wide announcements', async () => {
      // Admin sends system announcement
      await adminPage.goto('/admin/settings')
      await adminPage.click('button:has-text("Send Announcement")')
      
      await adminPage.fill('textarea[name="announcement"]', 'System maintenance scheduled for tonight')
      await adminPage.selectOption('select[name="priority"]', 'high')
      await adminPage.selectOption('select[name="target_roles"]', 'all')
      
      await adminPage.click('button:has-text("Send Announcement")')
      
      // All users should receive the announcement
      await Promise.all([
        receptionistPage.waitForSelector('[data-testid="system-announcement"]'),
        doctorPage.waitForSelector('[data-testid="system-announcement"]'),
        pharmacistPage.waitForSelector('[data-testid="system-announcement"]'),
        attendantPage.waitForSelector('[data-testid="system-announcement"]')
      ])
      
      await Promise.all([
        expect(receptionistPage.locator('text=System maintenance scheduled')).toBeVisible(),
        expect(doctorPage.locator('text=System maintenance scheduled')).toBeVisible(),
        expect(pharmacistPage.locator('text=System maintenance scheduled')).toBeVisible(),
        expect(attendantPage.locator('text=System maintenance scheduled')).toBeVisible()
      ])
    })
  })

  test.describe('Real-time Performance and Reliability', () => {
    test('should handle connection loss and reconnection gracefully', async () => {
      // Simulate network interruption
      await receptionistPage.context().setOffline(true)
      
      // Should show offline indicator
      await expect(receptionistPage.locator('[data-testid="offline-indicator"]')).toBeVisible()
      
      // Try to perform action while offline
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Should show offline message
      await expect(receptionistPage.locator('text=You are currently offline')).toBeVisible()
      
      // Restore connection
      await receptionistPage.context().setOffline(false)
      
      // Should reconnect and sync data
      await expect(receptionistPage.locator('[data-testid="online-indicator"]')).toBeVisible()
      await expect(receptionistPage.locator('text=Connection restored')).toBeVisible()
    })

    test('should handle high-frequency updates without performance degradation', async () => {
      // Simulate rapid queue changes
      for (let i = 0; i < 10; i++) {
        await receptionistPage.goto('/receptionist/queue')
        await receptionistPage.click('button:has-text("Add to Queue")')
        await receptionistPage.selectOption('select[name="patient_id"]', `pat${i + 1}`)
        await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
        await receptionistPage.click('button:has-text("Add to Queue")')
        
        // Small delay to simulate rapid operations
        await receptionistPage.waitForTimeout(100)
      }
      
      // All pages should remain responsive
      const startTime = Date.now()
      
      await Promise.all([
        doctorPage.goto('/doctor/consultations'),
        adminPage.goto('/admin/queue'),
        attendantPage.goto('/attendant/queue')
      ])
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
      
      // All should show correct queue count
      await Promise.all([
        expect(doctorPage.locator('[data-testid="queue-count"]')).toContainText('10'),
        expect(adminPage.locator('[data-testid="queue-count"]')).toContainText('10'),
        expect(attendantPage.locator('[data-testid="queue-count"]')).toContainText('10')
      ])
    })

    test('should maintain data consistency across concurrent operations', async () => {
      // Multiple users perform operations simultaneously
      await Promise.all([
        // Receptionist books appointment
        (async () => {
          await receptionistPage.goto('/receptionist/appointments')
          await receptionistPage.click('button:has-text("Book Appointment")')
          await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
          await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
          
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
          await receptionistPage.selectOption('select[name="scheduled_time"]', '16:00')
          
          await receptionistPage.click('button:has-text("Book Appointment")')
        })(),
        
        // Doctor updates availability
        (async () => {
          await doctorPage.goto('/doctor/availability')
          await doctorPage.click('button:has-text("Add Schedule")')
          
          await doctorPage.selectOption('select[name="day_of_week"]', '2') // Tuesday
          await doctorPage.fill('input[name="start_time"]', '09:00')
          await doctorPage.fill('input[name="end_time"]', '18:00')
          
          await doctorPage.click('button:has-text("Add Schedule")')
        })(),
        
        // Pharmacist updates inventory
        (async () => {
          await pharmacistPage.goto('/pharmacy/inventory')
          await pharmacistPage.click('button:has-text("Add Stock")')
          
          await pharmacistPage.selectOption('select[name="medication_id"]', 'med1')
          await pharmacistPage.fill('input[name="quantity"]', '100')
          
          await pharmacistPage.click('button:has-text("Add Stock")')
        })()
      ])
      
      // All operations should complete successfully
      await Promise.all([
        expect(receptionistPage.locator('text=Appointment booked successfully')).toBeVisible(),
        expect(doctorPage.locator('text=Schedule added successfully')).toBeVisible(),
        expect(pharmacistPage.locator('text=Stock added successfully')).toBeVisible()
      ])
      
      // Data should be consistent across all views
      await adminPage.goto('/admin/dashboard')
      
      // Should reflect all changes
      await expect(adminPage.locator('[data-testid="appointments-count"]')).toBeVisible()
      await expect(adminPage.locator('[data-testid="doctor-schedules"]')).toBeVisible()
      await expect(adminPage.locator('[data-testid="inventory-updates"]')).toBeVisible()
    })
  })
})