'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSellOrderFromTreatmentPlan } from '@/lib/services/sell-order-service'
import { Pill, ShoppingCart, User, Calendar } from 'lucide-react'

export function TreatmentPlanOrders() {
  const [loading, setLoading] = useState(false)
  const [lastCreatedOrder, setLastCreatedOrder] = useState<string | null>(null)

  const handleCreateTestSellOrder = async () => {
    setLoading(true)
    
    try {
      console.log('🧪 Creating test sell order for existing treatment plan...')
      
      const result = await createSellOrderFromTreatmentPlan({
        consultationId: "9ebac7de-4f29-4f8d-bec5-3510a2451bd5",
        treatmentPlanId: "5e23499e-df08-4be4-a125-594f04756f26",
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
      })

      if (result.success) {
        setLastCreatedOrder(result.sellOrder?.order_number || null)
        console.log('✅ Test successful:', result.sellOrder)
      } else {
        console.error('❌ Test failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Treatment Plan Orders
        </CardTitle>
        <CardDescription>
          Automatically generated sell orders from consultation treatment plans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Section */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Test Sell Order Creation</h4>
          <p className="text-sm text-blue-700 mb-3">
            Create a sell order for the existing treatment plan with Ampicillin medication
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-600">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4" />
                Patient: Test Patient
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-4 w-4" />
                Medication: Ampicillin 250-500mg
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duration: 7 days, Four times daily
              </div>
            </div>
            
            <Button 
              onClick={handleCreateTestSellOrder}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Creating...' : 'Create Test Order'}
            </Button>
          </div>
          
          {lastCreatedOrder && (
            <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Last Created: {lastCreatedOrder}
              </Badge>
            </div>
          )}
        </div>

        {/* Integration Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Integration Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
              <span>Automatic sell order generation from treatment plans</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">Ready</Badge>
              <span>Pharmacy prescriptions integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
              <span>Inventory management integration</span>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Sell orders are automatically created when treatment plans with medications are saved</p>
          <p>• Orders appear in the pharmacy prescriptions dashboard</p>
          <p>• Quantities are estimated based on dosage frequency and duration</p>
          <p>• Final pricing and inventory are managed during dispensing</p>
        </div>
      </CardContent>
    </Card>
  )
}