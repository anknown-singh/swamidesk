'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IntegratedBilling } from '@/components/billing/integrated-billing'
import { PatientTracker } from '@/components/workflow/patient-tracker'

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="billing">Integrated Billing</TabsTrigger>
          <TabsTrigger value="tracker">Patient Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="billing" className="space-y-6">
          <IntegratedBilling />
        </TabsContent>
        
        <TabsContent value="tracker" className="space-y-6">
          <PatientTracker 
            userRole="receptionist" 
            showAllPatients={true}
            filterByStatus={['completed', 'billed']}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}