import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InventoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock: z.coerce.boolean().optional(),
  out_of_stock: z.coerce.boolean().optional(),
  sort: z.enum(['name', 'category', 'stock_quantity', 'unit_price', 'updated_at']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc')
})

const StockUpdateSchema = z.object({
  medicine_id: z.string().uuid(),
  quantity_change: z.number(),
  reason: z.enum(['purchase', 'dispensed', 'expired', 'damaged', 'adjustment']),
  notes: z.string().optional(),
  batch_number: z.string().optional(),
  expiry_date: z.string().date().optional()
})

const BulkStockUpdateSchema = z.object({
  updates: z.array(StockUpdateSchema).min(1).max(50)
})

/**
 * GET /api/v1/inventory
 * Retrieve medicine inventory with filtering and search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = InventoryQuerySchema.parse(Object.fromEntries(searchParams))
    const { page, limit, search, category, low_stock, out_of_stock, sort, order } = params
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('medicines')
      .select(`
        *,
        stock_transactions(
          id,
          quantity_change,
          reason,
          notes,
          created_at
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,manufacturer.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (low_stock) {
      query = query.or('stock_quantity.lte.minimum_stock,stock_quantity.eq.0')
    }
    
    if (out_of_stock) {
      query = query.eq('stock_quantity', 0)
    }
    
    // Apply sorting and pagination
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)
    
    const { data: medicines, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inventory', details: error.message },
        { status: 500 }
      )
    }
    
    // Process inventory data with stock status
    const processedInventory = medicines?.map(medicine => {
      const stockStatus = medicine.stock_quantity === 0 ? 'out_of_stock' :
                         medicine.stock_quantity <= medicine.minimum_stock ? 'low_stock' : 'in_stock'
      
      const stockValue = medicine.stock_quantity * medicine.unit_price
      
      return {
        ...medicine,
        stock_status: stockStatus,
        stock_value: stockValue,
        recent_transactions: medicine.stock_transactions
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          ?.slice(0, 5) || []
      }
    })
    
    const totalPages = count ? Math.ceil(count / limit) : 0
    
    return NextResponse.json({
      data: processedInventory,
      pagination: {
        current_page: page,
        per_page: limit,
        total: count,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      summary: {
        total_medicines: count || 0,
        low_stock_count: processedInventory?.filter(m => m.stock_status === 'low_stock').length || 0,
        out_of_stock_count: processedInventory?.filter(m => m.stock_status === 'out_of_stock').length || 0,
        total_inventory_value: processedInventory?.reduce((sum, m) => sum + m.stock_value, 0) || 0
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/inventory/stock-update
 * Update stock levels for medicines
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Handle both single and bulk updates
    const isBulk = Array.isArray(body.updates)
    const updates = isBulk ? BulkStockUpdateSchema.parse(body).updates : [StockUpdateSchema.parse(body)]
    
    const results = []
    const errors = []
    
    for (const update of updates) {
      try {
        // Verify medicine exists
        const { data: medicine, error: medicineError } = await supabase
          .from('medicines')
          .select('id, name, stock_quantity, minimum_stock')
          .eq('id', update.medicine_id)
          .single()
        
        if (medicineError?.code === 'PGRST116') {
          errors.push({
            medicine_id: update.medicine_id,
            error: 'Medicine not found'
          })
          continue
        }
        
        if (medicineError) {
          errors.push({
            medicine_id: update.medicine_id,
            error: medicineError.message
          })
          continue
        }
        
        const newStockQuantity = medicine.stock_quantity + update.quantity_change
        
        // Prevent negative stock (except for specific reasons)
        if (newStockQuantity < 0 && !['dispensed', 'damaged', 'expired'].includes(update.reason)) {
          errors.push({
            medicine_id: update.medicine_id,
            error: 'Insufficient stock for this operation',
            current_stock: medicine.stock_quantity,
            requested_change: update.quantity_change
          })
          continue
        }
        
        // Update medicine stock
        const { error: updateError } = await supabase
          .from('medicines')
          .update({
            stock_quantity: Math.max(0, newStockQuantity), // Ensure non-negative stock
            updated_at: new Date().toISOString()
          })
          .eq('id', update.medicine_id)
        
        if (updateError) {
          errors.push({
            medicine_id: update.medicine_id,
            error: updateError.message
          })
          continue
        }
        
        // Record stock transaction
        const { data: transaction, error: transactionError } = await supabase
          .from('stock_transactions')
          .insert([{
            medicine_id: update.medicine_id,
            quantity_change: update.quantity_change,
            previous_quantity: medicine.stock_quantity,
            new_quantity: Math.max(0, newStockQuantity),
            reason: update.reason,
            notes: update.notes,
            batch_number: update.batch_number,
            expiry_date: update.expiry_date,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (transactionError) {
          console.error('Failed to record stock transaction:', transactionError)
          // Don't fail the stock update, just log the error
        }
        
        results.push({
          medicine_id: update.medicine_id,
          medicine_name: medicine.name,
          previous_stock: medicine.stock_quantity,
          quantity_change: update.quantity_change,
          new_stock: Math.max(0, newStockQuantity),
          stock_status: Math.max(0, newStockQuantity) === 0 ? 'out_of_stock' :
                       Math.max(0, newStockQuantity) <= medicine.minimum_stock ? 'low_stock' : 'in_stock',
          transaction_id: transaction?.id
        })
        
        // Trigger low stock webhook if applicable
        if (Math.max(0, newStockQuantity) <= medicine.minimum_stock && Math.max(0, newStockQuantity) > 0) {
          // This would trigger the webhook system
          console.log(`Low stock alert for ${medicine.name}: ${Math.max(0, newStockQuantity)} remaining`)
        }
        
      } catch (itemError) {
        errors.push({
          medicine_id: update.medicine_id,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      message: `Stock update completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        successful_updates: results,
        failed_updates: errors
      }
    }, { 
      status: errors.length === 0 ? 200 : (results.length === 0 ? 400 : 207) // 207 = Multi-Status
    })
    
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid stock update data', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/inventory/alerts
 * Get inventory alerts for low stock and expiring medicines
 */
async function getInventoryAlerts(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get low stock medicines
    const { data: lowStockMedicines, error: lowStockError } = await supabase
      .from('medicines')
      .select('id, name, stock_quantity, minimum_stock, category')
      .or('stock_quantity.eq.0,stock_quantity.lte.minimum_stock')
      .order('stock_quantity', { ascending: true })
    
    if (lowStockError) {
      console.error('Database error:', lowStockError)
      return NextResponse.json(
        { error: 'Failed to fetch inventory alerts', details: lowStockError.message },
        { status: 500 }
      )
    }
    
    // Process alerts
    const outOfStock = lowStockMedicines?.filter(m => m.stock_quantity === 0) || []
    const lowStock = lowStockMedicines?.filter(m => m.stock_quantity > 0 && m.stock_quantity <= m.minimum_stock) || []
    
    return NextResponse.json({
      data: {
        out_of_stock: outOfStock,
        low_stock: lowStock,
        summary: {
          out_of_stock_count: outOfStock.length,
          low_stock_count: lowStock.length,
          total_alerts: outOfStock.length + lowStock.length
        }
      }
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}