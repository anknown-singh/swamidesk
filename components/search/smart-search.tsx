'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Search,
  X,
  Filter,
  Clock,
  TrendingUp,
  User,
  Calendar,
  Pill,
  FileText,
  CreditCard,
  Settings,
  ArrowRight,
  History,
  Sparkles,
  Target,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import {
  searchEngine,
  type SearchResult,
  type SearchSuggestion,
  type SearchFilters,
  type SearchConfig
} from '@/lib/search/search-engine'

interface SmartSearchProps {
  placeholder?: string
  className?: string
  showFilters?: boolean
  defaultFilters?: SearchFilters
  onResultClick?: (result: SearchResult) => void
  onSearch?: (query: string, results: SearchResult[]) => void
  compact?: boolean
  autoFocus?: boolean
}

interface SearchState {
  query: string
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  facets: Record<string, Array<{ value: string; count: number }>>
  total: number
  loading: boolean
  error: string
  showResults: boolean
  showFilters: boolean
  selectedFilters: SearchFilters
  searchConfig: SearchConfig
}

export function SmartSearch({
  placeholder = "Search patients, appointments, medicines...",
  className = "",
  showFilters = true,
  defaultFilters = {},
  onResultClick,
  onSearch,
  compact = false,
  autoFocus = false
}: SmartSearchProps) {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    facets: {},
    total: 0,
    loading: false,
    error: '',
    showResults: false,
    showFilters: false,
    selectedFilters: defaultFilters,
    searchConfig: {
      limit: 20,
      offset: 0,
      fuzzySearch: true,
      sortBy: 'relevance'
    }
  })

  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load search history on mount
    searchEngine.loadSearchHistory()
    loadRecentSearches()

    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocus])

  const loadRecentSearches = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchHistory')
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse recent searches:', e)
        }
      }
    }
  }

  const performSearch = useCallback(async (
    query: string, 
    filters: SearchFilters = searchState.selectedFilters,
    config: SearchConfig = searchState.searchConfig
  ) => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setSearchState(prev => ({ ...prev, results: [], total: 0, showResults: false }))
      return
    }

    setSearchState(prev => ({ ...prev, loading: true, error: '' }))

    try {
      const searchResult = await searchEngine.search(query, filters, config)
      
      setSearchState(prev => ({
        ...prev,
        results: searchResult.results,
        suggestions: searchResult.suggestions,
        facets: searchResult.facets,
        total: searchResult.total,
        loading: false,
        showResults: true
      }))

      onSearch?.(query, searchResult.results)
      
    } catch (error) {
      console.error('Search failed:', error)
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed. Please try again.',
        results: [],
        total: 0
      }))
    }
  }, [searchState.selectedFilters, searchState.searchConfig, onSearch])

  const handleQueryChange = (value: string) => {
    setSearchState(prev => ({ ...prev, query: value }))

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length >= 2) {
        performSearch(value)
      } else {
        setSearchState(prev => ({ ...prev, results: [], suggestions: [], showResults: false }))
      }
    }, 300)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchState(prev => ({ ...prev, query: suggestion.text }))
    performSearch(suggestion.text)
    setIsOpen(false)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result)
    
    // Navigate to result URL
    if (result.url) {
      window.location.href = result.url
    }
    
    setIsOpen(false)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...searchState.selectedFilters }
    
    if (Array.isArray(newFilters[key])) {
      const currentArray = newFilters[key] as string[]
      if (currentArray.includes(value)) {
        newFilters[key] = currentArray.filter(v => v !== value)
      } else {
        newFilters[key] = [...currentArray, value]
      }
    } else {
      newFilters[key] = value
    }

    // Remove empty arrays
    Object.keys(newFilters).forEach(key => {
      if (Array.isArray(newFilters[key]) && (newFilters[key] as string[]).length === 0) {
        delete newFilters[key]
      }
    })

    setSearchState(prev => ({ ...prev, selectedFilters: newFilters }))
    
    // Re-search with new filters
    if (searchState.query.length >= 2) {
      performSearch(searchState.query, newFilters)
    }
  }

  const clearFilters = () => {
    setSearchState(prev => ({ 
      ...prev, 
      selectedFilters: {},
      showFilters: false
    }))
    
    if (searchState.query.length >= 2) {
      performSearch(searchState.query, {})
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'patient':
        return <User className="h-4 w-4 text-blue-500" />
      case 'appointment':
        return <Calendar className="h-4 w-4 text-green-500" />
      case 'medicine':
        return <Pill className="h-4 w-4 text-purple-500" />
      case 'service':
        return <Settings className="h-4 w-4 text-orange-500" />
      case 'invoice':
        return <CreditCard className="h-4 w-4 text-red-500" />
      case 'user':
        return <User className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <History className="h-3 w-3 text-gray-400" />
      case 'popular':
        return <TrendingUp className="h-3 w-3 text-blue-400" />
      case 'suggestion':
        return <Sparkles className="h-3 w-3 text-purple-400" />
      default:
        return <Target className="h-3 w-3 text-gray-400" />
    }
  }

  const getActiveFiltersCount = () => {
    return Object.values(searchState.selectedFilters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + value.length
      }
      return value ? count + 1 : count
    }, 0)
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={searchState.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10"
          />
          
          {searchState.loading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
          )}
          
          {searchState.query && !searchState.loading && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => {
                setSearchState(prev => ({ ...prev, query: '', results: [], showResults: false }))
                setIsOpen(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Compact Results Dropdown */}
        {isOpen && (searchState.suggestions.length > 0 || searchState.results.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden">
            <ScrollArea className="max-h-96">
              <div className="p-2">
                {/* Suggestions */}
                {searchState.suggestions.length > 0 && searchState.query.length < 2 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 mb-2 px-2">Suggestions</p>
                    {searchState.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded"
                      >
                        {getSuggestionIcon(suggestion.type)}
                        <span>{suggestion.text}</span>
                        {suggestion.count && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {suggestion.count}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results */}
                {searchState.results.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2 px-2">
                      Results ({searchState.total})
                    </p>
                    {searchState.results.slice(0, 5).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-start gap-3 p-2 text-sm hover:bg-gray-50 rounded text-left"
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400 mt-0.5" />
                      </button>
                    ))}
                    
                    {searchState.total > 5 && (
                      <div className="p-2 text-center">
                        <Button variant="ghost" size="sm" className="text-xs">
                          View all {searchState.total} results
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {searchState.query.length >= 2 && searchState.results.length === 0 && !searchState.loading && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No results found for "{searchState.query}"
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <span>Smart Search</span>
            </div>
            
            {showFilters && (
              <div className="flex items-center gap-2">
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary">
                    {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''}
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {searchState.showFilters ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder={placeholder}
              value={searchState.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-10 pr-10"
            />
            
            {searchState.loading && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
            )}
            
            {searchState.query && !searchState.loading && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => {
                  setSearchState(prev => ({ ...prev, query: '', results: [], showResults: false }))
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Quick Suggestions */}
          {searchState.suggestions.length > 0 && searchState.query.length < 2 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {searchState.suggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span>{suggestion.text}</span>
                    {suggestion.count && (
                      <Badge variant="secondary" className="h-4 text-xs">
                        {suggestion.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && searchState.showFilters && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Search Filters</h4>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              <Tabs defaultValue="type" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="type">Type</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="date">Date</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="type" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(searchState.facets.type || []).map(([_, facet]) => (
                      <div key={facet.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${facet.value}`}
                          checked={searchState.selectedFilters.type?.includes(facet.value) || false}
                          onCheckedChange={() => handleFilterChange('type', facet.value)}
                        />
                        <Label htmlFor={`type-${facet.value}`} className="flex items-center gap-2 text-sm">
                          {getResultIcon(facet.value)}
                          <span className="capitalize">{facet.value}</span>
                          <Badge variant="outline" className="h-4 text-xs">
                            {facet.count}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="status" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(searchState.facets.status || []).map(([_, facet]) => (
                      <div key={facet.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${facet.value}`}
                          checked={searchState.selectedFilters.status?.includes(facet.value) || false}
                          onCheckedChange={() => handleFilterChange('status', facet.value)}
                        />
                        <Label htmlFor={`status-${facet.value}`} className="flex items-center gap-2 text-sm">
                          <span className="capitalize">{facet.value.replace('_', ' ')}</span>
                          <Badge variant="outline" className="h-4 text-xs">
                            {facet.count}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="date" className="mt-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="date-start" className="text-sm">From</Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={searchState.selectedFilters.dateRange?.start || ''}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...searchState.selectedFilters.dateRange,
                          start: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-end" className="text-sm">To</Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={searchState.selectedFilters.dateRange?.end || ''}
                        onChange={(e) => handleFilterChange('dateRange', {
                          ...searchState.selectedFilters.dateRange,
                          end: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fuzzy-search"
                        checked={searchState.searchConfig.fuzzySearch}
                        onCheckedChange={(checked) => 
                          setSearchState(prev => ({
                            ...prev,
                            searchConfig: { ...prev.searchConfig, fuzzySearch: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="fuzzy-search" className="text-sm">
                        Fuzzy search (find similar matches)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exact-match"
                        checked={searchState.searchConfig.exactMatch}
                        onCheckedChange={(checked) => 
                          setSearchState(prev => ({
                            ...prev,
                            searchConfig: { ...prev.searchConfig, exactMatch: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="exact-match" className="text-sm">
                        Exact match only
                      </Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Error Display */}
          {searchState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {searchState.error}
            </div>
          )}

          {/* Search Results */}
          {searchState.showResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Search Results {searchState.total > 0 && `(${searchState.total})`}
                </h3>
                
                {searchState.results.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(true)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                )}
              </div>

              {searchState.results.length === 0 && !searchState.loading ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No results found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {searchState.results.slice(0, 5).map((result) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(result)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{result.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                              {result.score > 80 && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Best match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                            <p className="text-xs text-gray-500 line-clamp-2">{result.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchState.total > 5 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setShowAdvanced(true)}>
                    View all {searchState.total} results
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Results Dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Search Results for "{searchState.query}" ({searchState.total})
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
            {/* Results */}
            <div className="md:col-span-2">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4">
                  {searchState.results.map((result) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(result)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getResultIcon(result.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{result.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                            <p className="text-xs text-gray-500">{result.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              Score: {result.score}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Facets */}
            <div>
              <h4 className="font-medium mb-3">Filter Results</h4>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {Object.entries(searchState.facets).map(([facetKey, facetValues]) => (
                    <div key={facetKey}>
                      <h5 className="font-medium text-sm mb-2 capitalize">
                        {facetKey.replace('_', ' ')}
                      </h5>
                      <div className="space-y-1">
                        {facetValues.map((facet) => (
                          <div key={facet.value} className="flex items-center justify-between text-sm">
                            <button
                              onClick={() => handleFilterChange(facetKey, facet.value)}
                              className="flex items-center gap-2 hover:text-blue-600"
                            >
                              <span className="capitalize">{facet.value.replace('_', ' ')}</span>
                            </button>
                            <Badge variant="outline" className="h-4 text-xs">
                              {facet.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}