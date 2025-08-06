import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { setupTestUser, cleanupTestData, createMockPatientData } from '../utils/e2e-helpers'

test.describe('Complete Patient Registration and Queue Workflow E2E', () => {
  let receptionistPage: Page
  let doctorPage: Page
  let adminPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    
    receptionistPage = await context.newPage()
    doctorPage = await context.newPage()
    adminPage = await context.newPage()

    await setupTestUser(receptionistPage, 'receptionist')
    await setupTestUser(doctorPage, 'doctor')
    await setupTestUser(adminPage, 'admin')
  })

  test.afterAll(async () => {
    await cleanupTestData()
    await context.close()
  })

  test.describe('Patient Registration Flow', () => {
    test('should register new patient with complete details', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Should see patient management page
      await expect(receptionistPage.locator('h1:has-text("Patient Management")')).toBeVisible()
      
      // Click to add new patient
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Should open registration form
      await expect(receptionistPage.locator('h2:has-text("Patient Registration")')).toBeVisible()
      
      // Fill personal information
      await receptionistPage.fill('input[name="first_name"]', 'John')
      await receptionistPage.fill('input[name="last_name"]', 'Doe')
      await receptionistPage.fill('input[name="date_of_birth"]', '1985-06-15')
      await receptionistPage.selectOption('select[name="gender"]', 'male')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543210')
      await receptionistPage.fill('input[name="email"]', 'john.doe@email.com')
      
      // Fill address information
      await receptionistPage.fill('input[name="address_line_1"]', '123 Main Street')
      await receptionistPage.fill('input[name="address_line_2"]', 'Apt 4B')
      await receptionistPage.fill('input[name="city"]', 'Mumbai')
      await receptionistPage.fill('input[name="state"]', 'Maharashtra')
      await receptionistPage.fill('input[name="pincode"]', '400001')
      
      // Fill emergency contact
      await receptionistPage.fill('input[name="emergency_contact_name"]', 'Jane Doe')
      await receptionistPage.fill('input[name="emergency_contact_phone"]', '+91-9876543211')
      await receptionistPage.selectOption('select[name="emergency_contact_relationship"]', 'spouse')
      
      // Fill medical information
      await receptionistPage.fill('input[name="blood_group"]', 'O+')
      await receptionistPage.fill('textarea[name="known_allergies"]', 'Peanuts, Shellfish')
      await receptionistPage.fill('textarea[name="chronic_conditions"]', 'Hypertension')
      await receptionistPage.fill('textarea[name="current_medications"]', 'Lisinopril 10mg daily')
      
      // Fill insurance information
      await receptionistPage.fill('input[name="insurance_provider"]', 'HealthFirst Insurance')
      await receptionistPage.fill('input[name="policy_number"]', 'HF123456789')
      await receptionistPage.fill('input[name="group_number"]', 'GRP001')
      
      // Submit registration
      await receptionistPage.click('button:has-text("Register Patient")')
      
      await expect(receptionistPage.locator('text=Patient registered successfully')).toBeVisible()
      
      // Should generate unique patient ID
      await expect(receptionistPage.locator('text=Patient ID:')).toBeVisible()
    })

    test('should validate required fields during registration', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Try to submit empty form
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Should show validation errors
      await expect(receptionistPage.locator('text=First name is required')).toBeVisible()
      await expect(receptionistPage.locator('text=Last name is required')).toBeVisible()
      await expect(receptionistPage.locator('text=Date of birth is required')).toBeVisible()
      await expect(receptionistPage.locator('text=Mobile number is required')).toBeVisible()
    })

    test('should validate phone number format', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Fill required fields with invalid phone
      await receptionistPage.fill('input[name="first_name"]', 'John')
      await receptionistPage.fill('input[name="last_name"]', 'Doe')
      await receptionistPage.fill('input[name="date_of_birth"]', '1985-06-15')
      await receptionistPage.fill('input[name="mobile"]', '12345') // Invalid format
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      await expect(receptionistPage.locator('text=Invalid phone number format')).toBeVisible()
    })

    test('should validate age restrictions', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Try to register patient born in future
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      await receptionistPage.fill('input[name="first_name"]', 'Future')
      await receptionistPage.fill('input[name="last_name"]', 'Baby')
      await receptionistPage.fill('input[name="date_of_birth"]', futureDate.toISOString().split('T')[0])
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543210')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      await expect(receptionistPage.locator('text=Date of birth cannot be in the future')).toBeVisible()
    })

    test('should prevent duplicate patient registration', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Try to register patient with existing mobile number
      await receptionistPage.fill('input[name="first_name"]', 'Duplicate')
      await receptionistPage.fill('input[name="last_name"]', 'Patient')
      await receptionistPage.fill('input[name="date_of_birth"]', '1990-01-01')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543210') // Same as previous test
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      await expect(receptionistPage.locator('text=Patient with this mobile number already exists')).toBeVisible()
    })
  })

  test.describe('Patient Search and Management', () => {
    test('should search patients by name', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Search for patient
      await receptionistPage.fill('input[name="search"]', 'John Doe')
      await receptionistPage.press('input[name="search"]', 'Enter')
      
      // Should show search results
      await expect(receptionistPage.locator('text=John Doe')).toBeVisible()
      await expect(receptionistPage.locator('[data-testid="patient-card"]')).toBeVisible()
    })

    test('should search patients by mobile number', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      await receptionistPage.fill('input[name="search"]', '9876543210')
      await receptionistPage.press('input[name="search"]', 'Enter')
      
      await expect(receptionistPage.locator('text=+91-9876543210')).toBeVisible()
    })

    test('should search patients by patient ID', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      await receptionistPage.fill('input[name="search"]', 'PAT001')
      await receptionistPage.press('input[name="search"]', 'Enter')
      
      await expect(receptionistPage.locator('text=PAT001')).toBeVisible()
    })

    test('should filter patients by registration date', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Apply date filter
      await receptionistPage.click('button:has-text("Filters")')
      
      const today = new Date().toISOString().split('T')[0]
      await receptionistPage.fill('input[name="registration_date_from"]', today)
      await receptionistPage.fill('input[name="registration_date_to"]', today)
      
      await receptionistPage.click('button:has-text("Apply Filters")')
      
      // Should show only today's registrations
      await expect(receptionistPage.locator('[data-testid="patient-card"]')).toBeVisible()
    })

    test('should view patient details', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Click on patient card
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Should show patient details
      await expect(receptionistPage.locator('h2:has-text("Patient Details")')).toBeVisible()
      await expect(receptionistPage.locator('text=Personal Information')).toBeVisible()
      await expect(receptionistPage.locator('text=Medical Information')).toBeVisible()
      await expect(receptionistPage.locator('text=Insurance Information')).toBeVisible()
      await expect(receptionistPage.locator('text=Visit History')).toBeVisible()
    })

    test('should edit patient information', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Click edit button
      await receptionistPage.click('button:has-text("Edit Patient")')
      
      // Should show editable form
      await expect(receptionistPage.locator('h2:has-text("Edit Patient")')).toBeVisible()
      
      // Update email address
      await receptionistPage.fill('input[name="email"]', 'john.doe.updated@email.com')
      
      // Save changes
      await receptionistPage.click('button:has-text("Update Patient")')
      
      await expect(receptionistPage.locator('text=Patient updated successfully')).toBeVisible()
      await expect(receptionistPage.locator('text=john.doe.updated@email.com')).toBeVisible()
    })
  })

  test.describe('Queue Integration', () => {
    test('should add registered patient to queue', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Add to queue button
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Should show queue addition form
      await expect(receptionistPage.locator('h3:has-text("Add to Queue")')).toBeVisible()
      
      // Select doctor and visit type
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.selectOption('select[name="visit_type"]', 'consultation')
      await receptionistPage.selectOption('select[name="priority"]', 'normal')
      
      await receptionistPage.fill('textarea[name="reason"]', 'Routine checkup')
      
      // Add to queue
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      await expect(receptionistPage.locator('text=Patient added to queue')).toBeVisible()
      
      // Should show token number
      await expect(receptionistPage.locator('text=Token Number:')).toBeVisible()
    })

    test('should create visit record when adding to queue', async () => {
      await receptionistPage.goto('/receptionist/queue')
      
      // Should see patient in queue
      await expect(receptionistPage.locator('text=John Doe')).toBeVisible()
      await expect(receptionistPage.locator('[data-testid="queue-item"]')).toBeVisible()
      
      // Check visit details
      await receptionistPage.click('[data-testid="queue-item"]:first-child')
      
      await expect(receptionistPage.locator('text=Visit Details')).toBeVisible()
      await expect(receptionistPage.locator('text=Routine checkup')).toBeVisible()
    })

    test('should handle priority queue placement', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Register emergency patient
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Emergency')
      await receptionistPage.fill('input[name="last_name"]', 'Patient')
      await receptionistPage.fill('input[name="date_of_birth"]', '1980-01-01')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543220')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Add to priority queue
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="priority"]', 'urgent')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.fill('textarea[name="reason"]', 'Chest pain')
      
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Go to queue and verify priority placement
      await receptionistPage.goto('/receptionist/queue')
      
      // Priority patient should be first in queue
      const firstQueueItem = receptionistPage.locator('[data-testid="queue-item"]:first-child')
      await expect(firstQueueItem).toContainText('Emergency Patient')
      await expect(firstQueueItem).toContainText('Urgent')
    })
  })

  test.describe('Real-time Updates', () => {
    test('should sync patient registration across users', async () => {
      // Receptionist registers new patient
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Real-time')
      await receptionistPage.fill('input[name="last_name"]', 'Test')
      await receptionistPage.fill('input[name="date_of_birth"]', '1975-05-10')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543230')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Admin should see new patient immediately
      await adminPage.goto('/admin/patients')
      
      await expect(adminPage.locator('text=Real-time Test')).toBeVisible()
    })

    test('should update patient count in real-time', async () => {
      await adminPage.goto('/admin/patients')
      
      // Get initial patient count
      const initialCount = await adminPage.locator('[data-testid="patient-count"]').textContent()
      const initialNumber = parseInt(initialCount || '0')
      
      // Register another patient
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      await receptionistPage.fill('input[name="first_name"]', 'Count')
      await receptionistPage.fill('input[name="last_name"]', 'Test')
      await receptionistPage.fill('input[name="date_of_birth"]', '1990-12-25')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543240')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Admin should see updated count
      await adminPage.waitForTimeout(1000) // Allow for real-time sync
      
      const updatedCount = await adminPage.locator('[data-testid="patient-count"]').textContent()
      const updatedNumber = parseInt(updatedCount || '0')
      
      expect(updatedNumber).toBe(initialNumber + 1)
    })

    test('should sync queue updates across doctor and receptionist', async () => {
      // Receptionist adds patient to queue
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      await receptionistPage.click('button:has-text("Add to Queue")')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.fill('textarea[name="reason"]', 'Follow-up consultation')
      await receptionistPage.click('button:has-text("Add to Queue")')
      
      // Doctor should see patient in queue
      await doctorPage.goto('/doctor/consultations')
      
      await expect(doctorPage.locator('text=Follow-up consultation')).toBeVisible()
      await expect(doctorPage.locator('[data-testid="queue-item"]')).toBeVisible()
    })
  })

  test.describe('Patient History and Records', () => {
    test('should track patient visit history', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Should show visit history section
      await expect(receptionistPage.locator('h3:has-text("Visit History")')).toBeVisible()
      
      // Should show previous visits if any
      const visitItems = receptionistPage.locator('[data-testid="visit-item"]')
      const visitCount = await visitItems.count()
      
      if (visitCount > 0) {
        await expect(visitItems.first()).toBeVisible()
        
        // Click on visit to see details
        await visitItems.first().click()
        
        await expect(receptionistPage.locator('text=Visit Details')).toBeVisible()
      }
    })

    test('should show patient medical timeline', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Switch to timeline view
      await receptionistPage.click('button:has-text("Timeline")')
      
      await expect(receptionistPage.locator('h3:has-text("Medical Timeline")')).toBeVisible()
      
      // Should show chronological medical events
      await expect(receptionistPage.locator('[data-testid="timeline-item"]')).toBeVisible()
    })

    test('should generate patient summary report', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Generate summary
      await receptionistPage.click('button:has-text("Generate Summary")')
      
      // Should show comprehensive patient summary
      await expect(receptionistPage.locator('h3:has-text("Patient Summary")')).toBeVisible()
      await expect(receptionistPage.locator('text=Demographics')).toBeVisible()
      await expect(receptionistPage.locator('text=Medical History')).toBeVisible()
      await expect(receptionistPage.locator('text=Recent Visits')).toBeVisible()
      await expect(receptionistPage.locator('text=Current Medications')).toBeVisible()
      
      // Should have print/export options
      await expect(receptionistPage.locator('button:has-text("Print Summary")')).toBeVisible()
      await expect(receptionistPage.locator('button:has-text("Export PDF")')).toBeVisible()
    })
  })

  test.describe('Data Validation and Security', () => {
    test('should sanitize input data', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('button:has-text("Add New Patient")')
      
      // Try to inject script in name field
      const maliciousInput = '<script>alert("xss")</script>'
      await receptionistPage.fill('input[name="first_name"]', maliciousInput)
      await receptionistPage.fill('input[name="last_name"]', 'Test')
      await receptionistPage.fill('input[name="date_of_birth"]', '1980-01-01')
      await receptionistPage.fill('input[name="mobile"]', '+91-9876543250')
      
      await receptionistPage.click('button:has-text("Register Patient")')
      
      // Should sanitize the input
      await expect(receptionistPage.locator('script')).not.toBeAttached()
      await expect(receptionistPage.locator('text=&lt;script&gt;')).toBeVisible()
    })

    test('should enforce role-based access control', async () => {
      // Doctor shouldn't be able to register new patients
      await doctorPage.goto('/receptionist/patients')
      
      await expect(doctorPage.locator('text=Access denied')).toBeVisible()
    })

    test('should validate sensitive medical data access', async () => {
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.click('[data-testid="patient-card"]:first-child')
      
      // Medical information should be visible to authorized users
      await expect(receptionistPage.locator('text=Known Allergies')).toBeVisible()
      await expect(receptionistPage.locator('text=Chronic Conditions')).toBeVisible()
    })
  })

  test.describe('Performance and Scalability', () => {
    test('should handle large patient database efficiently', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Simulate search in large database
      const startTime = Date.now()
      
      await receptionistPage.fill('input[name="search"]', 'John')
      await receptionistPage.press('input[name="search"]', 'Enter')
      
      await receptionistPage.waitForSelector('[data-testid="patient-card"]')
      
      const searchTime = Date.now() - startTime
      expect(searchTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    test('should paginate patient lists efficiently', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Should show pagination controls
      await expect(receptionistPage.locator('[data-testid="pagination"]')).toBeVisible()
      
      // Test pagination
      const nextButton = receptionistPage.locator('button:has-text("Next")')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        
        // Should load next page efficiently
        await expect(receptionistPage.locator('[data-testid="patient-card"]')).toBeVisible()
      }
    })

    test('should handle concurrent patient registrations', async () => {
      // Simulate two receptionists registering patients simultaneously
      const receptionist2Page = await context.newPage()
      await setupTestUser(receptionist2Page, 'receptionist')
      
      await Promise.all([
        receptionistPage.goto('/receptionist/patients'),
        receptionist2Page.goto('/receptionist/patients')
      ])
      
      // Both try to register patients
      await Promise.all([
        receptionistPage.click('button:has-text("Add New Patient")'),
        receptionist2Page.click('button:has-text("Add New Patient")')
      ])
      
      // Fill forms simultaneously
      await Promise.all([
        (async () => {
          await receptionistPage.fill('input[name="first_name"]', 'Concurrent1')
          await receptionistPage.fill('input[name="last_name"]', 'Patient')
          await receptionistPage.fill('input[name="date_of_birth"]', '1985-01-01')
          await receptionistPage.fill('input[name="mobile"]', '+91-9876543260')
          await receptionistPage.click('button:has-text("Register Patient")')
        })(),
        (async () => {
          await receptionist2Page.fill('input[name="first_name"]', 'Concurrent2')
          await receptionist2Page.fill('input[name="last_name"]', 'Patient')
          await receptionist2Page.fill('input[name="date_of_birth"]', '1985-01-01')
          await receptionist2Page.fill('input[name="mobile"]', '+91-9876543270')
          await receptionist2Page.click('button:has-text("Register Patient")')
        })()
      ])
      
      // Both should succeed
      await expect(receptionistPage.locator('text=Patient registered successfully')).toBeVisible()
      await expect(receptionist2Page.locator('text=Patient registered successfully')).toBeVisible()
      
      await receptionist2Page.close()
    })
  })
})