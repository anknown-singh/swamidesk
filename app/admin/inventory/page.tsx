'use client'

import { InventoryManagement } from '@/components/inventory/inventory-management'

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Manage medical supplies and medicine inventory with real-time tracking</p>
        </div>
      </div>

      <InventoryManagement />
    </div>
  )
}