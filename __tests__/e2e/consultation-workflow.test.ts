import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { setupTestUser, cleanupTestData, createMockPatientData } from '../utils/e2e-helpers'

test.describe('Complete Consultation and Prescription Workflow E2E', () => {
  let doctorPage: Page
  let pharmacistPage: Page
  let receptionistPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    
    doctorPage = await context.newPage()
    pharmacistPage = await context.newPage()
    receptionistPage = await context.newPage()

    await setupTestUser(doctorPage, 'doctor')
    await setupTestUser(pharmacistPage, 'pharmacist')
    await setupTestUser(receptionistPage, 'receptionist')
  })

  test.afterAll(async () => {
    await cleanupTestData()
    await context.close()
  })

  test.describe('Patient Consultation Flow', () => {
    test('should complete full patient consultation', async () => {
      await doctorPage.goto('/doctor/consultations')
      
      // Should see patient queue
      await expect(doctorPage.locator('h1:has-text("Consultations")')).toBeVisible()
      await expect(doctorPage.locator('[data-testid="patient-queue"]')).toBeVisible()
      
      // Call next patient
      await doctorPage.click('button:has-text("Call Next")')
      
      // Should open consultation form
      await expect(doctorPage.locator('h2:has-text("Patient Consultation")')).toBeVisible()
      
      // Fill patient history
      await doctorPage.fill('textarea[name="chief_complaint"]', 'Patient complains of persistent headache for 3 days')
      await doctorPage.fill('textarea[name="history_present_illness"]', 'Gradual onset, no trauma, worse in the morning')
      await doctorPage.fill('textarea[name="past_medical_history"]', 'No significant past medical history')
      
      // Record vital signs
      await doctorPage.fill('input[name="blood_pressure_systolic"]', '120')
      await doctorPage.fill('input[name="blood_pressure_diastolic"]', '80')
      await doctorPage.fill('input[name="pulse_rate"]', '72')
      await doctorPage.fill('input[name="temperature"]', '98.6')
      await doctorPage.fill('input[name="respiratory_rate"]', '16')
      await doctorPage.fill('input[name="oxygen_saturation"]', '99')
      
      // Physical examination
      await doctorPage.fill('textarea[name="general_examination"]', 'Patient appears well, no acute distress')
      await doctorPage.fill('textarea[name="systemic_examination"]', 'CNS: Alert and oriented, no focal deficits')
      
      // Provisional diagnosis
      await doctorPage.fill('textarea[name="provisional_diagnosis"]', 'Tension headache')
      await doctorPage.fill('textarea[name="differential_diagnosis"]', 'Migraine, cluster headache')
      
      // Save consultation
      await doctorPage.click('button:has-text("Save Consultation")')
      
      await expect(doctorPage.locator('text=Consultation saved successfully')).toBeVisible()
    })

    test('should create prescription during consultation', async () => {
      await doctorPage.goto('/doctor/consultations')
      
      // Open active consultation
      await doctorPage.click('[data-testid="active-consultation"]')
      
      // Go to prescription tab
      await doctorPage.click('button:has-text("Prescription")')
      
      // Add medication
      await doctorPage.click('button:has-text("Add Medication")')
      
      // Search and select medication
      await doctorPage.fill('input[name="medication_search"]', 'Paracetamol')
      await doctorPage.click('text=Paracetamol 500mg')
      
      // Set dosage
      await doctorPage.fill('input[name="dosage"]', '500mg')
      await doctorPage.selectOption('select[name="frequency"]', 'TID') // Three times a day
      await doctorPage.fill('input[name="duration"]', '5 days')
      await doctorPage.fill('textarea[name="instructions"]', 'Take after meals')
      
      // Add medication to prescription
      await doctorPage.click('button:has-text("Add to Prescription")')
      
      // Add another medication
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Ibuprofen')
      await doctorPage.click('text=Ibuprofen 400mg')
      
      await doctorPage.fill('input[name="dosage"]', '400mg')
      await doctorPage.selectOption('select[name="frequency"]', 'BID') // Twice a day
      await doctorPage.fill('input[name="duration"]', '3 days')
      await doctorPage.fill('textarea[name="instructions"]', 'Take with food, avoid if stomach upset')
      
      await doctorPage.click('button:has-text("Add to Prescription")')
      
      // Review prescription
      await expect(doctorPage.locator('text=Paracetamol 500mg')).toBeVisible()
      await expect(doctorPage.locator('text=Ibuprofen 400mg')).toBeVisible()
      await expect(doctorPage.locator('text=TID')).toBeVisible()
      await expect(doctorPage.locator('text=BID')).toBeVisible()
      
      // Add prescription notes
      await doctorPage.fill('textarea[name="prescription_notes"]', 'Follow up if symptoms persist after 5 days')
      
      // Finalize prescription
      await doctorPage.click('button:has-text("Finalize Prescription")')
      
      await expect(doctorPage.locator('text=Prescription created successfully')).toBeVisible()
    })

    test('should order diagnostic tests', async () => {
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      
      // Go to investigations tab
      await doctorPage.click('button:has-text("Investigations")')
      
      // Order lab tests
      await doctorPage.click('button:has-text("Order Tests")')
      
      // Select blood tests
      await doctorPage.check('input[value="complete_blood_count"]')
      await doctorPage.check('input[value="blood_sugar_fasting"]')
      await doctorPage.check('input[value="lipid_profile"]')
      
      // Select imaging
      await doctorPage.check('input[value="chest_xray"]')
      
      // Add special instructions
      await doctorPage.fill('textarea[name="test_instructions"]', 'Patient should fast for 12 hours before blood tests')
      
      // Set priority
      await doctorPage.selectOption('select[name="priority"]', 'routine')
      
      // Order tests
      await doctorPage.click('button:has-text("Order Tests")')
      
      await expect(doctorPage.locator('text=Tests ordered successfully')).toBeVisible()
      await expect(doctorPage.locator('text=Complete Blood Count')).toBeVisible()
      await expect(doctorPage.locator('text=Blood Sugar (Fasting)')).toBeVisible()
    })

    test('should create treatment plan', async () => {
      await doctorPage.goto('/doctor/treatment-plans')
      
      // Create new treatment plan
      await doctorPage.click('button:has-text("New Treatment Plan")')
      
      // Select patient visit
      await doctorPage.selectOption('select[name="visit_id"]', 'visit1')
      
      // Fill treatment plan details
      await doctorPage.fill('input[name="plan_name"]', 'Hypertension Management Plan')
      await doctorPage.fill('textarea[name="description"]', 'Comprehensive plan for managing patient hypertension')
      
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 90) // 3 months
      
      await doctorPage.fill('input[name="start_date"]', startDate.toISOString().split('T')[0])
      await doctorPage.fill('input[name="end_date"]', endDate.toISOString().split('T')[0])
      
      await doctorPage.fill('input[name="follow_up_frequency"]', 'Every 2 weeks')
      
      // Add detailed instructions
      await doctorPage.fill('textarea[name="instructions"]', 
        `1. Take prescribed medications as directed
         2. Monitor blood pressure daily
         3. Follow low-sodium diet
         4. Exercise 30 minutes daily
         5. Regular follow-up visits`
      )
      
      // Create treatment plan
      await doctorPage.click('button:has-text("Create Treatment Plan")')
      
      await expect(doctorPage.locator('text=Treatment plan created successfully')).toBeVisible()
      await expect(doctorPage.locator('text=Hypertension Management Plan')).toBeVisible()
    })

    test('should handle consultation notes and patient history', async () => {
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      
      // Add consultation notes
      await doctorPage.fill('textarea[name="consultation_notes"]', 
        `Patient presents with 3-day history of headache. Pain is dull, constant, worse in the morning.
         No associated symptoms. Physical examination normal.
         Likely tension headache. Prescribed analgesics and advised rest.`
      )
      
      // Add follow-up instructions
      await doctorPage.fill('textarea[name="follow_up_instructions"]', 
        `Return if symptoms worsen or persist beyond 1 week.
         Seek immediate care if severe headache, fever, or neurological symptoms develop.`
      )
      
      // Set follow-up date
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 7)
      await doctorPage.fill('input[name="follow_up_date"]', followUpDate.toISOString().split('T')[0])
      
      // Complete consultation
      await doctorPage.click('button:has-text("Complete Consultation")')
      
      // Should show completion confirmation
      await expect(doctorPage.locator('text=Consultation completed successfully')).toBeVisible()
      
      // Verify patient moved to completed list
      await doctorPage.click('button:has-text("Completed Consultations")')
      await expect(doctorPage.locator('[data-testid="completed-consultation"]')).toBeVisible()
    })
  })

  test.describe('Pharmacy Workflow', () => {
    test('should process prescription from doctor', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      
      // Should see pending prescriptions
      await expect(pharmacistPage.locator('h1:has-text("Pharmacy Queue")')).toBeVisible()
      await expect(pharmacistPage.locator('[data-testid="prescription-queue"]')).toBeVisible()
      
      // Select prescription to process
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Should show prescription details
      await expect(pharmacistPage.locator('text=Prescription Details')).toBeVisible()
      await expect(pharmacistPage.locator('text=Paracetamol 500mg')).toBeVisible()
      await expect(pharmacistPage.locator('text=Ibuprofen 400mg')).toBeVisible()
      
      // Check medication availability
      await pharmacistPage.click('button:has-text("Check Availability")')
      
      // Should show stock status
      await expect(pharmacistPage.locator('text=In Stock')).toBeVisible()
      
      // Process first medication
      await pharmacistPage.click('[data-testid="dispense-paracetamol"]')
      
      // Fill dispensing details
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '15') // 15 tablets
      await pharmacistPage.fill('input[name="batch_number"]', 'PCM2024001')
      
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 2)
      await pharmacistPage.fill('input[name="expiry_date"]', expiryDate.toISOString().split('T')[0])
      
      await pharmacistPage.fill('textarea[name="dispensing_notes"]', 'Patient counseled on dosage and timing')
      
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Process second medication
      await pharmacistPage.click('[data-testid="dispense-ibuprofen"]')
      
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '6') // 6 tablets
      await pharmacistPage.fill('input[name="batch_number"]', 'IBU2024001')
      await pharmacistPage.fill('input[name="expiry_date"]', expiryDate.toISOString().split('T')[0])
      await pharmacistPage.fill('textarea[name="dispensing_notes"]', 'Warned about stomach upset, take with food')
      
      await pharmacistPage.click('button:has-text("Dispense")')
      
      // Complete prescription
      await pharmacistPage.click('button:has-text("Complete Prescription")')
      
      await expect(pharmacistPage.locator('text=Prescription completed successfully')).toBeVisible()
    })

    test('should handle partial dispensing', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('[data-testid="dispense-paracetamol"]')
      
      // Dispense partial quantity
      await pharmacistPage.fill('input[name="quantity_dispensed"]', '10') // Only 10 out of 15
      await pharmacistPage.check('input[name="partial_dispensing"]')
      await pharmacistPage.fill('textarea[name="partial_reason"]', 'Insufficient stock, remaining 5 tablets on backorder')
      
      await pharmacistPage.click('button:has-text("Dispense Partial")')
      
      // Should create backorder
      await expect(pharmacistPage.locator('text=Partial dispensing recorded')).toBeVisible()
      await expect(pharmacistPage.locator('text=Backorder created')).toBeVisible()
    })

    test('should manage medication inventory', async () => {
      await pharmacistPage.goto('/pharmacy/inventory')
      
      // View current inventory
      await expect(pharmacistPage.locator('h1:has-text("Inventory Management")')).toBeVisible()
      
      // Search for medication
      await pharmacistPage.fill('input[name="search"]', 'Paracetamol')
      await pharmacistPage.press('input[name="search"]', 'Enter')
      
      // Should show search results
      await expect(pharmacistPage.locator('text=Paracetamol 500mg')).toBeVisible()
      
      // Check stock level
      const stockElement = pharmacistPage.locator('[data-testid="stock-level"]')
      await expect(stockElement).toBeVisible()
      
      // Add stock if low
      const stockText = await stockElement.textContent()
      const stockLevel = parseInt(stockText || '0')
      
      if (stockLevel < 50) {
        await pharmacistPage.click('button:has-text("Add Stock")')
        
        await pharmacistPage.fill('input[name="quantity"]', '100')
        await pharmacistPage.fill('input[name="batch_number"]', 'PCM2024002')
        await pharmacistPage.fill('input[name="supplier"]', 'MediSupply Ltd')
        
        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + 2)
        await pharmacistPage.fill('input[name="expiry_date"]', expiryDate.toISOString().split('T')[0])
        
        await pharmacistPage.fill('input[name="unit_cost"]', '2.50')
        
        await pharmacistPage.click('button:has-text("Add Stock")')
        
        await expect(pharmacistPage.locator('text=Stock added successfully')).toBeVisible()
      }
    })

    test('should generate medication labels', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Generate labels for all medications
      await pharmacistPage.click('button:has-text("Generate Labels")')
      
      // Should show label preview
      await expect(pharmacistPage.locator('text=Medication Labels')).toBeVisible()
      
      // Verify label content
      await expect(pharmacistPage.locator('text=Patient Name:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Medication:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Dosage:')).toBeVisible()
      await expect(pharmacistPage.locator('text=Instructions:')).toBeVisible()
      
      // Print labels
      await pharmacistPage.click('button:has-text("Print Labels")')
      
      await expect(pharmacistPage.locator('text=Labels printed successfully')).toBeVisible()
    })
  })

  test.describe('Real-time Communication Between Doctor and Pharmacist', () => {
    test('should notify pharmacist when prescription is created', async () => {
      // Doctor creates prescription
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      await doctorPage.click('button:has-text("Prescription")')
      
      // Add medication and finalize
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Amoxicillin')
      await doctorPage.click('text=Amoxicillin 500mg')
      await doctorPage.fill('input[name="dosage"]', '500mg')
      await doctorPage.selectOption('select[name="frequency"]', 'TID')
      await doctorPage.fill('input[name="duration"]', '7 days')
      await doctorPage.click('button:has-text("Add to Prescription")')
      await doctorPage.click('button:has-text("Finalize Prescription")')
      
      // Pharmacist should receive real-time notification
      await pharmacistPage.waitForSelector('[data-testid="new-prescription-notification"]', {
        timeout: 5000
      })
      
      await expect(pharmacistPage.locator('text=New prescription received')).toBeVisible()
      
      // Notification should show patient and doctor details
      await expect(pharmacistPage.locator('text=Amoxicillin 500mg')).toBeVisible()
    })

    test('should allow pharmacist to query doctor about prescription', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Query about unclear dosage
      await pharmacistPage.click('button:has-text("Query Doctor")')
      
      await pharmacistPage.fill('textarea[name="query"]', 
        'Please clarify if the dosage for Ibuprofen should be 400mg TID or BID for this patient weight?'
      )
      await pharmacistPage.selectOption('select[name="priority"]', 'urgent')
      
      await pharmacistPage.click('button:has-text("Send Query")')
      
      // Doctor should receive query notification
      await doctorPage.waitForSelector('[data-testid="pharmacist-query"]', {
        timeout: 5000
      })
      
      await expect(doctorPage.locator('text=Prescription query from pharmacist')).toBeVisible()
      
      // Doctor responds to query
      await doctorPage.click('[data-testid="pharmacist-query"]')
      await doctorPage.fill('textarea[name="response"]', 
        'For this patient weight (65kg), Ibuprofen 400mg BID is appropriate. Please dispense as BID.'
      )
      await doctorPage.click('button:has-text("Send Response")')
      
      // Pharmacist receives response
      await pharmacistPage.waitForSelector('[data-testid="doctor-response"]', {
        timeout: 5000
      })
      
      await expect(pharmacistPage.locator('text=Doctor response received')).toBeVisible()
    })

    test('should handle prescription modifications in real-time', async () => {
      // Doctor modifies existing prescription
      await doctorPage.goto('/doctor/prescriptions')
      await doctorPage.click('[data-testid="active-prescription"]')
      
      await doctorPage.click('button:has-text("Modify Prescription")')
      
      // Change dosage
      await doctorPage.fill('input[name="paracetamol_dosage"]', '1000mg') // Changed from 500mg
      await doctorPage.selectOption('select[name="paracetamol_frequency"]', 'BID') // Changed from TID
      
      await doctorPage.click('button:has-text("Update Prescription")')
      
      // Pharmacist should see modification alert
      await pharmacistPage.waitForSelector('[data-testid="prescription-modified"]', {
        timeout: 5000
      })
      
      await expect(pharmacistPage.locator('text=Prescription has been modified')).toBeVisible()
      await expect(pharmacistPage.locator('text=Paracetamol 1000mg BID')).toBeVisible()
    })
  })

  test.describe('Billing Integration', () => {
    test('should generate bill after consultation and prescription', async () => {
      // Complete consultation and prescription workflow first
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      await doctorPage.click('button:has-text("Complete Consultation")')
      
      // Pharmacist completes dispensing
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      await pharmacistPage.click('button:has-text("Complete Prescription")')
      
      // Receptionist generates bill
      await receptionistPage.goto('/receptionist/billing')
      
      // Should see completed visit ready for billing
      await expect(receptionistPage.locator('[data-testid="billing-queue"]')).toBeVisible()
      await receptionistPage.click('[data-testid="visit-to-bill"]')
      
      // Should show itemized bill
      await expect(receptionistPage.locator('text=Consultation Fee')).toBeVisible()
      await expect(receptionistPage.locator('text=Medication Charges')).toBeVisible()
      await expect(receptionistPage.locator('text=Paracetamol')).toBeVisible()
      await expect(receptionistPage.locator('text=Ibuprofen')).toBeVisible()
      
      // Apply discount if needed
      await receptionistPage.fill('input[name="discount_percentage"]', '10')
      await receptionistPage.click('button:has-text("Apply Discount")')
      
      // Process payment
      await receptionistPage.selectOption('select[name="payment_method"]', 'cash')
      await receptionistPage.fill('input[name="amount_paid"]', '850')
      
      await receptionistPage.click('button:has-text("Process Payment")')
      
      await expect(receptionistPage.locator('text=Payment processed successfully')).toBeVisible()
      await expect(receptionistPage.locator('text=Receipt generated')).toBeVisible()
    })

    test('should handle insurance claims', async () => {
      await receptionistPage.goto('/receptionist/billing')
      await receptionistPage.click('[data-testid="visit-to-bill"]')
      
      // Select insurance payment
      await receptionistPage.selectOption('select[name="payment_method"]', 'insurance')
      
      // Fill insurance details
      await receptionistPage.fill('input[name="insurance_provider"]', 'HealthFirst Insurance')
      await receptionistPage.fill('input[name="policy_number"]', 'HF123456789')
      await receptionistPage.fill('input[name="claim_number"]', 'CLM2024001')
      
      // Set copay amount
      await receptionistPage.fill('input[name="copay_amount"]', '100')
      
      // Submit insurance claim
      await receptionistPage.click('button:has-text("Submit Insurance Claim")')
      
      await expect(receptionistPage.locator('text=Insurance claim submitted')).toBeVisible()
      await expect(receptionistPage.locator('text=Pending approval')).toBeVisible()
    })
  })

  test.describe('Medical Records and History', () => {
    test('should maintain comprehensive patient medical record', async () => {
      await doctorPage.goto('/doctor/consultations')
      
      // View patient history
      await doctorPage.click('[data-testid="patient-item"]')
      await doctorPage.click('button:has-text("View History")')
      
      // Should show comprehensive medical record
      await expect(doctorPage.locator('text=Medical History')).toBeVisible()
      await expect(doctorPage.locator('text=Previous Consultations')).toBeVisible()
      await expect(doctorPage.locator('text=Prescription History')).toBeVisible()
      await expect(doctorPage.locator('text=Test Results')).toBeVisible()
      await expect(doctorPage.locator('text=Treatment Plans')).toBeVisible()
      
      // View specific consultation
      await doctorPage.click('[data-testid="previous-consultation"]')
      
      // Should show detailed consultation record
      await expect(doctorPage.locator('text=Chief Complaint')).toBeVisible()
      await expect(doctorPage.locator('text=Diagnosis')).toBeVisible()
      await expect(doctorPage.locator('text=Treatment Given')).toBeVisible()
    })

    test('should track medication allergies and interactions', async () => {
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      
      // Add allergy information
      await doctorPage.click('button:has-text("Allergies")')
      await doctorPage.click('button:has-text("Add Allergy")')
      
      await doctorPage.fill('input[name="allergen"]', 'Penicillin')
      await doctorPage.selectOption('select[name="reaction_type"]', 'severe')
      await doctorPage.fill('textarea[name="reaction_details"]', 'Skin rash, difficulty breathing')
      
      await doctorPage.click('button:has-text("Save Allergy")')
      
      // When prescribing medication, should check for allergies
      await doctorPage.click('button:has-text("Prescription")')
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Amoxicillin')
      
      // Should show allergy warning
      await expect(doctorPage.locator('text=Allergy Warning')).toBeVisible()
      await expect(doctorPage.locator('text=Patient allergic to Penicillin')).toBeVisible()
    })

    test('should generate medical reports and summaries', async () => {
      await doctorPage.goto('/doctor/consultations')
      
      // Generate discharge summary
      await doctorPage.click('[data-testid="completed-consultation"]')
      await doctorPage.click('button:has-text("Generate Summary")')
      
      // Should create comprehensive summary
      await expect(doctorPage.locator('text=Discharge Summary')).toBeVisible()
      await expect(doctorPage.locator('text=Admission Date')).toBeVisible()
      await expect(doctorPage.locator('text=Primary Diagnosis')).toBeVisible()
      await expect(doctorPage.locator('text=Treatment Given')).toBeVisible()
      await expect(doctorPage.locator('text=Medications Prescribed')).toBeVisible()
      await expect(doctorPage.locator('text=Follow-up Instructions')).toBeVisible()
      
      // Print or send summary
      await doctorPage.click('button:has-text("Print Summary")')
      await expect(doctorPage.locator('text=Summary printed successfully')).toBeVisible()
    })
  })

  test.describe('Quality Control and Validation', () => {
    test('should validate prescription dosages against patient weight/age', async () => {
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      
      // Set patient details (child patient)
      await doctorPage.fill('input[name="patient_age"]', '8')
      await doctorPage.fill('input[name="patient_weight"]', '25') // kg
      
      await doctorPage.click('button:has-text("Prescription")')
      await doctorPage.click('button:has-text("Add Medication")')
      
      // Try to prescribe adult dose for child
      await doctorPage.fill('input[name="medication_search"]', 'Ibuprofen')
      await doctorPage.click('text=Ibuprofen 400mg')
      await doctorPage.fill('input[name="dosage"]', '400mg')
      await doctorPage.selectOption('select[name="frequency"]', 'TID')
      
      // Should show dosage warning
      await expect(doctorPage.locator('text=Dosage Warning')).toBeVisible()
      await expect(doctorPage.locator('text=Exceeds recommended pediatric dose')).toBeVisible()
      
      // Adjust to appropriate dose
      await doctorPage.fill('input[name="dosage"]', '150mg') // Appropriate for child
      await expect(doctorPage.locator('text=Dosage Warning')).not.toBeVisible()
    })

    test('should check for drug interactions', async () => {
      await doctorPage.goto('/doctor/consultations')
      await doctorPage.click('[data-testid="active-consultation"]')
      await doctorPage.click('button:has-text("Prescription")')
      
      // Add first medication
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Warfarin')
      await doctorPage.click('text=Warfarin 5mg')
      await doctorPage.fill('input[name="dosage"]', '5mg')
      await doctorPage.click('button:has-text("Add to Prescription")')
      
      // Add second medication that interacts
      await doctorPage.click('button:has-text("Add Medication")')
      await doctorPage.fill('input[name="medication_search"]', 'Aspirin')
      await doctorPage.click('text=Aspirin 325mg')
      await doctorPage.fill('input[name="dosage"]', '325mg')
      
      // Should show interaction warning
      await expect(doctorPage.locator('text=Drug Interaction Warning')).toBeVisible()
      await expect(doctorPage.locator('text=Warfarin and Aspirin')).toBeVisible()
      await expect(doctorPage.locator('text=Increased bleeding risk')).toBeVisible()
      
      // Doctor can acknowledge and proceed with caution
      await doctorPage.click('button:has-text("Acknowledge and Proceed")')
      await doctorPage.fill('textarea[name="interaction_notes"]', 'Patient counseled about bleeding risk, monitor PT/INR closely')
    })

    test('should ensure prescription completeness before dispensing', async () => {
      await pharmacistPage.goto('/pharmacy/pharmacy')
      await pharmacistPage.click('[data-testid="prescription-item"]:first-child')
      
      // Try to dispense incomplete prescription
      await pharmacistPage.click('[data-testid="dispense-medication"]')
      
      // If missing required information, should prevent dispensing
      if (await pharmacistPage.locator('text=Missing patient weight').isVisible()) {
        await expect(pharmacistPage.locator('text=Cannot dispense: Missing patient weight')).toBeVisible()
        await expect(pharmacistPage.locator('button:has-text("Dispense")')).toBeDisabled()
        
        // Contact doctor for missing information
        await pharmacistPage.click('button:has-text("Request Information")')
        await pharmacistPage.fill('textarea[name="information_request"]', 'Please provide patient weight for accurate dosing')
        await pharmacistPage.click('button:has-text("Send Request")')
      }
    })
  })
})