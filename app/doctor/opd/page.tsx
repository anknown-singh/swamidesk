'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OPDManagement } from '@/components/opd/opd-management'
import { PatientTracker } from '@/components/workflow/patient-tracker'

export default function DoctorOPDPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="opd" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opd">OPD Management</TabsTrigger>
          <TabsTrigger value="tracker">Patient Tracker</TabsTrigger>
        </TabsList>
        
        <TabsContent value="opd" className="space-y-6">
          <OPDManagement userRole="doctor" />
        </TabsContent>
        
        <TabsContent value="tracker" className="space-y-6">
          <PatientTracker userRole="doctor" showAllPatients={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}