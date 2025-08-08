import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AnalyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  group_by: z.enum(['day', 'week', 'month']).optional(),
  metrics: z.string().optional() // comma-separated list of metrics
})

/**
 * GET /api/v1/analytics
 * Retrieve comprehensive analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const params = AnalyticsQuerySchema.parse(Object.fromEntries(searchParams))
    const { period, start_date, end_date, group_by, metrics } = params
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    const endDate = end_date ? new Date(end_date) : now
    
    if (start_date) {
      startDate = new Date(start_date)
    } else {
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          startDate = new Date(now.getFullYear(), quarterStart, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
    
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()
    
    // Determine which metrics to fetch
    const requestedMetrics = metrics ? metrics.split(',').map(m => m.trim()) : ['all']
    const fetchAllMetrics = requestedMetrics.includes('all') || requestedMetrics.length === 0
    
    const analyticsData: any = {}
    
    // Patient Analytics
    if (fetchAllMetrics || requestedMetrics.includes('patients')) {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('patient_id, created_at, is_active')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
      
      if (!patientError && patientData) {
        analyticsData.patients = {
          total_registrations: patientData.length,
          active_patients: patientData.filter(p => p.is_active).length,
          registration_trend: groupByPeriod(patientData, 'created_at', group_by || 'day')
        }
      }
    }
    
    // Appointment Analytics
    if (fetchAllMetrics || requestedMetrics.includes('appointments')) {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, appointment_type, created_at')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
      
      if (!appointmentError && appointmentData) {
        const statusCounts = countByField(appointmentData, 'status')
        const typeCounts = countByField(appointmentData, 'appointment_type')
        
        analyticsData.appointments = {
          total_appointments: appointmentData.length,
          by_status: statusCounts,
          by_type: typeCounts,
          appointment_trend: groupByPeriod(appointmentData, 'appointment_date', group_by || 'day'),
          completion_rate: (statusCounts.completed || 0) / appointmentData.length * 100 || 0
        }
      }
    }
    
    // Revenue Analytics
    if (fetchAllMetrics || requestedMetrics.includes('revenue')) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, total_amount, paid_amount, payment_status, invoice_date, created_at')
        .gte('invoice_date', startDateStr)
        .lte('invoice_date', endDateStr)
      
      if (!invoiceError && invoiceData) {
        const totalRevenue = invoiceData.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0)
        const totalBilled = invoiceData.reduce((sum, inv) => sum + inv.total_amount, 0)
        const outstandingAmount = totalBilled - totalRevenue
        
        analyticsData.revenue = {
          total_revenue: totalRevenue,
          total_billed: totalBilled,
          outstanding_amount: outstandingAmount,
          collection_rate: totalBilled > 0 ? (totalRevenue / totalBilled * 100) : 0,
          payment_status_distribution: countByField(invoiceData, 'payment_status'),
          revenue_trend: groupByPeriod(invoiceData.map(inv => ({
            ...inv,
            amount: inv.paid_amount || 0
          })), 'invoice_date', group_by || 'day', 'amount')
        }
      }
    }
    
    // Prescription Analytics
    if (fetchAllMetrics || requestedMetrics.includes('prescriptions')) {
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select(`
          id,
          total_amount,
          status,
          prescription_date,
          prescription_items(quantity_prescribed, quantity_dispensed)
        `)
        .gte('prescription_date', startDateStr)
        .lte('prescription_date', endDateStr)
      
      if (!prescriptionError && prescriptionData) {
        const totalPrescriptions = prescriptionData.length
        const totalItems = prescriptionData.reduce((sum, p) => 
          sum + (p.prescription_items?.length || 0), 0
        )
        const totalDispensed = prescriptionData.reduce((sum, p) => 
          sum + (p.prescription_items?.reduce((itemSum: number, item: any) => 
            itemSum + (item.quantity_dispensed || 0), 0) || 0), 0
        )
        
        analyticsData.prescriptions = {
          total_prescriptions: totalPrescriptions,
          total_items_prescribed: totalItems,
          total_items_dispensed: totalDispensed,
          dispensing_rate: totalItems > 0 ? (totalDispensed / totalItems * 100) : 0,
          status_distribution: countByField(prescriptionData, 'status'),
          prescription_trend: groupByPeriod(prescriptionData, 'prescription_date', group_by || 'day')
        }
      }
    }
    
    // Inventory Analytics
    if (fetchAllMetrics || requestedMetrics.includes('inventory')) {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('medicines')
        .select('id, name, category, stock_quantity, minimum_stock, unit_price')
      
      if (!inventoryError && inventoryData) {
        const totalMedicines = inventoryData.length
        const lowStockCount = inventoryData.filter(m => m.stock_quantity <= m.minimum_stock).length
        const outOfStockCount = inventoryData.filter(m => m.stock_quantity === 0).length
        const totalInventoryValue = inventoryData.reduce((sum, m) => 
          sum + (m.stock_quantity * m.unit_price), 0
        )
        
        const categoryStats = inventoryData.reduce((acc: any, medicine) => {
          if (!acc[medicine.category]) {
            acc[medicine.category] = {
              count: 0,
              total_value: 0,
              low_stock_count: 0
            }
          }
          acc[medicine.category].count++
          acc[medicine.category].total_value += medicine.stock_quantity * medicine.unit_price
          if (medicine.stock_quantity <= medicine.minimum_stock) {
            acc[medicine.category].low_stock_count++
          }
          return acc
        }, {})
        
        analyticsData.inventory = {
          total_medicines: totalMedicines,
          low_stock_count: lowStockCount,
          out_of_stock_count: outOfStockCount,
          stock_status_percentage: {
            in_stock: ((totalMedicines - lowStockCount) / totalMedicines * 100) || 0,
            low_stock: (lowStockCount / totalMedicines * 100) || 0,
            out_of_stock: (outOfStockCount / totalMedicines * 100) || 0
          },
          total_inventory_value: totalInventoryValue,
          by_category: categoryStats
        }
      }
    }
    
    // Top Performers
    if (fetchAllMetrics || requestedMetrics.includes('top_performers')) {
      // Top medicines by prescription frequency
      const { data: topMedicines, error: topMedicinesError } = await supabase
        .from('prescription_items')
        .select(`
          medicine_id,
          quantity_prescribed,
          medicines(name, category)
        `)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
      
      if (!topMedicinesError && topMedicines) {
        const medicineFrequency = topMedicines.reduce((acc: any, item: any) => {
          const medicineId = item.medicine_id
          if (!acc[medicineId]) {
            acc[medicineId] = {
              medicine_id: medicineId,
              medicine_name: item.medicines?.name || 'Unknown',
              category: item.medicines?.category || 'Unknown',
              total_prescribed: 0,
              prescription_count: 0
            }
          }
          acc[medicineId].total_prescribed += item.quantity_prescribed
          acc[medicineId].prescription_count++
          return acc
        }, {})
        
        const sortedMedicines = Object.values(medicineFrequency)
          .sort((a: any, b: any) => b.prescription_count - a.prescription_count)
          .slice(0, 10)
        
        analyticsData.top_performers = {
          top_medicines: sortedMedicines
        }
      }
    }
    
    return NextResponse.json({
      data: analyticsData,
      period: {
        start_date: startDateStr,
        end_date: endDateStr,
        period_type: period
      },
      generated_at: new Date().toISOString()
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

// Helper functions
function countByField(data: any[], field: string): Record<string, number> {
  return data.reduce((acc, item) => {
    const value = item[field] || 'unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function groupByPeriod(
  data: any[], 
  dateField: string, 
  groupBy: string = 'day', 
  sumField?: string
): Array<{ date: string; count: number; sum?: number }> {
  const grouped = data.reduce((acc: any, item) => {
    const date = new Date(item[dateField])
    let key: string
    
    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]!
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      default: // day
        key = date.toISOString().split('T')[0]!
    }
    
    if (!acc[key]) {
      acc[key] = { date: key, count: 0, sum: 0 }
    }
    acc[key].count++
    if (sumField && item[sumField]) {
      acc[key].sum += item[sumField]
    }
    return acc
  }, {})
  
  return Object.values(grouped)
    .filter((item): item is { date: string; count: number; sum?: number } => 
      typeof item === 'object' && item !== null && 'date' in item && 'count' in item
    )
    .sort((a, b) => a.date.localeCompare(b.date))
}