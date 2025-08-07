'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OPDManagement } from '@/components/opd/opd-management'
import { AdminReviewDashboard } from '@/components/opd/admin-review-dashboard'

export default function AdminOPDPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">OPD Overview</TabsTrigger>
          <TabsTrigger value="review">Pricing Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <OPDManagement userRole="admin" />
        </TabsContent>
        
        <TabsContent value="review" className="space-y-6">
          <AdminReviewDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}