'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pill, Clock } from 'lucide-react'

export default function PharmacyPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Queue</h1>
          <p className="text-muted-foreground">Manage pharmacy queue and medicine dispensing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmacy Queue Module
          </CardTitle>
          <CardDescription>
            This module is under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                The Pharmacy Queue module will help pharmacists manage prescription queues and medicine dispensing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}