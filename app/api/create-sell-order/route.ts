import { NextRequest, NextResponse } from 'next/server'
import { createSellOrderFromTreatmentPlan } from '@/lib/services/sell-order-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { treatmentPlanId, consultationId } = body

    // Test data for the existing treatment plan
    const testData = {
      consultationId: consultationId || "9ebac7de-4f29-4f8d-bec5-3510a2451bd5",
      treatmentPlanId: treatmentPlanId || "5e23499e-df08-4be4-a125-594f04756f26",
      patientId: "56ba9871-4ed8-4a12-b19f-1e67fb1291a9",
      doctorId: "8f4424ef-f9b2-4071-ab9c-da50aa9f1681",
      medications: [
        {
          "medicine_id": "49838f3b-06bd-4d7c-a8b0-6d107d7d0b64",
          "medication_name": "Ampicillin",
          "generic_name": "Ampicillin",
          "route": "Oral",
          "dosage": "250-500mg four times daily",
          "category": "Antibiotic",
          "duration": "7 days",
          "frequency": "Four times daily",
          "instructions": "Take with food"
        }
      ],
      patientName: "Test Patient",
      patientContact: "1234567890",
      estimatedCost: 100
    }

    console.log('🧪 API: Creating sell order for treatment plan...')
    
    const result = await createSellOrderFromTreatmentPlan(testData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sell order created successfully',
        data: result
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create sell order',
        error: result.error
      }, { status: 400 })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}