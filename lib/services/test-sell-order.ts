'use client'

import { createSellOrderFromTreatmentPlan } from './sell-order-service'

// Test function using the data you provided
export async function testCreateSellOrderForExistingTreatmentPlan() {
  const treatmentPlanData = {
    "id": "5e23499e-df08-4be4-a125-594f04756f26",
    "consultation_id": "9ebac7de-4f29-4f8d-bec5-3510a2451bd5",
    "treatment_type": "comprehensive",
    "primary_treatment": "Ampicillin",
    "medications": [
      {
        "route": "Oral",
        "dosage": "250-500mg four times daily",
        "routes": ["Oral", "IV"],
        "category": "Antibiotic",
        "duration": "7 days",
        "warnings": [],
        "frequency": "Four times daily",
        "strengths": ["250mg", "500mg"],
        "brand_names": ["Principen"],
        "indications": ["UTI", "Respiratory infections"],
        "is_critical": false,
        "medicine_id": "49838f3b-06bd-4d7c-a8b0-6d107d7d0b64",
        "subcategory": "Penicillin",
        "dosage_forms": ["Capsule", "Injection"],
        "generic_name": "Ampicillin",
        "instructions": "Take with food",
        "medication_name": "Ampicillin",
        "contraindications": ["Penicillin allergy"],
        "therapeutic_class": "Gram-positive infections",
        "controlled_substance": false,
        "prescription_required": true,
        "standard_dosage_adult": "250-500mg four times daily"
      }
    ]
  }

  try {
    console.log('🧪 Testing sell order creation for existing treatment plan...')
    
    const result = await createSellOrderFromTreatmentPlan({
      consultationId: treatmentPlanData.consultation_id,
      treatmentPlanId: treatmentPlanData.id,
      patientId: "56ba9871-4ed8-4a12-b19f-1e67fb1291a9", // From your OPD management logs
      doctorId: "8f4424ef-f9b2-4071-ab9c-da50aa9f1681", // From your OPD management logs
      medications: treatmentPlanData.medications,
      patientName: "Test Patient",
      patientContact: "1234567890",
      estimatedCost: 100
    })

    if (result.success) {
      console.log('✅ Test successful! Sell order created:', result.sellOrder?.order_number)
      return result
    } else {
      console.error('❌ Test failed:', result.error)
      return result
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}