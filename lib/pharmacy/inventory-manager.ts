'use client'

import { createClient } from '@/lib/supabase/client'

export interface InventoryTransaction {
  id: string
  medicine_id: string
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return'
  quantity: number
  unit_price: number
  batch_number?: string
  expiry_date?: string
  reference_id?: string // order_id for purchases/sales
  notes?: string
  created_at: string
  medicine: {
    name: string
    category: string
    stock_quantity: number
  }
}

export interface StockAlert {
  id: string
  medicine_id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
  current_stock: number
  minimum_stock: number
  expiry_date?: string
  created_at: string
  medicine: {
    name: string
    category: string
    manufacturer?: string
  }
}

export class InventoryManager {
  private supabase = createClient()

  // Update stock when purchase order is received
  async processPurchaseOrder(orderId: string, items: Array<{
    medicine_name: string
    quantity: number
    unit_price: number
    batch_number?: string
    expiry_date?: string
    company_name?: string
    supplier_name?: string
  }>) {
    try {
      console.log(`Processing purchase order ${orderId} for inventory update`)
      
      for (const item of items) {
        // Find or create medicine in inventory
        const medicine = await this.findOrCreateMedicine(item)
        
        if (medicine) {
          // Update stock quantity
          const newStock = medicine.stock_quantity + item.quantity
          
          // Prepare update object with latest information
          const updateData: any = {
            stock_quantity: newStock,
            unit_price: item.unit_price, // Update with latest purchase price
            updated_at: new Date().toISOString()
          }

          // Update supplier info if provided
          if (item.supplier_name) {
            updateData.supplier = item.supplier_name
          }

          // Update batch/expiry if this is newer information
          if (item.batch_number) {
            updateData.batch_number = item.batch_number
          }
          if (item.expiry_date) {
            updateData.expiry_date = item.expiry_date
          }
          
          await this.supabase
            .from('medicines')
            .update(updateData)
            .eq('id', medicine.id)

          // Create inventory transaction record
          await this.createInventoryTransaction({
            medicine_id: medicine.id,
            transaction_type: 'purchase',
            quantity: item.quantity,
            unit_price: item.unit_price,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            reference_id: orderId,
            notes: `Purchase order received: ${item.medicine_name}`
          })

          console.log(`✅ Updated stock for ${item.medicine_name}: +${item.quantity} = ${newStock}`)
        }
      }

      return { success: true, message: 'Purchase order processed successfully' }
    } catch (error) {
      console.error('Error processing purchase order:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Update stock when sell order is completed
  async processSellOrder(orderId: string, items: Array<{
    medicine_name: string
    quantity: number
    unit_price: number
    batch_number?: string
  }>) {
    try {
      console.log(`Processing sell order ${orderId} for inventory update`)
      
      for (const item of items) {
        // Find medicine in inventory
        const { data: medicines } = await this.supabase
          .from('medicines')
          .select('*')
          .ilike('name', `%${item.medicine_name}%`)
          .limit(1)

        if (medicines && medicines.length > 0) {
          const medicine = medicines[0]
          
          // Check if sufficient stock available
          if (medicine.stock_quantity < item.quantity) {
            console.warn(`⚠️ Insufficient stock for ${item.medicine_name}: ${medicine.stock_quantity} < ${item.quantity}`)
            continue
          }

          // Update stock quantity
          const newStock = Math.max(0, medicine.stock_quantity - item.quantity)
          
          await this.supabase
            .from('medicines')
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', medicine.id)

          // Create inventory transaction record
          const transactionData: Parameters<typeof this.createInventoryTransaction>[0] = {
            medicine_id: medicine.id,
            transaction_type: 'sale',
            quantity: -item.quantity, // Negative for outgoing
            unit_price: item.unit_price,
            reference_id: orderId,
            notes: `Sell order dispatched: ${item.medicine_name}`
          }
          if (item.batch_number) {
            transactionData.batch_number = item.batch_number
          }
          await this.createInventoryTransaction(transactionData)

          console.log(`✅ Updated stock for ${item.medicine_name}: -${item.quantity} = ${newStock}`)
          
          // Check for low stock alert
          if (newStock <= medicine.minimum_stock) {
            await this.createStockAlert(medicine.id, 'low_stock', newStock, medicine.minimum_stock)
          }
          if (newStock === 0) {
            await this.createStockAlert(medicine.id, 'out_of_stock', newStock, medicine.minimum_stock)
          }
        }
      }

      return { success: true, message: 'Sell order processed successfully' }
    } catch (error) {
      console.error('Error processing sell order:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Find existing medicine or create new one
  private async findOrCreateMedicine(item: {
    medicine_name: string
    unit_price: number
    company_name?: string
    supplier_name?: string
    batch_number?: string
    expiry_date?: string
  }) {
    try {
      // First try to find existing medicine
      const { data: existing } = await this.supabase
        .from('medicines')
        .select('*')
        .ilike('name', `%${item.medicine_name}%`)
        .limit(1)

      if (existing && existing.length > 0) {
        return existing[0]
      }

      // Create new medicine if not found
      const { data: newMedicine, error } = await this.supabase
        .from('medicines')
        .insert([{
          name: item.medicine_name,
          manufacturer: item.company_name || 'Unknown',
          supplier: item.supplier_name || 'Unknown',
          category: 'General',
          dosage_form: 'Unknown',
          unit_price: item.unit_price,
          stock_quantity: 0,
          minimum_stock: 10,
          batch_number: item.batch_number || null,
          expiry_date: item.expiry_date || null,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating medicine:', error)
        return null
      }

      console.log(`🆕 Created new medicine: ${item.medicine_name}`)
      return newMedicine
    } catch (error) {
      console.error('Error finding/creating medicine:', error)
      return null
    }
  }

  // Create inventory transaction record
  private async createInventoryTransaction(transaction: {
    medicine_id: string
    transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return'
    quantity: number
    unit_price: number
    batch_number?: string
    expiry_date?: string
    reference_id?: string
    notes?: string
  }) {
    try {
      // For now, we'll just log transactions since we don't have a transactions table
      // In a real implementation, this would insert into an inventory_transactions table
      console.log(`📊 Inventory Transaction:`, {
        medicine_id: transaction.medicine_id,
        type: transaction.transaction_type,
        quantity: transaction.quantity,
        unit_price: transaction.unit_price,
        reference: transaction.reference_id,
        notes: transaction.notes,
        timestamp: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('Error creating inventory transaction:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Create stock alert
  private async createStockAlert(medicineId: string, alertType: 'low_stock' | 'out_of_stock', currentStock: number, minimumStock: number) {
    try {
      console.log(`🚨 Stock Alert: ${alertType} for medicine ${medicineId} - Current: ${currentStock}, Minimum: ${minimumStock}`)
      
      // In a real implementation, this would create alerts in a stock_alerts table
      // For now, we'll just log the alert
      return { success: true }
    } catch (error) {
      console.error('Error creating stock alert:', error)
      return { success: false }
    }
  }

  // Get current inventory status
  async getInventoryStatus() {
    try {
      const { data: medicines, error } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      const totalItems = medicines?.length || 0
      const lowStockItems = medicines?.filter(m => m.stock_quantity <= m.minimum_stock).length || 0
      const outOfStockItems = medicines?.filter(m => m.stock_quantity === 0).length || 0
      const totalValue = medicines?.reduce((sum, m) => sum + (m.stock_quantity * m.unit_price), 0) || 0

      return {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue,
        medicines: medicines || []
      }
    } catch (error) {
      console.error('Error getting inventory status:', error)
      return {
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        medicines: []
      }
    }
  }

  // Get low stock medicines
  async getLowStockMedicines(limit: number = 10) {
    try {
      const { data: medicines, error } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true })

      if (error) throw error

      // Filter low stock medicines in JavaScript since SQL comparison with column values requires different syntax
      const lowStockMedicines = medicines?.filter(medicine => 
        medicine.stock_quantity <= medicine.minimum_stock
      ).slice(0, limit) || []

      return lowStockMedicines.map(medicine => ({
        id: medicine.id,
        name: medicine.name,
        category: medicine.category,
        currentStock: medicine.stock_quantity,
        minimumStock: medicine.minimum_stock,
        isCritical: medicine.stock_quantity === 0,
        manufacturer: medicine.manufacturer
      }))
    } catch (error) {
      console.error('Error getting low stock medicines:', error)
      return []
    }
  }

  // Adjust stock manually
  async adjustStock(medicineId: string, newQuantity: number, reason: string) {
    try {
      const { data: medicine, error: fetchError } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('id', medicineId)
        .single()

      if (fetchError) throw fetchError

      const oldQuantity = medicine.stock_quantity
      const adjustment = newQuantity - oldQuantity

      await this.supabase
        .from('medicines')
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', medicineId)

      // Log the adjustment
      await this.createInventoryTransaction({
        medicine_id: medicineId,
        transaction_type: 'adjustment',
        quantity: adjustment,
        unit_price: medicine.unit_price,
        notes: `Manual adjustment: ${reason}`
      })

      console.log(`✅ Stock adjusted for ${medicine.name}: ${oldQuantity} → ${newQuantity} (${adjustment >= 0 ? '+' : ''}${adjustment})`)

      return { success: true, message: 'Stock adjusted successfully' }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Export singleton instance
export const inventoryManager = new InventoryManager()