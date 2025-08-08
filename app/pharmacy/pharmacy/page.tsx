'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientTracker } from '@/components/workflow/patient-tracker'
import { MedicineDispensing } from '@/components/pharmacy/medicine-dispensing'
import { 
  ClockIcon, 
  PackageIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  PillIcon
} from 'lucide-react'

export default function PharmacyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Management</h1>
          <p className="text-muted-foreground">
            Dispense medications and manage prescription workflow with inventory tracking
          </p>
        </div>
      </div>

      <Tabs defaultValue="dispensing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dispensing">Medicine Dispensing</TabsTrigger>
          <TabsTrigger value="tracker">Patient Tracker</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dispensing" className="space-y-6">
          <MedicineDispensing />
        </TabsContent>
        
        <TabsContent value="tracker" className="space-y-6">
          <PatientTracker 
            userRole="pharmacist"
            showAllPatients={false}
            department="pharmacy"
          />
        </TabsContent>
        
        <TabsContent value="workflow" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
                <ClockIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-xs text-muted-foreground">awaiting dispensing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <PackageIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-xs text-muted-foreground">currently preparing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dispensed Today</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-xs text-muted-foreground">prescriptions completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">0</div>
                <p className="text-xs text-muted-foreground">low stock items</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Workflow Instructions</CardTitle>
              <CardDescription>
                How to manage prescription dispensing in the patient workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">Step 1: Review Prescriptions</h4>
                  <p className="text-sm text-blue-700">
                    Check Patient Tracker for patients requiring medicines. Review doctor&apos;s prescription notes and dosage instructions.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-900">Step 2: Prepare Medications</h4>
                  <p className="text-sm text-orange-700">
                    Prepare medications according to prescription. Check for drug interactions and allergies. Label properly with patient name and instructions.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900">Step 3: Patient Counseling</h4>
                  <p className="text-sm text-green-700">
                    Provide medication counseling to patient. Explain dosage, timing, side effects, and storage instructions.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-900">Step 4: Complete & Route</h4>
                  <p className="text-sm text-purple-700">
                    Mark prescription as dispensed. Patient will automatically route to billing for final payment.
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-900">Inventory Management</h4>
                  <p className="text-sm text-red-700">
                    Monitor stock levels during dispensing. Set up reorder alerts for medications approaching low stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Flow Sources</CardTitle>
              <CardDescription>
                Patients arrive at pharmacy from different workflow stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                  <PillIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">Direct from Consultation</div>
                    <div className="text-sm text-blue-700">Patients who only need medicines (no procedures)</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                  <PillIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Post-Procedure Medications</div>
                    <div className="text-sm text-green-700">Patients who completed procedures and need follow-up medicines</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
                  <PillIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-900">Pre-Procedure Medications</div>
                    <div className="text-sm text-purple-700">Patients who need medicines before scheduled procedures</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}