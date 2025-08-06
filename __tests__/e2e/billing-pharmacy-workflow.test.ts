import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { setupTestUser, cleanupTestData, createMockPatientData } from '../utils/e2e-helpers'

test.describe('Complete Billing and Pharmacy Workflow E2E', () => {
  let receptionistPage: Page
  let pharmacistPage: Page
  let adminPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    
    receptionistPage = await context.newPage()
    pharmacistPage = await context.newPage()
    adminPage = await context.newPage()

    await setupTestUser(receptionistPage, 'receptionist')
    await setupTestUser(pharmacistPage, 'pharmacist')
    await setupTestUser(adminPage, 'admin')
  })

  test.afterAll(async () => {
    await cleanupTestData()
    await context.close()
  })

  test.describe('Billing Workflow', () => {
    test('should create invoice for consultation and services', async () => {
      await receptionistPage.goto('/receptionist/billing')
      
      // Should see billing dashboard
      await expect(receptionistPage.locator('h1:has-text("Billing & Invoices")')).toBeVisible()
      
      // Create new invoice
      await receptionistPage.click('button:has-text("Create Invoice")')
      
      // Should open invoice creation form
      await expect(receptionistPage.locator('h2:has-text("Create New Invoice")')).toBeVisible()
      
      // Select patient
      await receptionistPage.selectOption('select[name="patient_id"]', 'pat1')
      
      // Select visit/consultation
      await receptionistPage.selectOption('select[name="visit_id"]', 'visit1')
      
      // Add consultation charges
      await receptionistPage.click('button:has-text("Add Item")')
      await receptionistPage.selectOption('select[name="service_type"]', 'consultation')
      await receptionistPage.selectOption('select[name="doctor_id"]', 'doc1')
      await receptionistPage.fill('input[name="quantity"]', '1')
      await receptionistPage.fill('input[name="unit_price"]', '500')
      await receptionistPage.fill('textarea[name="description"]', 'General consultation')
      await receptionistPage.click('button:has-text("Add Item to Invoice")')
      
      // Add diagnostic tests
      await receptionistPage.click('button:has-text("Add Item")')
      await receptionistPage.selectOption('select[name="service_type"]', 'diagnostic')
      await receptionistPage.selectOption('select[name="test_id"]', 'test1')
      await receptionistPage.fill('input[name="quantity"]', '1')
      await receptionistPage.fill('input[name="unit_price"]', '200')
      await receptionistPage.fill('textarea[name="description"]', 'Blood sugar test')
      await receptionistPage.click('button:has-text("Add Item to Invoice")')
      
      // Add medications
      await receptionistPage.click('button:has-text("Add Item")')
      await receptionistPage.selectOption('select[name="service_type"]', 'medication')
      await receptionistPage.selectOption('select[name="medication_id"]', 'med1')
      await receptionistPage.fill('input[name="quantity"]', '10')
      await receptionistPage.fill('input[name="unit_price"]', '15')
      await receptionistPage.fill('textarea[name="description"]', 'Paracetamol 500mg - 10 tablets')
      await receptionistPage.click('button:has-text("Add Item to Invoice")')
      
      // Apply discount if applicable
      await receptionistPage.fill('input[name="discount_percentage"]', '10')
      await receptionistPage.click('button:has-text("Apply Discount")')
      
      // Should show calculated totals
      await expect(receptionistPage.locator('text=Subtotal: ₹715')).toBeVisible()
      await expect(receptionistPage.locator('text=Discount: ₹71.50')).toBeVisible()
      await expect(receptionistPage.locator('text=Tax: ₹115.83')).toBeVisible() // 18% GST
      await expect(receptionistPage.locator('text=Total: ₹759.33')).toBeVisible()
      
      // Generate invoice
      await receptionistPage.click('button:has-text("Generate Invoice")')
      
      await expect(receptionistPage.locator('text=Invoice created successfully')).toBeVisible()
      await expect(receptionistPage.locator('text=Invoice ID:')).toBeVisible()
    })

    test('should process cash payment', async () => {
      await receptionistPage.goto('/receptionist/billing')
      
      // Find unpaid invoice
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      // Should show invoice details
      await expect(receptionistPage.locator('h3:has-text("Invoice Details")')).toBeVisible()
      
      // Process payment
      await receptionistPage.click('button:has-text("Process Payment")')
      
      // Select cash payment
      await receptionistPage.selectOption('select[name="payment_method"]', 'cash')
      await receptionistPage.fill('input[name="amount_received"]', '800')
      
      // Should calculate change
      await expect(receptionistPage.locator('text=Change: ₹40.67')).toBeVisible()
      
      // Complete payment
      await receptionistPage.click('button:has-text("Complete Payment")')
      
      await expect(receptionistPage.locator('text=Payment processed successfully')).toBeVisible()
      await expect(receptionistPage.locator('text=Receipt generated')).toBeVisible()
    })

    test('should process card payment', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      
      // Select card payment
      await receptionistPage.selectOption('select[name="payment_method"]', 'card')
      await receptionistPage.fill('input[name="card_number"]', '4111-1111-1111-1111')
      await receptionistPage.fill('input[name="cardholder_name"]', 'John Doe')
      await receptionistPage.fill('input[name="expiry_date"]', '12/25')
      await receptionistPage.fill('input[name="cvv"]', '123')
      
      // Process card payment
      await receptionistPage.click('button:has-text("Process Card Payment")')
      
      // Should show processing and success
      await expect(receptionistPage.locator('text=Processing payment...')).toBeVisible()
      await expect(receptionistPage.locator('text=Payment approved')).toBeVisible()
      await expect(receptionistPage.locator('text=Transaction ID:')).toBeVisible()
    })

    test('should handle insurance claims', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      
      // Select insurance
      await receptionistPage.selectOption('select[name="payment_method"]', 'insurance')
      
      // Fill insurance details
      await receptionistPage.fill('input[name="insurance_provider"]', 'HealthFirst Insurance')
      await receptionistPage.fill('input[name="policy_number"]', 'HF123456789')
      await receptionistPage.fill('input[name="claim_number"]', 'CLM2024001')
      await receptionistPage.fill('input[name="authorization_code"]', 'AUTH123456')
      
      // Set coverage amounts
      await receptionistPage.fill('input[name="insurance_coverage"]', '80') // 80% coverage
      await receptionistPage.fill('input[name="copay_amount"]', '100')
      
      // Should calculate insurance vs patient amounts
      await expect(receptionistPage.locator('text=Insurance Amount: ₹527.46')).toBeVisible()
      await expect(receptionistPage.locator('text=Patient Amount: ₹231.87')).toBeVisible()
      
      // Submit insurance claim
      await receptionistPage.click('button:has-text("Submit Insurance Claim")')
      
      await expect(receptionistPage.locator('text=Insurance claim submitted')).toBeVisible()
      await expect(receptionistPage.locator('text=Claim Status: Pending')).toBeVisible()
    })

    test('should generate payment receipt', async () => {
      await receptionistPage.goto('/receptionist/billing')
      
      // Find paid invoice
      await receptionistPage.click('button:has-text("Paid Invoices")')
      await receptionistPage.click('[data-testid="paid-invoice"]:first-child')
      
      // Generate receipt
      await receptionistPage.click('button:has-text("Print Receipt")')
      
      // Should show receipt preview
      await expect(receptionistPage.locator('h3:has-text("Payment Receipt")')).toBeVisible()
      await expect(receptionistPage.locator('text=SwamIDesk Clinic')).toBeVisible()
      await expect(receptionistPage.locator('text=Receipt Number:')).toBeVisible()
      await expect(receptionistPage.locator('text=Payment Method:')).toBeVisible()
      await expect(receptionistPage.locator('text=Amount Paid:')).toBeVisible()
      
      // Print receipt
      await receptionistPage.click('button:has-text("Print")')
      
      await expect(receptionistPage.locator('text=Receipt printed successfully')).toBeVisible()
    })

    test('should handle partial payments', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      
      // Make partial payment
      await receptionistPage.selectOption('select[name="payment_method"]', 'cash')
      await receptionistPage.fill('input[name="amount_received"]', '400') // Less than total
      
      await receptionistPage.check('input[name="partial_payment"]')
      await receptionistPage.fill('textarea[name="partial_reason"]', 'Patient will pay remaining amount next visit')
      
      await receptionistPage.click('button:has-text("Process Partial Payment")')
      
      await expect(receptionistPage.locator('text=Partial payment recorded')).toBeVisible()
      await expect(receptionistPage.locator('text=Remaining Balance: ₹359.33')).toBeVisible()
    })
  })

  test.describe('Pharmacy Workflow', () => {
    test('should dispense prescription medications', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      
      // Should see pharmacy queue
      await expect(pharmacistPage.locator('h1:has-text("Pharmacy Queue")')).toBeVisible()
      await expect(pharmacistPage.locator('[data-testid="prescription-queue"]')).toBeVisible()
      
      // Select prescription to dispense
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Should show prescription details
      await expect(pharmacistPage.locator('text=Prescription Details')).toBeVisible()
      await expect(pharmacistPage.locator('text=Patient:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Doctor:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Prescribed Date:')).toBeVisible()
      
      // Check medication availability
      await pharmacistPage.click('button:has-text("Check Availability")')
      
      await expect(pharmacistPage.locator('text=Stock Status')).toBeVisible()
      
      // Dispense first medication
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      // Fill dispensing details
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '10')
      await pharmacistPage.fill('input[name="batch_number"]', 'PCM2024001')
      
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2)
      await pharmacistPage.fill('input[name="expiry_date"]', expiryDate.toISOString().split('T')[0])
      
      await pharmacistPage.fill('input[name="unit_cost"]', '15.00')
      await pharmacistPage.fill('textarea[name="patient_counseling"]', 'Take with food, avoid alcohol')
      
      // Dispense medication
      await pharmacistPage.click('button:has-text("Dispense")')
      
      await expect(pharmacistPage.locator('text=Medication dispensed successfully')).toBeVisible()
    })

    test('should handle stock shortages and backorders', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Try to dispense more than available stock
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '50') // More than available
      
      // Should show stock warning
      await expect(pharmacistPage.locator('text=Insufficient stock')).toBeVisible()
      await expect(pharmacistPage.locator('text=Available: 25')).toBeVisible()
      
      // Partial dispensing
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '20')
      await pharmacistPage.check('input[name="partial_dispensing"]')
      await pharmacistPage.fill('textarea[name="partial_reason"]', 'Insufficient stock, remainder on backorder')
      
      await pharmacistPage.click('button:has-text("Dispense Partial")')
      
      // Should create backorder
      await expect(pharmacistPage.locator('text=Partial dispensing completed')).toBeVisible()
      await expect(pharmacistPage.locator('text=Backorder created for 30 tablets')).toBeVisible()
    })

    test('should manage medication inventory', async () => {
      await pharmacistPage.goto('/pharmacy/inventory')
      
      // Should show inventory management
      await expect(pharmacistPage.locator('h1:has-text("Inventory Management")')).toBeVisible()
      
      // Search for medication
      await pharmacistPage.fill('input[name="search"]', 'Paracetamol')
      await pharmacistPage.press('input[name="search"]', 'Enter')
      
      // Should show search results
      await expect(pharmacistPage.locator('text=Paracetamol 500mg')).toBeVisible()
      
      // View medication details
      await pharmacistPage.click('[data-testid="medication-item"]:first-child')
      
      // Should show stock levels, batches, expiry dates
      await expect(pharmacistPage.locator('text=Current Stock:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Reorder Level:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Batch Information')).toBeVisible()
      
      // Add new stock
      await pharmacistPage.click('button:has-text("Add Stock")')
      
      await pharmacistPage.fill('input[name="quantity"]', '100')
      await pharmacistPage.fill('input[name="batch_number"]', 'PCM2024002')
      await pharmacistPage.fill('input[name="supplier"]', 'MediSupply Ltd')
      
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2)
      await pharmacistPage.fill('input[name="expiry_date"]', expiryDate.toISOString().split('T')[0])
      
      await pharmacistPage.fill('input[name="unit_cost"]', '12.50')
      await pharmacistPage.fill('input[name="selling_price"]', '15.00')
      
      await pharmacistPage.click('button:has-text("Add Stock")')
      
      await expect(pharmacistPage.locator('text=Stock added successfully')).toBeVisible()
    })

    test('should track medication expiry and alerts', async () => {
      await pharmacistPage.goto('/pharmacy/inventory')
      
      // Check expiry alerts
      await pharmacistPage.click('button:has-text("Expiry Alerts")')
      
      // Should show medications expiring soon
      await expect(pharmacistPage.locator('h3:has-text("Expiry Alerts")')).toBeVisible()
      await expect(pharmacistPage.locator('text=Medications expiring in 30 days')).toBeVisible()
      
      // Should show expired medications
      await expect(pharmacistPage.locator('text=Expired Medications')).toBeVisible()
      
      // Mark expired items for disposal
      const expiredItems = pharmacistPage.locator('[data-testid="expired-medication"]')
      const count = await expiredItems.count()
      
      if (count > 0) {
        await expiredItems.first().click()
        await pharmacistPage.click('button:has-text("Mark for Disposal")')
        
        await pharmacistPage.fill('textarea[name="disposal_reason"]', 'Expired - beyond use date')
        await pharmacistPage.click('button:has-text("Confirm Disposal")')
        
        await expect(pharmacistPage.locator('text=Item marked for disposal')).toBeVisible()
      }
    })

    test('should generate medication labels', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Generate labels for all medications
      await pharmacistPage.click('button:has-text("Generate Labels")')
      
      // Should show label preview
      await expect(pharmacistPage.locator('h3:has-text("Medication Labels")')).toBeVisible()
      
      // Verify label content
      await expect(pharmacistPage.locator('text=Patient Name:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Medication:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Dosage Instructions:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Quantity Dispensed:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Expiry Date:')).toBeVisible()
      
      // Customize label
      await pharmacistPage.fill('textarea[name="additional_instructions"]', 'Store in cool, dry place')
      
      // Print labels
      await pharmacistPage.click('button:has-text("Print Labels")')
      
      await expect(pharmacistPage.locator('text=Labels printed successfully')).toBeVisible()
    })

    test('should handle drug interaction warnings', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Should automatically check for interactions
      await expect(pharmacistPage.locator('text=Drug Interaction Check')).toBeVisible()
      
      // If interactions found, should show warning
      const interactionWarning = pharmacistPage.locator('[data-testid="interaction-warning"]')
      if (await interactionWarning.isVisible()) {
        await expect(interactionWarning).toContainText('Drug Interaction Alert')
        
        // Should show interaction details
        await interactionWarning.click()
        await expect(pharmacistPage.locator('text=Interaction Details')).toBeVisible()
        
        // Pharmacist can acknowledge and add notes
        await pharmacistPage.fill('textarea[name="pharmacist_notes"]', 'Patient counseled about potential interaction')
        await pharmacistPage.click('button:has-text("Acknowledge and Proceed")')
      }
    })
  })

  test.describe('Integration Between Billing and Pharmacy', () => {
    test('should sync medication costs between pharmacy and billing', async () => {
      // Pharmacist dispenses medication
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '10')
      await pharmacistPage.fill('input[name="unit_cost"]', '15.00')
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Should automatically update billing
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="pending-billing"]')
      
      // Should see medication charges automatically added
      await expect(receptionistPage.locator('text=Medication Charges')).toBeVisible()
      await expect(receptionistPage.locator('text=₹150.00')).toBeVisible() // 10 × 15.00
    })

    test('should handle insurance coverage for medications', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      await receptionistPage.selectOption('select[name="payment_method"]', 'insurance')
      
      // Fill insurance details
      await receptionistPage.fill('input[name="insurance_provider"]', 'MediCare Plus')
      await receptionistPage.fill('input[name="policy_number"]', 'MCP987654321')
      
      // Set medication coverage
      await receptionistPage.fill('input[name="medication_coverage"]', '70') // 70% coverage
      await receptionistPage.fill('input[name="consultation_coverage"]', '80') // 80% coverage
      
      // Should calculate separate coverage amounts
      await expect(receptionistPage.locator('text=Medication Coverage:')).toBeVisible()
      await expect(receptionistPage.locator('text=Consultation Coverage:')).toBeVisible()
      
      await receptionistPage.click('button:has-text("Submit Insurance Claim")')
      
      await expect(receptionistPage.locator('text=Insurance claim submitted')).toBeVisible()
    })

    test('should generate combined invoice for consultation and medications', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('button:has-text("Create Invoice")')
      
      // Select completed visit with prescription
      await receptionistPage.selectOption('select[name="visit_id"]', 'visit_with_prescription')
      
      // Should auto-populate consultation and medication charges
      await expect(receptionistPage.locator('text=Consultation Fee')).toBeVisible()
      await expect(receptionistPage.locator('text=Prescription Medications')).toBeVisible()
      
      // Should show itemized medication list
      await expect(receptionistPage.locator('text=Paracetamol 500mg × 10')).toBeVisible()
      await expect(receptionistPage.locator('text=Ibuprofen 400mg × 6')).toBeVisible()
      
      // Calculate totals
      await receptionistPage.click('button:has-text("Calculate Total")')
      
      await expect(receptionistPage.locator('text=Consultation: ₹500')).toBeVisible()
      await expect(receptionistPage.locator('text=Medications: ₹240')).toBeVisible()
      await expect(receptionistPage.locator('text=Total: ₹740')).toBeVisible()
    })
  })

  test.describe('Real-time Updates and Communication', () => {
    test('should notify billing when prescription is dispensed', async () => {
      // Pharmacist completes dispensing
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('button:has-text("Complete Prescription")')
      
      // Billing should receive real-time notification
      await receptionistPage.waitForSelector('[data-testid="prescription-completed-notification"]', {
        timeout: 5000
      })
      
      await expect(receptionistPage.locator('text=Prescription completed - Ready for billing')).toBeVisible()
    })

    test('should sync inventory levels in real-time', async () => {
      // Pharmacist dispenses medication
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '25')
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Admin should see updated inventory levels
      await adminPage.goto('/admin/inventory')
      
      await adminPage.waitForTimeout(1000) // Allow for real-time sync
      
      // Should show reduced stock levels
      const stockElement = adminPage.locator('[data-testid="stock-level"]')
      const stockValue = await stockElement.textContent()
      
      expect(parseInt(stockValue || '0')).toBeLessThan(100) // Assuming it was 100+ before
    })

    test('should alert on low stock during dispensing', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Try to dispense when stock is low
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      // If stock is below reorder level, should show alert
      const lowStockAlert = pharmacistPage.locator('[data-testid="low-stock-alert"]')
      if (await lowStockAlert.isVisible()) {
        await expect(lowStockAlert).toContainText('Low Stock Alert')
        
        // Should offer to create purchase order
        await pharmacistPage.click('button:has-text("Create Purchase Order")')
        
        await expect(pharmacistPage.locator('text=Purchase order created')).toBeVisible()
      }
    })
  })

  test.describe('Reports and Analytics', () => {
    test('should generate billing reports', async () => {
      await adminPage.goto('/admin/billing')
      
      // Generate daily sales report
      await adminPage.click('button:has-text("Generate Reports")')
      await adminPage.selectOption('select[name="report_type"]', 'daily_sales')
      
      const today = new Date().toISOString().split('T')[0]
      await adminPage.fill('input[name="report_date"]', today)
      
      await adminPage.click('button:has-text("Generate Report")')
      
      // Should show sales summary
      await expect(adminPage.locator('text=Daily Sales Report')).toBeVisible()
      await expect(adminPage.locator('text=Total Revenue:')).toBeVisible()
      await expect(adminPage.locator('text=Total Transactions:')).toBeVisible()
      await expect(adminPage.locator('text=Payment Method Breakdown')).toBeVisible()
      
      // Should show breakdown by services
      await expect(adminPage.locator('text=Consultation Revenue:')).toBeVisible()
      await expect(adminPage.locator('text=Medication Revenue:')).toBeVisible()
      await expect(adminPage.locator('text=Diagnostic Revenue:')).toBeVisible()
    })

    test('should generate pharmacy inventory report', async () => {
      await adminPage.goto('/admin/inventory')
      
      await adminPage.click('button:has-text("Inventory Reports")')
      await adminPage.selectOption('select[name="report_type"]', 'stock_valuation')
      
      await adminPage.click('button:has-text("Generate Report")')
      
      // Should show inventory valuation
      await expect(adminPage.locator('text=Stock Valuation Report')).toBeVisible()
      await expect(adminPage.locator('text=Total Stock Value:')).toBeVisible()
      await expect(adminPage.locator('text=Fast Moving Items')).toBeVisible()
      await expect(adminPage.locator('text=Slow Moving Items')).toBeVisible()
      await expect(adminPage.locator('text=Items Near Expiry')).toBeVisible()
    })

    test('should track prescription analytics', async () => {
      await adminPage.goto('/admin/prescriptions')
      
      await adminPage.click('button:has-text("Analytics")')
      
      // Should show prescription patterns
      await expect(adminPage.locator('text=Most Prescribed Medications')).toBeVisible()
      await expect(adminPage.locator('text=Prescription Trends')).toBeVisible()
      await expect(adminPage.locator('text=Doctor Prescribing Patterns')).toBeVisible()
      
      // Should show charts and metrics
      await expect(adminPage.locator('[data-testid="prescription-chart"]')).toBeVisible()
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle payment failures gracefully', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      
      // Simulate card payment failure
      await receptionistPage.selectOption('select[name="payment_method"]', 'card')
      await receptionistPage.fill('input[name="card_number"]', '4000-0000-0000-0002') // Declined card
      
      await receptionistPage.click('button:has-text("Process Card Payment")')
      
      // Should show payment declined message
      await expect(receptionistPage.locator('text=Payment declined')).toBeVisible()
      await expect(receptionistPage.locator('text=Please try another payment method')).toBeVisible()
      
      // Should still allow retry
      await expect(receptionistPage.locator('button:has-text("Retry Payment")')).toBeVisible()
    })

    test('should handle prescription dispensing errors', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Try to dispense expired medication
      await pharmacistPage.click('[data-testid="dispense-medication"]:first-child')
      
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 1)
      
      await pharmacistPage.fill('input[name="expiry_date"]', pastDate.toISOString().split('T')[0])
      
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Should prevent dispensing expired medication
      await expect(pharmacistPage.locator('text=Cannot dispense expired medication')).toBeVisible()
    })

    test('should validate insurance claim information', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="unpaid-invoice"]:first-child')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      await receptionistPage.selectOption('select[name="payment_method"]', 'insurance')
      
      // Submit with missing information
      await receptionistPage.click('button:has-text("Submit Insurance Claim")')
      
      // Should show validation errors
      await expect(receptionistPage.locator('text=Insurance provider is required')).toBeVisible()
      await expect(receptionistPage.locator('text=Policy number is required')).toBeVisible()
    })
  })
})