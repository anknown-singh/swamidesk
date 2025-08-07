'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientTracker } from '@/components/workflow/patient-tracker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react'

export default function AttendantProceduresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procedure Management</h1>
          <p className="text-muted-foreground">
            Execute approved procedures and manage patient workflow
          </p>
        </div>
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Patient Tracker</TabsTrigger>
          <TabsTrigger value="overview">Procedure Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracker" className="space-y-6">
          <PatientTracker 
            userRole="attendant"
            showAllPatients={false}
            department="procedures"
          />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Procedures</CardTitle>
                <ClockIcon className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-xs text-muted-foreground">awaiting execution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <ActivityIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <p className="text-xs text-muted-foreground">currently executing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0</div>
                <p className="text-xs text-muted-foreground">procedures completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">0</div>
                <p className="text-xs text-muted-foreground">urgent procedures</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Procedure Instructions</CardTitle>
              <CardDescription>
                How to manage patient procedures in the workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">Step 1: View Approved Procedures</h4>
                  <p className="text-sm text-blue-700">
                    Check the Patient Tracker tab to see all procedures approved by admin and scheduled for today.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-900">Step 2: Start Procedure</h4>
                  <p className="text-sm text-orange-700">
                    Click "Start Procedure" to begin execution. Patient status will update to show procedure in progress.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900">Step 3: Complete & Route</h4>
                  <p className="text-sm text-green-700">
                    After procedure completion, mark as finished. Patient will automatically route to pharmacy (if medicines required) or billing.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-900">Priority System</h4>
                  <p className="text-sm text-purple-700">
                    High priority procedures appear first. Urgency level is set by the consulting doctor based on medical necessity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}