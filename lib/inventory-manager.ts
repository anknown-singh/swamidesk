import { createClient } from '@/lib/supabase/client'

interface Medicine {
  id: string
  name: string
  generic_name: string
  manufacturer: string
  category: string
  dosage_form: string
  strength: string
  unit_price: number
  stock_quantity: number
  minimum_stock: number
  expiry_date: string | null
  batch_number: string | null
  is_active: boolean
}

interface StockCheckResult {
  available: boolean
  currentStock: number
  requestedQuantity: number
  message: string
  suggestedAlternatives?: Medicine[]
}

interface StockTransaction {
  medicineId: string
  quantity: number
  type: 'deduction' | 'addition' | 'adjustment'
  reference: string
  notes?: string
}

export class InventoryManager {
  private supabase = createClient()

  /**
   * Check if sufficient stock is available for a medicine
   */
  async checkStock(medicineId: string, requestedQuantity: number): Promise<StockCheckResult> {
    try {
      const { data: medicine, error } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('id', medicineId)
        .eq('is_active', true)
        .single()

      if (error || !medicine) {
        return {
          available: false,
          currentStock: 0,
          requestedQuantity,
          message: 'Medicine not found or inactive'
        }
      }

      const available = medicine.stock_quantity >= requestedQuantity
      let message = ''
      
      if (!available) {
        message = `Insufficient stock. Available: ${medicine.stock_quantity}, Requested: ${requestedQuantity}`
        
        // Find alternatives with same generic name
        const { data: alternatives } = await this.supabase
          .from('medicines')
          .select('*')
          .eq('generic_name', medicine.generic_name)
          .eq('is_active', true)
          .neq('id', medicineId)
          .gte('stock_quantity', requestedQuantity)
          .limit(3)

        return {
          available,
          currentStock: medicine.stock_quantity,
          requestedQuantity,
          message,
          suggestedAlternatives: alternatives || []
        }
      } else {
        message = `Stock available. Current: ${medicine.stock_quantity}`
      }

      return {
        available,
        currentStock: medicine.stock_quantity,
        requestedQuantity,
        message
      }
    } catch (error) {
      console.error('Stock check error:', error)
      return {
        available: false,
        currentStock: 0,
        requestedQuantity,
        message: 'Error checking stock availability'
      }
    }
  }

  /**
   * Check stock for multiple medicines at once
   */
  async checkMultipleStock(items: { medicineId: string; quantity: number }[]): Promise<Record<string, StockCheckResult>> {
    const results: Record<string, StockCheckResult> = {}
    
    for (const item of items) {
      results[item.medicineId] = await this.checkStock(item.medicineId, item.quantity)
    }
    
    return results
  }

  /**
   * Deduct stock when medicines are dispensed
   */
  async deductStock(transactions: StockTransaction[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      for (const transaction of transactions) {
        if (transaction.type !== 'deduction') continue

        // First check current stock
        const stockCheck = await this.checkStock(transaction.medicineId, transaction.quantity)
        
        if (!stockCheck.available) {
          errors.push(`Cannot deduct ${transaction.quantity} units from ${transaction.medicineId}: ${stockCheck.message}`)
          continue
        }

        // Deduct the stock
        const { error } = await this.supabase
          .from('medicines')
          .update({ 
            stock_quantity: stockCheck.currentStock - transaction.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.medicineId)

        if (error) {
          errors.push(`Failed to deduct stock for ${transaction.medicineId}: ${error.message}`)
        }

        // Log the transaction (we could create a stock_movements table for this)
        console.log(`Stock deducted: ${transaction.medicineId} - ${transaction.quantity} units (${transaction.reference})`)
      }

      return { success: errors.length === 0, errors }
    } catch (error) {
      console.error('Stock deduction error:', error)
      return { success: false, errors: ['Failed to process stock deductions'] }
    }
  }

  /**
   * Add stock when new inventory arrives
   */
  async addStock(transactions: StockTransaction[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    try {
      for (const transaction of transactions) {
        if (transaction.type !== 'addition') continue

        // Get current stock
        const { data: medicine, error: fetchError } = await this.supabase
          .from('medicines')
          .select('stock_quantity')
          .eq('id', transaction.medicineId)
          .single()

        if (fetchError || !medicine) {
          errors.push(`Medicine not found: ${transaction.medicineId}`)
          continue
        }

        // Add the stock
        const { error } = await this.supabase
          .from('medicines')
          .update({ 
            stock_quantity: medicine.stock_quantity + transaction.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.medicineId)

        if (error) {
          errors.push(`Failed to add stock for ${transaction.medicineId}: ${error.message}`)
        }

        console.log(`Stock added: ${transaction.medicineId} + ${transaction.quantity} units (${transaction.reference})`)
      }

      return { success: errors.length === 0, errors }
    } catch (error) {
      console.error('Stock addition error:', error)
      return { success: false, errors: ['Failed to process stock additions'] }
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<Medicine[]> {
    try {
      const { data, error } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .or('stock_quantity.eq.0,stock_quantity.lte.minimum_stock')
        .order('stock_quantity', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching low stock alerts:', error)
      return []
    }
  }

  /**
   * Get medicines expiring soon (within 30 days)
   */
  async getExpiringMedicines(): Promise<Medicine[]> {
    try {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data, error } = await this.supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching expiring medicines:', error)
      return []
    }
  }

  /**
   * Search medicines with stock information
   */
  async searchMedicines(searchTerm: string, includeOutOfStock = false): Promise<Medicine[]> {
    try {
      let query = this.supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)

      if (!includeOutOfStock) {
        query = query.gt('stock_quantity', 0)
      }

      const { data, error } = await query
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`)
        .order('name')
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching medicines:', error)
      return []
    }
  }

  /**
   * Calculate total cost for prescription items
   */
  async calculatePrescriptionCost(items: { medicineId: string; quantity: number }[]): Promise<{ totalCost: number; itemCosts: Record<string, number> }> {
    const itemCosts: Record<string, number> = {}
    let totalCost = 0

    try {
      for (const item of items) {
        const { data: medicine, error } = await this.supabase
          .from('medicines')
          .select('unit_price')
          .eq('id', item.medicineId)
          .single()

        if (error || !medicine) {
          itemCosts[item.medicineId] = 0
          continue
        }

        const cost = medicine.unit_price * item.quantity
        itemCosts[item.medicineId] = cost
        totalCost += cost
      }
    } catch (error) {
      console.error('Error calculating prescription cost:', error)
    }

    return { totalCost, itemCosts }
  }
}

// Export a singleton instance
export const inventoryManager = new InventoryManager()