'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  searchEngine, 
  type SearchResult, 
  type SearchSuggestion, 
  type SearchFilters,
  type SearchConfig 
} from '@/lib/search/search-engine'

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  autoSearch?: boolean
  cacheResults?: boolean
  defaultFilters?: SearchFilters
  defaultConfig?: SearchConfig
}

interface UseSearchReturn {
  // State
  query: string
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  facets: Record<string, Array<{ value: string; count: number }>>
  total: number
  loading: boolean
  error: string | null
  
  // Actions
  setQuery: (query: string) => void
  search: (query?: string, filters?: SearchFilters, config?: SearchConfig) => Promise<void>
  clearResults: () => void
  selectResult: (result: SearchResult) => void
  
  // Filters
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  clearFilters: () => void
  
  // Config
  config: SearchConfig
  setConfig: (config: SearchConfig) => void
  
  // History
  searchHistory: string[]
  clearHistory: () => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    autoSearch = true,
    cacheResults = true,
    defaultFilters = {},
    defaultConfig = {
      limit: 20,
      offset: 0,
      fuzzySearch: true,
      sortBy: 'relevance'
    }
  } = options

  // State
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [facets, setFacets] = useState<Record<string, Array<{ value: string; count: number }>>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [config, setConfig] = useState<SearchConfig>(defaultConfig)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>()
  const abortControllerRef = useRef<AbortController | undefined>()
  const resultsCacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map())
  const cacheExpiryMs = 5 * 60 * 1000 // 5 minutes

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory()
    searchEngine.loadSearchHistory()
  }, [])

  const loadSearchHistory = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchHistory')
      if (stored) {
        try {
          setSearchHistory(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse search history:', e)
        }
      }
    }
  }

  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 10)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      }
      
      return newHistory
    })
  }

  const generateCacheKey = (query: string, filters: SearchFilters, config: SearchConfig): string => {
    return `${query}__${JSON.stringify(filters)}__${JSON.stringify(config)}`
  }

  const getCachedResults = (cacheKey: string) => {
    if (!cacheResults) return null
    
    const cached = resultsCacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cacheExpiryMs) {
      return cached.results
    }
    
    return null
  }

  const setCachedResults = (cacheKey: string, results: SearchResult[]) => {
    if (!cacheResults) return
    
    resultsCacheRef.current.set(cacheKey, {
      results,
      timestamp: Date.now()
    })
  }

  const search = useCallback(async (
    searchQuery: string = query,
    searchFilters: SearchFilters = filters,
    searchConfig: SearchConfig = config
  ) => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      setResults([])
      setSuggestions([])
      setFacets({})
      setTotal(0)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cacheKey = generateCacheKey(searchQuery, searchFilters, searchConfig)
      const cachedResults = getCachedResults(cacheKey)
      
      if (cachedResults) {
        setResults(cachedResults)
        setTotal(cachedResults.length)
        setLoading(false)
        return
      }

      // Perform search
      const searchResult = await searchEngine.search(searchQuery, searchFilters, searchConfig)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      // Update state
      setResults(searchResult.results)
      setSuggestions(searchResult.suggestions)
      setFacets(searchResult.facets)
      setTotal(searchResult.total)
      setError(null)

      // Cache results
      setCachedResults(cacheKey, searchResult.results)

      // Save to history if it's a real search query
      if (searchQuery.trim().length >= minQueryLength) {
        saveToHistory(searchQuery.trim())
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return // Request was cancelled, ignore
      }

      console.error('Search error:', err)
      setError(err.message || 'Search failed')
      setResults([])
      setSuggestions([])
      setFacets({})
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query, filters, config, cacheResults, minQueryLength])

  const debouncedSearch = useCallback((
    searchQuery: string,
    searchFilters: SearchFilters = filters,
    searchConfig: SearchConfig = config
  ) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (searchQuery.length >= minQueryLength || Object.keys(searchFilters).length > 0) {
        search(searchQuery, searchFilters, searchConfig)
      } else {
        setResults([])
        setSuggestions([])
        setFacets({})
        setTotal(0)
      }
    }, debounceMs)
  }, [search, filters, config, debounceMs, minQueryLength])

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
    
    if (autoSearch) {
      debouncedSearch(newQuery)
    }
  }, [autoSearch, debouncedSearch])

  const clearResults = useCallback(() => {
    setResults([])
    setSuggestions([])
    setFacets({})
    setTotal(0)
    setError(null)
    setQueryState('')
  }, [])

  const selectResult = useCallback((result: SearchResult) => {
    // Track result selection for analytics
    console.log('Result selected:', result)
    
    // Navigate to result URL if available
    if (result.url) {
      window.location.href = result.url
    }
  }, [])

  const setFiltersAndSearch = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
    
    if (autoSearch && (query.length >= minQueryLength || Object.keys(newFilters).length > 0)) {
      debouncedSearch(query, newFilters, config)
    }
  }, [autoSearch, query, config, debouncedSearch, minQueryLength])

  const clearFilters = useCallback(() => {
    setFilters({})
    
    if (autoSearch && query.length >= minQueryLength) {
      debouncedSearch(query, {}, config)
    }
  }, [autoSearch, query, config, debouncedSearch, minQueryLength])

  const setConfigAndSearch = useCallback((newConfig: SearchConfig) => {
    setConfig(newConfig)
    
    if (autoSearch && (query.length >= minQueryLength || Object.keys(filters).length > 0)) {
      debouncedSearch(query, filters, newConfig)
    }
  }, [autoSearch, query, filters, debouncedSearch, minQueryLength])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    query,
    results,
    suggestions,
    facets,
    total,
    loading,
    error,
    
    // Actions
    setQuery,
    search,
    clearResults,
    selectResult,
    
    // Filters
    filters,
    setFilters: setFiltersAndSearch,
    clearFilters,
    
    // Config
    config,
    setConfig: setConfigAndSearch,
    
    // History
    searchHistory,
    clearHistory
  }
}

// Specialized hooks for common use cases

export function usePatientSearch(options: UseSearchOptions = {}) {
  return useSearch({
    ...options,
    defaultFilters: { type: ['patient'] }
  })
}

export function useAppointmentSearch(options: UseSearchOptions = {}) {
  return useSearch({
    ...options,
    defaultFilters: { type: ['appointment'] }
  })
}

export function useMedicineSearch(options: UseSearchOptions = {}) {
  return useSearch({
    ...options,
    defaultFilters: { type: ['medicine'] }
  })
}

export function useInvoiceSearch(options: UseSearchOptions = {}) {
  return useSearch({
    ...options,
    defaultFilters: { type: ['invoice'] }
  })
}

// Quick search hook for header/navbar
export function useQuickSearch() {
  return useSearch({
    debounceMs: 200,
    minQueryLength: 1,
    autoSearch: true,
    cacheResults: true,
    defaultConfig: {
      limit: 8, // Fewer results for quick search
      fuzzySearch: true,
      sortBy: 'relevance'
    }
  })
}