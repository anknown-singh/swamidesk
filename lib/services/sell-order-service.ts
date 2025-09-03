'use client'

import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client'

export interface TreatmentPlanMedication {
  medicine_id: string
  medication_name: string
  generic_name?: string
  dosage: string
  frequency: string
  duration: string
  route: string
  instructions: string
  category?: string
  [key: string]: any
}

export interface CreateSellOrderFromTreatmentPlanParams {
  consultationId: string
  treatmentPlanId: string
  patientId: string
  doctorId: string
  medications: TreatmentPlanMedication[]
  patientName: string
  patientContact?: string
  estimatedCost?: number
}

export async function createSellOrderFromTreatmentPlan({
  consultationId,
  treatmentPlanId,
  patientId,
  doctorId,
  medications,
  patientName,
  patientContact,
  estimatedCost
}: CreateSellOrderFromTreatmentPlanParams) {
  const supabase = createAuthenticatedClient()
  
  try {
    console.log('Creating sell order from treatment plan:', {
      consultationId,
      treatmentPlanId,
      patientId,
      medications: medications.length
    })

    // Create the sell order
    const { data: sellOrder, error: sellOrderError } = await supabase
      .from('sell_orders')
      .insert({
        customer_name: patientName,
        customer_contact: patientContact,
        patient_id: patientId,
        status: 'pending',
        payment_status: 'pending',
        payment_method: null,
        subtotal: estimatedCost || 0,
        total_amount: estimatedCost || 0,
        gst_amount: 0,
        discount_amount: 0,
        notes: `Generated from consultation ${consultationId} - Treatment Plan: ${treatmentPlanId}`,
        created_by: doctorId,
        sale_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (sellOrderError) {
      console.error('Error creating sell order:', sellOrderError)
      throw sellOrderError
    }

    console.log('Sell order created:', sellOrder.id, sellOrder.order_number)

    // Create sell order items for each medication
    const sellOrderItems = []
    
    for (const medication of medications) {
      // Get medicine details from medicine_master table
      const { data: medicineData, error: medicineError } = await supabase
        .from('medicine_master')
        .select('*')
        .eq('id', medication.medicine_id)
        .single()

      if (medicineError) {
        console.warn('Could not find medicine details for:', medication.medicine_id, medicineError)
      }

      // Calculate default values
      const unitPrice = 50.00 // Default price - should be fetched from inventory or medicine master
      const quantity = parseDurationToQuantity(medication.frequency, medication.duration)
      const gstPercentage = 18.00
      const gstAmount = (unitPrice * quantity * gstPercentage) / 100
      const totalPrice = (unitPrice * quantity) + gstAmount

      const sellOrderItem = {
        sell_order_id: sellOrder.id,
        medicine_name: medication.medication_name || medication.generic_name,
        salt_content: medicineData?.generic_name || medication.generic_name,
        company_name: medicineData?.brand_names?.[0] || 'Generic',
        quantity: quantity,
        unit_price: unitPrice,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount,
        total_price: totalPrice,
        prescription_id: null, // Will be linked when traditional prescription is created
        batch_number: null, // To be filled during dispensing
        expiry_date: null, // To be filled during dispensing
        scheme_offer: medication.instructions ? `Prescription: ${medication.dosage} ${medication.frequency}` : null
      }

      sellOrderItems.push(sellOrderItem)
    }

    // Insert all sell order items
    const { data: items, error: itemsError } = await supabase
      .from('sell_order_items')
      .insert(sellOrderItems)
      .select()

    if (itemsError) {
      console.error('Error creating sell order items:', itemsError)
      // Try to cleanup the sell order if items failed
      await supabase.from('sell_orders').delete().eq('id', sellOrder.id)
      throw itemsError
    }

    console.log('Sell order items created:', items.length)

    // Update sell order totals based on actual item calculations
    const actualSubtotal = sellOrderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    const actualGstAmount = sellOrderItems.reduce((sum, item) => sum + item.gst_amount, 0)
    const actualTotal = actualSubtotal + actualGstAmount

    await supabase
      .from('sell_orders')
      .update({
        subtotal: actualSubtotal,
        gst_amount: actualGstAmount,
        total_amount: actualTotal
      })
      .eq('id', sellOrder.id)

    console.log('✅ Sell order created successfully:', sellOrder.order_number)

    return {
      success: true,
      sellOrder: {
        ...sellOrder,
        subtotal: actualSubtotal,
        gst_amount: actualGstAmount,
        total_amount: actualTotal
      },
      items
    }

  } catch (error) {
    console.error('❌ Error in createSellOrderFromTreatmentPlan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Helper function to estimate quantity based on frequency and duration
function parseDurationToQuantity(frequency: string, duration: string): number {
  // Default quantity estimation logic
  const frequencyMultipliers: { [key: string]: number } = {
    'once daily': 1,
    'twice daily': 2,
    'three times daily': 3,
    'four times daily': 4,
    'every 6 hours': 4,
    'every 8 hours': 3,
    'every 12 hours': 2,
    'as needed': 1
  }

  const durationDays = parseDurationToDays(duration)
  const dailyFrequency = frequencyMultipliers[frequency.toLowerCase()] || 2 // Default to twice daily
  
  return Math.max(1, durationDays * dailyFrequency)
}

function parseDurationToDays(duration: string): number {
  if (!duration) return 7 // Default to 7 days
  
  const durationLower = duration.toLowerCase()
  
  if (durationLower.includes('day')) {
    const match = durationLower.match(/(\d+)\s*day/)
    return match ? parseInt(match[1]) : 7
  }
  
  if (durationLower.includes('week')) {
    const match = durationLower.match(/(\d+)\s*week/)
    return match ? parseInt(match[1]) * 7 : 7
  }
  
  if (durationLower.includes('month')) {
    const match = durationLower.match(/(\d+)\s*month/)
    return match ? parseInt(match[1]) * 30 : 30
  }
  
  return 7 // Default to 7 days
}