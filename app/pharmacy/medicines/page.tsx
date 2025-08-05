'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Clock } from 'lucide-react'

export default function PharmacyMedicinesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicine Master</h1>
          <p className="text-muted-foreground">Manage medicine database and catalog</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Medicine Master Database
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
                Maintain comprehensive medicine database with specifications, pricing, and supplier information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}