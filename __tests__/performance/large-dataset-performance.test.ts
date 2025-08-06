import { test, expect, type Page } from '@playwright/test'
import { setupTestUser, cleanupTestData } from '../utils/e2e-helpers'

test.describe('Performance Tests with Large Data Sets', () => {
  let adminPage: Page
  let receptionistPage: Page
  let doctorPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    
    adminPage = await context.newPage()
    receptionistPage = await context.newPage()
    doctorPage = await context.newPage()

    await setupTestUser(adminPage, 'admin')
    await setupTestUser(receptionistPage, 'receptionist')
    await setupTestUser(doctorPage, 'doctor')
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Patient Database Performance', () => {
    test('should handle large patient database efficiently', async () => {
      await adminPage.goto('/admin/patients')
      
      // Measure initial load time with large patient database
      const startTime = Date.now()
      
      await adminPage.waitForSelector('[data-testid="patient-table"]')
      const initialLoadTime = Date.now() - startTime
      
      // Should load within acceptable time limits
      expect(initialLoadTime).toBeLessThan(3000) // 3 seconds max
      
      // Test pagination performance
      const paginationStartTime = Date.now()
      
      // Navigate through multiple pages
      for (let i = 0; i < 5; i++) {
        const nextButton = adminPage.locator('button:has-text("Next")')
        if (await nextButton.isEnabled()) {
          await nextButton.click()
          await adminPage.waitForSelector('[data-testid="patient-table"]')
        }
      }
      
      const paginationTime = Date.now() - paginationStartTime
      expect(paginationTime).toBeLessThan(5000) // 5 seconds for 5 page loads
    })

    test('should perform patient search efficiently with large dataset', async () => {
      await receptionistPage.goto('/receptionist/patients')
      
      // Test search performance
      const searchStartTime = Date.now()
      
      await receptionistPage.fill('input[name="search"]', 'John')
      await receptionistPage.press('input[name="search"]', 'Enter')
      
      await receptionistPage.waitForSelector('[data-testid="search-results"]')
      const searchTime = Date.now() - searchStartTime
      
      // Search should complete within 2 seconds even with large dataset
      expect(searchTime).toBeLessThan(2000)
      
      // Test filter performance
      const filterStartTime = Date.now()
      
      await receptionistPage.click('button:has-text("Filters")')
      await receptionistPage.selectOption('select[name="age_range"]', '30-50')
      await receptionistPage.click('button:has-text("Apply Filters")')
      
      await receptionistPage.waitForSelector('[data-testid="filtered-results"]')
      const filterTime = Date.now() - filterStartTime
      
      expect(filterTime).toBeLessThan(2000)
    })

    test('should handle concurrent patient registrations efficiently', async () => {
      const startTime = Date.now()
      
      // Simulate multiple concurrent registrations
      const registrationPromises = Array.from({ length: 10 }, async (_, i) => {
        await receptionistPage.goto('/receptionist/patients')
        await receptionistPage.click('button:has-text("Add New Patient")')
        
        await receptionistPage.fill('input[name="first_name"]', `Perf${i}`)
        await receptionistPage.fill('input[name="last_name"]', `Test${i}`)
        await receptionistPage.fill('input[name="date_of_birth"]', '1990-01-01')
        await receptionistPage.fill('input[name="mobile"]', `+91-999000${i.toString().padStart(4, '0')}`)
        
        await receptionistPage.click('button:has-text("Register Patient")')
        
        return receptionistPage.waitForSelector('text=Patient registered successfully')
      })
      
      await Promise.all(registrationPromises)
      const totalTime = Date.now() - startTime
      
      // All registrations should complete within reasonable time
      expect(totalTime).toBeLessThan(15000) // 15 seconds for 10 registrations
    })
  })

  test.describe('Queue Management Performance', () => {
    test('should handle large queue efficiently', async () => {
      await receptionistPage.goto('/receptionist/queue')
      
      // Test queue loading with many patients
      const startTime = Date.now()
      
      await receptionistPage.waitForSelector('[data-testid="queue-list"]')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
      
      // Test queue operations performance
      const operationStartTime = Date.now()
      
      // Add multiple patients to queue
      for (let i = 0; i < 5; i++) {
        await receptionistPage.click('button:has-text("Add to Queue")')
        await receptionistPage.selectOption('select[name="patient_id"]', `pat${i + 1}`)
        await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
        await receptionistPage.click('button:has-text("Add to Queue")')
        
        await receptionistPage.waitForSelector('text=Patient added to queue')
      }
      
      const operationTime = Date.now() - operationStartTime
      expect(operationTime).toBeLessThan(10000) // 10 seconds for 5 additions
    })

    test('should maintain real-time performance with large queue', async () => {
      await doctorPage.goto('/doctor/consultations')
      
      const startTime = Date.now()
      
      // Process multiple patients quickly
      for (let i = 0; i < 3; i++) {
        await doctorPage.click('button:has-text("Call Next")')
        
        // Quick consultation
        await doctorPage.fill('textarea[name="consultation_notes"]', `Quick consultation ${i + 1}`)
        await doctorPage.click('button:has-text("Complete Consultation")')
        
        await doctorPage.waitForSelector('text=Consultation completed')
      }
      
      const processingTime = Date.now() - startTime
      expect(processingTime).toBeLessThan(8000) // 8 seconds for 3 consultations
    })

    test('should handle queue status updates efficiently', async () => {
      // Test multiple simultaneous status updates
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          (async () => {
            await receptionistPage.goto('/receptionist/queue')
            await receptionistPage.click(`[data-testid="queue-item"]:nth-child(${i + 1})`)
            await receptionistPage.click('button:has-text("Update Status")')
            await receptionistPage.selectOption('select[name="status"]', 'waiting')
            await receptionistPage.click('button:has-text("Update")')
          })()
        )
      }
      
      const startTime = Date.now()
      await Promise.all(promises)
      const updateTime = Date.now() - startTime
      
      expect(updateTime).toBeLessThan(10000)
    })
  })

  test.describe('Appointment Management Performance', () => {
    test('should load appointment calendar efficiently with many appointments', async () => {
      await receptionistPage.goto('/receptionist/appointments')
      
      const startTime = Date.now()
      
      // Wait for calendar to load with all appointments
      await receptionistPage.waitForSelector('[data-testid="appointment-calendar"]')
      await receptionistPage.waitForSelector('[data-testid="appointment-item"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(4000) // 4 seconds for calendar load
      
      // Test calendar navigation performance
      const navStartTime = Date.now()
      
      // Navigate through different months
      for (let i = 0; i < 3; i++) {
        await receptionistPage.click('button:has-text("Next Month")')
        await receptionistPage.waitForSelector('[data-testid="appointment-calendar"]')
      }
      
      const navTime = Date.now() - navStartTime
      expect(navTime).toBeLessThan(3000)
    })

    test('should handle bulk appointment operations efficiently', async () => {
      await receptionistPage.goto('/receptionist/appointment-management')
      
      const startTime = Date.now()
      
      // Select multiple appointments
      await receptionistPage.check('input[type="checkbox"]:nth-of-type(1)')
      await receptionistPage.check('input[type="checkbox"]:nth-of-type(2)')
      await receptionistPage.check('input[type="checkbox"]:nth-of-type(3)')
      
      // Bulk confirm appointments
      await receptionistPage.click('button:has-text("Bulk Confirm")')
      await receptionistPage.selectOption('select[name="template"]', 'sms_confirmation')
      await receptionistPage.click('button:has-text("Send Confirmations")')
      
      await receptionistPage.waitForSelector('text=Confirmations sent')
      const bulkTime = Date.now() - startTime
      
      expect(bulkTime).toBeLessThan(5000)
    })

    test('should handle appointment conflicts efficiently', async () => {
      // Test conflict detection with many existing appointments
      await receptionistPage.goto('/receptionist/appointments')
      
      const startTime = Date.now()
      
      await receptionistPage.click('button:has-text("Book Appointment")')
      
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      
      // Try to book at potentially conflicting time
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await receptionistPage.fill('input[name="scheduled_date"]', tomorrow.toISOString().split('T')[0])
      await receptionistPage.selectOption('select[name="scheduled_time"]', '10:00')
      
      await receptionistPage.click('button:has-text("Check Availability")')
      
      // Conflict check should be fast even with many appointments
      await receptionistPage.waitForSelector('[data-testid="availability-status"]')
      const conflictCheckTime = Date.now() - startTime
      
      expect(conflictCheckTime).toBeLessThan(3000)
    })
  })

  test.describe('Billing and Financial Performance', () => {
    test('should generate invoices efficiently for large billing data', async () => {
      await receptionistPage.goto('/receptionist/billing')
      
      const startTime = Date.now()
      
      // Load billing dashboard with many invoices
      await receptionistPage.waitForSelector('[data-testid="billing-dashboard"]')
      await receptionistPage.waitForSelector('[data-testid="invoice-list"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(4000)
      
      // Test invoice generation performance
      const invoiceStartTime = Date.now()
      
      await receptionistPage.click('button:has-text("Create Invoice")')
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      await receptionistPage.selectOption('select[name="visit_id"]', 'visit1')
      
      // Add multiple items quickly
      for (let i = 0; i < 3; i++) {
        await receptionistPage.click('button:has-text("Add Item")')
        await receptionistPage.selectOption('select[name="service_type"]', 'consultation')
        await receptionistPage.fill('input[name="quantity"]', '1')
        await receptionistPage.fill('input[name="unit_price"]', '500')
        await receptionistPage.click('button:has-text("Add Item to Invoice")')
      }
      
      await receptionistPage.click('button:has-text("Generate Invoice")')
      await receptionistPage.waitForSelector('text=Invoice created successfully')
      
      const invoiceTime = Date.now() - invoiceStartTime
      expect(invoiceTime).toBeLessThan(6000)
    })

    test('should process bulk payments efficiently', async () => {
      await adminPage.goto('/admin/billing')
      
      const startTime = Date.now()
      
      // Select multiple unpaid invoices
      await adminPage.check('[data-testid="select-all-invoices"]')
      
      // Process bulk payment
      await adminPage.click('button:has-text("Bulk Payment Processing")')
      await adminPage.selectOption('select[name="payment_method"]', 'insurance')
      await adminPage.fill('input[name="insurance_provider"]', 'HealthFirst')
      
      await adminPage.click('button:has-text("Process All")')
      await adminPage.waitForSelector('text=Bulk payment processed')
      
      const bulkPaymentTime = Date.now() - startTime
      expect(bulkPaymentTime).toBeLessThan(8000)
    })

    test('should generate financial reports efficiently with large datasets', async () => {
      await adminPage.goto('/admin/billing')
      
      const startTime = Date.now()
      
      // Generate comprehensive financial report
      await adminPage.click('button:has-text("Generate Reports")')
      await adminPage.selectOption('select[name="report_type"]', 'monthly_revenue')
      
      const currentMonth = new Date()
      await adminPage.fill('input[name="start_date"]', `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`)
      await adminPage.fill('input[name="end_date"]', new Date().toISOString().split('T')[0])
      
      await adminPage.click('button:has-text("Generate Report")')
      await adminPage.waitForSelector('[data-testid="financial-report"]')
      
      const reportTime = Date.now() - startTime
      expect(reportTime).toBeLessThan(10000) // 10 seconds for monthly report
    })
  })

  test.describe('Pharmacy and Inventory Performance', () => {
    test('should handle large inventory database efficiently', async () => {
      await adminPage.goto('/admin/inventory')
      
      const startTime = Date.now()
      
      // Load inventory with thousands of items
      await adminPage.waitForSelector('[data-testid="inventory-table"]')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(4000)
      
      // Test inventory search performance
      const searchStartTime = Date.now()
      
      await adminPage.fill('input[name="search"]', 'Para')
      await adminPage.press('input[name="search"]', 'Enter')
      
      await adminPage.waitForSelector('[data-testid="search-results"]')
      const searchTime = Date.now() - searchStartTime
      
      expect(searchTime).toBeLessThan(2000)
    })

    test('should process bulk inventory updates efficiently', async () => {
      await adminPage.goto('/admin/inventory')
      
      const startTime = Date.now()
      
      // Select multiple items for bulk update
      await adminPage.check('[data-testid="select-all-items"]')
      
      // Bulk price update
      await adminPage.click('button:has-text("Bulk Actions")')
      await adminPage.click('button:has-text("Update Prices")')
      
      await adminPage.fill('input[name="markup_percentage"]', '10')
      await adminPage.click('button:has-text("Apply Markup")')
      
      await adminPage.waitForSelector('text=Bulk update completed')
      const bulkUpdateTime = Date.now() - startTime
      
      expect(bulkUpdateTime).toBeLessThan(8000)
    })

    test('should generate inventory reports efficiently', async () => {
      await adminPage.goto('/admin/inventory')
      
      const startTime = Date.now()
      
      await adminPage.click('button:has-text("Inventory Reports")')
      await adminPage.selectOption('select[name="report_type"]', 'stock_valuation')
      
      await adminPage.click('button:has-text("Generate Report")')
      await adminPage.waitForSelector('[data-testid="inventory-report"]')
      
      const reportTime = Date.now() - startTime
      expect(reportTime).toBeLessThan(6000)
    })
  })

  test.describe('Data Export and Import Performance', () => {
    test('should export large datasets efficiently', async () => {
      await adminPage.goto('/admin/patients')
      
      const startTime = Date.now()
      
      // Export all patient data
      await adminPage.click('button:has-text("Export Data")')
      await adminPage.selectOption('select[name="export_format"]', 'csv')
      await adminPage.check('input[name="include_medical_history"]')
      
      await adminPage.click('button:has-text("Export")')
      
      // Wait for download to start
      const downloadPromise = adminPage.waitForEvent('download')
      await downloadPromise
      
      const exportTime = Date.now() - startTime
      expect(exportTime).toBeLessThan(15000) // 15 seconds for large export
    })

    test('should import data efficiently', async () => {
      await adminPage.goto('/admin/settings')
      
      const startTime = Date.now()
      
      // Import patient data
      await adminPage.click('button:has-text("Import Data")')
      await adminPage.selectOption('select[name="data_type"]', 'patients')
      
      // Simulate file upload
      await adminPage.setInputFiles('input[type="file"]', './test-data/large-patient-dataset.csv')
      
      await adminPage.click('button:has-text("Import")')
      await adminPage.waitForSelector('text=Import completed')
      
      const importTime = Date.now() - startTime
      expect(importTime).toBeLessThan(20000) // 20 seconds for large import
    })
  })

  test.describe('Memory and Resource Management', () => {
    test('should maintain stable memory usage during extended operations', async () => {
      // Simulate extended usage session
      for (let i = 0; i < 20; i++) {
        // Navigate between different modules
        await receptionistPage.goto('/receptionist/patients')
        await receptionistPage.waitForSelector('[data-testid="patient-table"]')
        
        await receptionistPage.goto('/receptionist/queue')
        await receptionistPage.waitForSelector('[data-testid="queue-list"]')
        
        await receptionistPage.goto('/receptionist/appointments')
        await receptionistPage.waitForSelector('[data-testid="appointment-calendar"]')
        
        await receptionistPage.goto('/receptionist/billing')
        await receptionistPage.waitForSelector('[data-testid="billing-dashboard"]')
        
        // Small delay between operations
        await receptionistPage.waitForTimeout(100)
      }
      
      // Page should remain responsive after extended use
      const finalStartTime = Date.now()
      await receptionistPage.goto('/receptionist/patients')
      await receptionistPage.waitForSelector('[data-testid="patient-table"]')
      const finalLoadTime = Date.now() - finalStartTime
      
      expect(finalLoadTime).toBeLessThan(3000) // Should not degrade significantly
    })

    test('should handle concurrent users efficiently', async () => {
      const startTime = Date.now()
      
      // Simulate multiple users accessing system simultaneously
      const concurrentOperations = [
        // Admin viewing dashboard
        adminPage.goto('/admin/dashboard'),
        
        // Receptionist managing patients
        receptionistPage.goto('/receptionist/patients'),
        
        // Doctor viewing consultations
        doctorPage.goto('/doctor/consultations')
      ]
      
      await Promise.all(concurrentOperations)
      
      // All pages should load concurrently without significant delay
      const concurrentTime = Date.now() - startTime
      expect(concurrentTime).toBeLessThan(5000)
      
      // All pages should be functional
      await Promise.all([
        expect(adminPage.locator('[data-testid="dashboard-metrics"]')).toBeVisible(),
        expect(receptionistPage.locator('[data-testid="patient-table"]')).toBeVisible(),
        expect(doctorPage.locator('[data-testid="consultation-queue"]')).toBeVisible()
      ])
    })
  })

  test.describe('Database Query Performance', () => {
    test('should perform complex queries efficiently', async () => {
      await adminPage.goto('/admin/analytics')
      
      const startTime = Date.now()
      
      // Complex analytics query
      await adminPage.click('button:has-text("Advanced Analytics")')
      await adminPage.selectOption('select[name="analysis_type"]', 'patient_trends')
      
      // Set date range for large dataset
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      await adminPage.fill('input[name="start_date"]', sixMonthsAgo.toISOString().split('T')[0])
      await adminPage.fill('input[name="end_date"]', new Date().toISOString().split('T')[0])
      
      await adminPage.click('button:has-text("Generate Analytics")')
      await adminPage.waitForSelector('[data-testid="analytics-results"]')
      
      const queryTime = Date.now() - startTime
      expect(queryTime).toBeLessThan(12000) // 12 seconds for complex analytics
    })

    test('should maintain query performance under load', async () => {
      // Simulate multiple complex queries simultaneously
      const queryPromises = [
        // Patient search query
        receptionistPage.goto('/receptionist/patients').then(() => {
          return receptionistPage.fill('input[name="search"]', 'Smith')
        }),
        
        // Appointment availability query
        receptionistPage.goto('/receptionist/appointments').then(() => {
          return receptionistPage.click('button:has-text("Check Availability")')
        }),
        
        // Billing report query
        adminPage.goto('/admin/billing').then(() => {
          return adminPage.click('button:has-text("Generate Reports")')
        })
      ]
      
      const startTime = Date.now()
      await Promise.all(queryPromises)
      const totalQueryTime = Date.now() - startTime
      
      expect(totalQueryTime).toBeLessThan(10000) // All queries within 10 seconds
    })
  })
})