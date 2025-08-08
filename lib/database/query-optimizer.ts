import { createClient } from '@/lib/supabase/client'
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js'

interface QueryConfig {
  useCache?: boolean
  cacheKey?: string
  cacheDuration?: number
  timeout?: number
  retries?: number
  batchSize?: number
}

interface BatchQuery<T = any> {
  name: string
  query: () => Promise<T>
  dependencies?: string[]
}

interface QueryResult<T = any> {
  data: T | null
  error: Error | null
  cached: boolean
  duration: number
}

// Query performance metrics
interface QueryMetrics {
  queryKey: string
  duration: number
  cacheHit: boolean
  resultCount?: number
  timestamp: number
}

class QueryOptimizer {
  private cache = new Map<string, { data: any; expires: number; created: number }>()
  private metrics: QueryMetrics[] = []
  private maxMetricsHistory = 1000
  private defaultCacheDuration = 5 * 60 * 1000 // 5 minutes

  // Optimized query execution with caching
  async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T>> {
    const startTime = performance.now()
    const cacheKey = config.cacheKey || this.generateCacheKey(queryFn.toString())
    
    // Check cache first
    if (config.useCache !== false) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        const duration = performance.now() - startTime
        this.recordMetrics(cacheKey, duration, true, Array.isArray(cached) ? cached.length : 1)
        return {
          data: cached,
          error: null,
          cached: true,
          duration
        }
      }
    }

    try {
      // Execute query with timeout
      const result = await this.executeWithTimeout(
        queryFn,
        config.timeout || 30000 // 30 second default timeout
      )

      const duration = performance.now() - startTime

      if (result.error) {
        this.recordMetrics(cacheKey, duration, false, 0)
        return {
          data: null,
          error: new Error(result.error.message || 'Query failed'),
          cached: false,
          duration
        }
      }

      // Cache successful results
      if (config.useCache !== false && result.data) {
        this.setCache(
          cacheKey,
          result.data,
          config.cacheDuration || this.defaultCacheDuration
        )
      }

      const resultCount = Array.isArray(result.data) ? result.data.length : 1
      this.recordMetrics(cacheKey, duration, false, resultCount)

      return {
        data: result.data,
        error: null,
        cached: false,
        duration
      }
    } catch (error) {
      const duration = performance.now() - startTime
      this.recordMetrics(cacheKey, duration, false, 0)
      
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
        cached: false,
        duration
      }
    }
  }

  // Batch multiple queries for better performance
  async executeBatch<T extends Record<string, any>>(
    queries: BatchQuery<any>[],
    config: QueryConfig = {}
  ): Promise<{ [K in keyof T]: QueryResult }> {
    const results: any = {}
    const dependencyGraph = this.buildDependencyGraph(queries)
    
    // Execute queries in topological order
    for (const level of dependencyGraph) {
      const promises = level.map(async (query) => {
        const result = await this.executeQuery(query.query, {
          ...config,
          cacheKey: `batch_${query.name}`
        })
        return { name: query.name, result }
      })

      const levelResults = await Promise.allSettled(promises)
      
      levelResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
          results[promiseResult.value.name] = promiseResult.value.result
        } else {
          results[`error_${Date.now()}`] = {
            data: null,
            error: promiseResult.reason,
            cached: false,
            duration: 0
          }
        }
      })
    }

    return results
  }

  // Optimized pagination with cursor-based approach
  async executePaginatedQuery<T>(
    baseQuery: any,
    options: {
      pageSize?: number
      cursor?: string
      cursorField?: string
      direction?: 'asc' | 'desc'
      cacheConfig?: QueryConfig
    } = {}
  ): Promise<{
    data: T[]
    nextCursor?: string
    hasMore: boolean
    totalCount?: number
  }> {
    const pageSize = options.pageSize || 20
    const cursorField = options.cursorField || 'id'
    const direction = options.direction || 'desc'

    let query = baseQuery.order(cursorField, { ascending: direction === 'asc' })
    
    // Apply cursor-based filtering
    if (options.cursor) {
      const operator = direction === 'asc' ? 'gt' : 'lt'
      query = query[operator](cursorField, options.cursor)
    }

    // Request one extra item to check if there are more pages
    query = query.limit(pageSize + 1)

    const result = await this.executeQuery(
      async () => await query,
      options.cacheConfig
    )

    if (result.error || !result.data) {
      return {
        data: [],
        hasMore: false
      }
    }

    const items = result.data as T[]
    const hasMore = items.length > pageSize
    
    // Remove the extra item if we have more than pageSize
    if (hasMore) {
      items.pop()
    }

    const nextCursor = hasMore && items.length > 0 
      ? (items[items.length - 1] as any)[cursorField]
      : undefined

    return {
      data: items,
      nextCursor,
      hasMore
    }
  }

  // Optimized search with full-text search and ranking
  async executeSearchQuery<T>(
    table: string,
    searchTerm: string,
    options: {
      searchFields: string[]
      selectFields: string
      filters?: Record<string, any>
      limit?: number
      rankingFunction?: 'simple' | 'english'
      cacheConfig?: QueryConfig
    }
  ): Promise<QueryResult<T[]>> {
    const supabase = createClient()
    const limit = options.limit || 50

    // Build full-text search query
    const searchQuery = searchTerm
      .split(' ')
      .filter(term => term.length > 0)
      .map(term => `${term}:*`)
      .join(' & ')

    const queryFn = async () => {
      let query = supabase
        .from(table)
        .select(options.selectFields)
        .textSearch(options.searchFields.join(', '), searchQuery)
        .limit(limit)

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      return query
    }

    return this.executeQuery(async () => {
      const result = await queryFn()
      return result
    }, options.cacheConfig) as Promise<QueryResult<T[]>>
  }

  // Analytics query optimization with aggregations
  async executeAnalyticsQuery(
    table: string,
    options: {
      metrics: Array<{
        field: string
        function: 'count' | 'sum' | 'avg' | 'min' | 'max'
        alias?: string
      }>
      groupBy?: string[]
      filters?: Record<string, any>
      dateRange?: { from: string; to: string; field: string }
      orderBy?: { field: string; ascending?: boolean }
      limit?: number
      cacheConfig?: QueryConfig
    }
  ): Promise<QueryResult<any[]>> {
    const supabase = createClient()

    const queryFn = async () => {
      // Build aggregation select statement
      const selectParts: string[] = []
      
      if (options.groupBy) {
        selectParts.push(...options.groupBy)
      }

      options.metrics.forEach(metric => {
        const alias = metric.alias || `${metric.function}_${metric.field}`
        selectParts.push(`${metric.field}.${metric.function}().as(${alias})`)
      })

      let query = supabase
        .from(table)
        .select(selectParts.join(', '))

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply date range filter
      if (options.dateRange) {
        query = query
          .gte(options.dateRange.field, options.dateRange.from)
          .lte(options.dateRange.field, options.dateRange.to)
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(
          options.orderBy.field, 
          { ascending: options.orderBy.ascending !== false }
        )
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      return query
    }

    return this.executeQuery(queryFn, options.cacheConfig)
  }

  // Cache management methods
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached || Date.now() > cached.expires) {
      this.cache.delete(key)
      return null
    }
    return cached.data
  }

  private setCache(key: string, data: any, duration: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + duration,
      created: Date.now()
    })
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Performance monitoring
  private recordMetrics(
    queryKey: string,
    duration: number,
    cacheHit: boolean,
    resultCount?: number
  ): void {
    this.metrics.push({
      queryKey,
      duration,
      cacheHit,
      resultCount,
      timestamp: Date.now()
    })

    // Keep metrics history within bounds
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
  }

  getPerformanceMetrics(timeWindow = 3600000): {
    totalQueries: number
    averageDuration: number
    cacheHitRate: number
    slowQueries: QueryMetrics[]
    topQueries: Array<{ query: string; count: number; avgDuration: number }>
  } {
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)

    const totalQueries = recentMetrics.length
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length
    const averageDuration = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
      : 0
    
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0
    
    // Identify slow queries (> 1 second)
    const slowQueries = recentMetrics
      .filter(m => m.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    // Group and rank queries
    const queryGroups = new Map<string, { count: number; totalDuration: number }>()
    recentMetrics.forEach(m => {
      const existing = queryGroups.get(m.queryKey) || { count: 0, totalDuration: 0 }
      queryGroups.set(m.queryKey, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + m.duration
      })
    })

    const topQueries = Array.from(queryGroups.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalQueries,
      averageDuration,
      cacheHitRate,
      slowQueries,
      topQueries
    }
  }

  // Utility methods
  private generateCacheKey(queryString: string): string {
    // Simple hash function for cache keys
    let hash = 0
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `query_${Math.abs(hash)}`
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ])
  }

  private buildDependencyGraph(queries: BatchQuery[]): BatchQuery[][] {
    // Simple topological sort implementation
    const graph = new Map<string, BatchQuery>()
    const inDegree = new Map<string, number>()
    
    // Initialize graph
    queries.forEach(query => {
      graph.set(query.name, query)
      inDegree.set(query.name, query.dependencies?.length || 0)
    })

    const result: BatchQuery[][] = []
    const remaining = new Set(queries.map(q => q.name))

    while (remaining.size > 0) {
      const currentLevel = Array.from(remaining).filter(name => 
        inDegree.get(name) === 0
      )

      if (currentLevel.length === 0) {
        // Circular dependency detected, add all remaining queries
        result.push(Array.from(remaining).map(name => graph.get(name)!))
        break
      }

      result.push(currentLevel.map(name => graph.get(name)!))
      
      currentLevel.forEach(name => {
        remaining.delete(name)
        // Update in-degrees for dependent queries
        queries.forEach(query => {
          if (query.dependencies?.includes(name)) {
            inDegree.set(query.name, (inDegree.get(query.name) || 0) - 1)
          }
        })
      })
    }

    return result
  }
}

// Global instance
export const queryOptimizer = new QueryOptimizer()

// Convenience hooks for React components
import { useState, useEffect, DependencyList } from 'react'

export function useOptimizedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  config: QueryConfig = {},
  dependencies: DependencyList = []
) {
  const [result, setResult] = useState<QueryResult<T>>({
    data: null,
    error: null,
    cached: false,
    duration: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    queryOptimizer.executeQuery(queryFn, config)
      .then(setResult)
      .finally(() => setLoading(false))
  }, dependencies)

  return { ...result, loading }
}

export type { QueryConfig, BatchQuery, QueryResult, QueryMetrics }