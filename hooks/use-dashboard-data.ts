'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalPatients: number
  todayRevenue: number
  yesterdayRevenue: number
  activeStaff: {
    total: number
    doctors: number
    others: number
  }
  monthlyGrowth: number
}

interface DepartmentStats {
  department: string
  patientCount: number
  revenue: number
  growth: number
}

interface RecentActivity {
  id: string
  activity: string
  type: string
  created_at: string
  user_name?: string
  amount?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

// Cache duration in milliseconds
const CACHE_DURATIONS = {
  stats: 5 * 60 * 1000,        // 5 minutes for main stats
  departments: 10 * 60 * 1000,  // 10 minutes for departments
  activities: 2 * 60 * 1000,    // 2 minutes for activities
}

// In-memory cache
const cache = new Map<string, CacheEntry<any>>()

function getCacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return `${prefix}:${paramStr}`
}

function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

function setCachedData<T>(key: string, data: T, duration: number): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expires: Date.now() + duration
  }
  cache.set(key, entry)
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = useCallback(async (useCache = true) => {
    const cacheKey = getCacheKey('dashboard_stats')
    
    if (useCache) {
      const cached = getCachedData<DashboardStats>(cacheKey)
      if (cached) {
        setStats(cached)
        setLoading(false)
        return cached
      }
    }

    try {
      setLoading(true)
      setError(null)

      // Optimize queries with proper indexing and parallel execution
      const [
        patientsResult,
        todayRevenueResult,
        yesterdayRevenueResult,
        staffResult,
        lastMonthPatientsResult
      ] = await Promise.all([
        // Use count query for better performance
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        
        // Optimized revenue query with proper date filtering
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')
          .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z'),
        
        // Yesterday's revenue
        supabase
          .from('invoices')
          .select('total_amount')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z')
          .lt('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'),
        
        // Staff count by role - optimized query
        supabase
          .from('users')
          .select('role', { count: 'exact' })
          .eq('is_active', true),
        
        // Growth calculation - optimized with specific date range
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ])

      // Process results efficiently
      const totalPatients = patientsResult.count || 0
      const todayRevenue = todayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      const yesterdayRevenue = yesterdayRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      
      // Process staff data from count query
      const staffCount = staffResult.count || 0
      const doctorCount = staffResult.data?.filter(s => s.role === 'doctor').length || 0
      
      // Growth calculation
      const lastMonthPatients = lastMonthPatientsResult.count || 0
      const monthlyGrowth = lastMonthPatients > 0 
        ? Math.round(((totalPatients - lastMonthPatients) / lastMonthPatients) * 100)
        : 0

      const dashboardStats: DashboardStats = {
        totalPatients,
        todayRevenue,
        yesterdayRevenue,
        activeStaff: {
          total: staffCount,
          doctors: doctorCount,
          others: staffCount - doctorCount
        },
        monthlyGrowth
      }

      // Cache the results
      setCachedData(cacheKey, dashboardStats, CACHE_DURATIONS.stats)
      
      setStats(dashboardStats)
      return dashboardStats

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard statistics'
      console.error('Error fetching dashboard stats:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refresh = useCallback(() => {
    return fetchStats(false) // Force refresh without cache
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refresh }
}

export function useDepartmentStats() {
  const [departments, setDepartments] = useState<DepartmentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDepartments = useCallback(async (useCache = true) => {
    const cacheKey = getCacheKey('department_stats')
    
    if (useCache) {
      const cached = getCachedData<DepartmentStats[]>(cacheKey)
      if (cached) {
        setDepartments(cached)
        setLoading(false)
        return cached
      }
    }

    try {
      setLoading(true)
      setError(null)

      // Optimized department query
      const today = new Date().toISOString().split('T')[0]
      const { data: departmentData, error: deptError } = await supabase
        .from('opd_records')
        .select(`
          department,
          invoices!inner(total_amount)
        `)
        .gte('visit_date', today + 'T00:00:00.000Z')
        .lt('visit_date', today + 'T23:59:59.999Z')

      if (deptError) throw deptError

      // Process department data efficiently
      const deptMap = new Map<string, { patients: number, revenue: number }>()
      
      departmentData?.forEach(record => {
        const dept = record.department || 'General'
        const current = deptMap.get(dept) || { patients: 0, revenue: 0 }
        deptMap.set(dept, {
          patients: current.patients + 1,
          revenue: current.revenue + (record.invoices ? (Array.isArray(record.invoices) ? (record.invoices[0] as any)?.total_amount || 0 : (record.invoices as any)?.total_amount || 0) : 0)
        })
      })

      const departmentStats: DepartmentStats[] = Array.from(deptMap.entries()).map(([dept, data]) => ({
        department: dept,
        patientCount: data.patients,
        revenue: data.revenue,
        growth: Math.floor(Math.random() * 20) - 5 // Placeholder - would be calculated from historical data
      })).slice(0, 5) // Top 5 departments

      // Cache the results
      setCachedData(cacheKey, departmentStats, CACHE_DURATIONS.departments)
      
      setDepartments(departmentStats)
      return departmentStats

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load department statistics'
      console.error('Error fetching department stats:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refresh = useCallback(() => {
    return fetchDepartments(false)
  }, [fetchDepartments])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  return { departments, loading, error, refresh }
}

export function useRecentActivities(limit = 5) {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchActivities = useCallback(async (useCache = true) => {
    const cacheKey = getCacheKey('recent_activities', { limit })
    
    if (useCache) {
      const cached = getCachedData<RecentActivity[]>(cacheKey)
      if (cached) {
        setActivities(cached)
        setLoading(false)
        return cached
      }
    }

    try {
      setLoading(true)
      setError(null)

      // Optimized activities query
      const { data: invoiceActivities, error: invError } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          created_at,
          patients!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (invError) throw invError

      // Process activities efficiently
      const recentActivities: RecentActivity[] = invoiceActivities?.map(invoice => ({
        id: invoice.id,
        activity: `Invoice generated for ${Array.isArray(invoice.patients) ? invoice.patients[0]?.full_name || 'Patient' : invoice.patients?.full_name || 'Patient'} - ₹${invoice.total_amount?.toLocaleString() || '0'}`,
        type: 'billing',
        created_at: invoice.created_at,
        amount: invoice.total_amount
      })) || []

      // Cache the results
      setCachedData(cacheKey, recentActivities, CACHE_DURATIONS.activities)
      
      setActivities(recentActivities)
      return recentActivities

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent activities'
      console.error('Error fetching recent activities:', err)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [supabase, limit])

  const refresh = useCallback(() => {
    return fetchActivities(false)
  }, [fetchActivities])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return { activities, loading, error, refresh }
}

// Utility hook for cache management
export function useCacheManagement() {
  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      // Clear specific cache entries
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      }
    } else {
      // Clear all cache
      cache.clear()
    }
  }, [])

  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.entries())
    const now = Date.now()
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([, entry]) => now < entry.expires).length,
      expiredEntries: entries.filter(([, entry]) => now >= entry.expires).length,
      cacheSize: JSON.stringify(Object.fromEntries(cache)).length
    }
  }, [])

  const cleanExpiredCache = useCallback(() => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now >= entry.expires) {
        cache.delete(key)
      }
    }
  }, [])

  // Auto-cleanup expired entries
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000) // Clean every minute
    return () => clearInterval(interval)
  }, [cleanExpiredCache])

  return {
    clearCache,
    getCacheStats,
    cleanExpiredCache
  }
}