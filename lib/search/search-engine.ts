'use client'

import { supabase } from '@/lib/supabase'

// Search result types
export interface SearchResult {
  id: string
  type: 'patient' | 'appointment' | 'medicine' | 'service' | 'invoice' | 'user'
  title: string
  subtitle: string
  description: string
  metadata: any
  url: string
  score: number
  highlighted?: string
}

// Search suggestion types
export interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'popular' | 'suggestion'
  category?: string
  count?: number
}

// Search filters
export interface SearchFilters {
  type?: string[]
  dateRange?: {
    start: string
    end: string
  }
  status?: string[]
  department?: string[]
  priority?: string[]
  tags?: string[]
  [key: string]: any
}

// Search configuration
export interface SearchConfig {
  limit?: number
  offset?: number
  includeMetadata?: boolean
  fuzzySearch?: boolean
  exactMatch?: boolean
  sortBy?: 'relevance' | 'date' | 'alphabetical'
  sortOrder?: 'asc' | 'desc'
}

// Search analytics
export interface SearchAnalytics {
  totalSearches: number
  topQueries: Array<{ query: string; count: number }>
  topResults: Array<{ type: string; title: string; clicks: number }>
  averageResultsPerQuery: number
  noResultsQueries: string[]
}

class SearchEngine {
  private static instance: SearchEngine
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>()
  private suggestionCache = new Map<string, { suggestions: SearchSuggestion[]; timestamp: number }>()
  private cacheExpiry = 5 * 60 * 1000 // 5 minutes
  private searchHistory: string[] = []
  private maxHistoryItems = 10

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine()
    }
    return SearchEngine.instance
  }

  // Intelligent search with autocomplete and filters
  async search(
    query: string,
    filters: SearchFilters = {},
    config: SearchConfig = {}
  ): Promise<{
    results: SearchResult[]
    total: number
    suggestions: SearchSuggestion[]
    facets: Record<string, Array<{ value: string; count: number }>>
  }> {
    const cacheKey = this.generateCacheKey(query, filters, config)
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      const suggestions = await this.getSuggestions(query)
      return {
        results: cached.results,
        total: cached.results.length,
        suggestions,
        facets: await this.getFacets(query, filters)
      }
    }

    try {
      const results: SearchResult[] = []
      const limit = config.limit || 20
      const offset = config.offset || 0

      // Search across different entity types
      const searchPromises = []

      if (!filters.type || filters.type.includes('patient')) {
        searchPromises.push(this.searchPatients(query, filters, config))
      }

      if (!filters.type || filters.type.includes('appointment')) {
        searchPromises.push(this.searchAppointments(query, filters, config))
      }

      if (!filters.type || filters.type.includes('medicine')) {
        searchPromises.push(this.searchMedicines(query, filters, config))
      }

      if (!filters.type || filters.type.includes('service')) {
        searchPromises.push(this.searchServices(query, filters, config))
      }

      if (!filters.type || filters.type.includes('invoice')) {
        searchPromises.push(this.searchInvoices(query, filters, config))
      }

      if (!filters.type || filters.type.includes('user')) {
        searchPromises.push(this.searchUsers(query, filters, config))
      }

      const searchResults = await Promise.all(searchPromises)
      
      // Combine and rank results
      for (const typeResults of searchResults) {
        results.push(...typeResults)
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score)

      // Apply pagination
      const paginatedResults = results.slice(offset, offset + limit)

      // Cache results
      this.searchCache.set(cacheKey, {
        results: paginatedResults,
        timestamp: Date.now()
      })

      // Add to search history
      this.addToHistory(query)

      // Log search analytics
      await this.logSearch(query, filters, paginatedResults.length)

      const suggestions = await this.getSuggestions(query)
      const facets = await this.getFacets(query, filters)

      return {
        results: paginatedResults,
        total: results.length,
        suggestions,
        facets
      }

    } catch (error) {
      console.error('Search error:', error)
      return {
        results: [],
        total: 0,
        suggestions: [],
        facets: {}
      }
    }
  }

  // Search patients with fuzzy matching
  private async searchPatients(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    let queryBuilder = supabase
      .from('patients')
      .select('*')

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,patient_id.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.dateRange) {
      queryBuilder = queryBuilder
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('status', filters.status)
    }

    const { data: patients } = await queryBuilder.limit(50)

    return (patients || []).map(patient => ({
      id: patient.id,
      type: 'patient' as const,
      title: patient.full_name,
      subtitle: `ID: ${patient.patient_id} • ${patient.phone}`,
      description: `${patient.age} years old • ${patient.gender} • ${patient.email || 'No email'}`,
      metadata: patient,
      url: `/patients/${patient.id}`,
      score: this.calculateRelevanceScore(query, [
        patient.full_name,
        patient.phone,
        patient.email,
        patient.patient_id
      ]),
      highlighted: this.highlightMatches(patient.full_name, query)
    }))
  }

  // Search appointments
  private async searchAppointments(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    
    let queryBuilder = supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(full_name, patient_id),
        users!appointments_doctor_id_fkey(full_name)
      `)

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `appointment_type.ilike.%${term}%,status.ilike.%${term}%,notes.ilike.%${term}%,patients.full_name.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.dateRange) {
      queryBuilder = queryBuilder
        .gte('scheduled_time', filters.dateRange.start)
        .lte('scheduled_time', filters.dateRange.end)
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('status', filters.status)
    }

    const { data: appointments } = await queryBuilder.limit(50)

    return (appointments || []).map(appointment => ({
      id: appointment.id,
      type: 'appointment' as const,
      title: `${appointment.appointment_type} - ${appointment.patients.full_name}`,
      subtitle: `${new Date(appointment.scheduled_time).toLocaleDateString()} • Dr. ${appointment.users?.full_name}`,
      description: appointment.notes || 'No additional notes',
      metadata: appointment,
      url: `/appointments/${appointment.id}`,
      score: this.calculateRelevanceScore(query, [
        appointment.appointment_type,
        appointment.patients.full_name,
        appointment.status,
        appointment.notes
      ]),
      highlighted: this.highlightMatches(appointment.appointment_type, query)
    }))
  }

  // Search medicines
  private async searchMedicines(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    
    let queryBuilder = supabase
      .from('medicines')
      .select('*')

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `name.ilike.%${term}%,generic_name.ilike.%${term}%,category.ilike.%${term}%,manufacturer.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      if (filters.status.includes('in_stock')) {
        queryBuilder = queryBuilder.gt('stock_quantity', 0)
      }
      if (filters.status.includes('low_stock')) {
        queryBuilder = queryBuilder.lte('stock_quantity', 10)
      }
      if (filters.status.includes('out_of_stock')) {
        queryBuilder = queryBuilder.eq('stock_quantity', 0)
      }
    }

    const { data: medicines } = await queryBuilder.limit(50)

    return (medicines || []).map(medicine => ({
      id: medicine.id,
      type: 'medicine' as const,
      title: medicine.name,
      subtitle: `${medicine.dosage_form} • ${medicine.strength} • ${medicine.category}`,
      description: `Stock: ${medicine.stock_quantity} • Price: ₹${medicine.unit_price} • ${medicine.manufacturer}`,
      metadata: medicine,
      url: `/inventory/medicines/${medicine.id}`,
      score: this.calculateRelevanceScore(query, [
        medicine.name,
        medicine.generic_name,
        medicine.category,
        medicine.manufacturer
      ]),
      highlighted: this.highlightMatches(medicine.name, query)
    }))
  }

  // Search services
  private async searchServices(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    
    let queryBuilder = supabase
      .from('services')
      .select('*')

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('is_active', filters.status.includes('active') ? [true] : [false])
    }

    const { data: services } = await queryBuilder.limit(50)

    return (services || []).map(service => ({
      id: service.id,
      type: 'service' as const,
      title: service.name,
      subtitle: `${service.category} • ₹${service.price}`,
      description: service.description || 'No description available',
      metadata: service,
      url: `/services/${service.id}`,
      score: this.calculateRelevanceScore(query, [
        service.name,
        service.category,
        service.description
      ]),
      highlighted: this.highlightMatches(service.name, query)
    }))
  }

  // Search invoices
  private async searchInvoices(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    
    let queryBuilder = supabase
      .from('invoices')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `invoice_number.ilike.%${term}%,payment_status.ilike.%${term}%,patients.full_name.ilike.%${term}%,patients.patient_id.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.dateRange) {
      queryBuilder = queryBuilder
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('payment_status', filters.status)
    }

    const { data: invoices } = await queryBuilder.limit(50)

    return (invoices || []).map(invoice => ({
      id: invoice.id,
      type: 'invoice' as const,
      title: `Invoice ${invoice.invoice_number}`,
      subtitle: `${invoice.patients.full_name} • ₹${invoice.total_amount}`,
      description: `Status: ${invoice.payment_status} • Date: ${new Date(invoice.created_at).toLocaleDateString()}`,
      metadata: invoice,
      url: `/billing/invoices/${invoice.id}`,
      score: this.calculateRelevanceScore(query, [
        invoice.invoice_number,
        invoice.patients.full_name,
        invoice.payment_status
      ]),
      highlighted: this.highlightMatches(invoice.invoice_number, query)
    }))
  }

  // Search users/staff
  private async searchUsers(query: string, filters: SearchFilters, _config: SearchConfig): Promise<SearchResult[]> {
    const searchTerms = this.parseSearchQuery(query)
    
    let queryBuilder = supabase
      .from('users')
      .select('*')

    // Apply search conditions
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term => 
        `full_name.ilike.%${term}%,email.ilike.%${term}%,role.ilike.%${term}%,specialization.ilike.%${term}%`
      ).join(',')
      queryBuilder = queryBuilder.or(searchConditions)
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      queryBuilder = queryBuilder.in('role', filters.status)
    }

    const { data: users } = await queryBuilder.limit(50)

    return (users || []).map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.full_name,
      subtitle: `${user.role} • ${user.email}`,
      description: user.specialization || `${user.role} at SwamIDesk`,
      metadata: user,
      url: `/admin/users/${user.id}`,
      score: this.calculateRelevanceScore(query, [
        user.full_name,
        user.email,
        user.role,
        user.specialization
      ]),
      highlighted: this.highlightMatches(user.full_name, query)
    }))
  }

  // Get intelligent search suggestions
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const cacheKey = `suggestions_${query.toLowerCase()}`
    const cached = this.suggestionCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.suggestions
    }

    const suggestions: SearchSuggestion[] = []

    // Add recent searches
    const recentSearches = this.searchHistory
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(search => ({
        id: `recent_${search}`,
        text: search,
        type: 'recent' as const
      }))

    suggestions.push(...recentSearches)

    // Add popular/common searches based on query
    const popularSuggestions = await this.getPopularSuggestions(query)
    suggestions.push(...popularSuggestions)

    // Add smart suggestions based on context
    const smartSuggestions = await this.getSmartSuggestions(query)
    suggestions.push(...smartSuggestions)

    // Cache suggestions
    this.suggestionCache.set(cacheKey, {
      suggestions: suggestions.slice(0, 10),
      timestamp: Date.now()
    })

    return suggestions.slice(0, 10)
  }

  // Get popular search suggestions
  private async getPopularSuggestions(query: string): Promise<SearchSuggestion[]> {
    // In a real app, this would query analytics data
    const commonSearches = [
      'patients today',
      'pending appointments',
      'medicine inventory',
      'overdue payments',
      'emergency contacts',
      'lab results',
      'prescription history',
      'staff schedule'
    ]

    return commonSearches
      .filter(search => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(search => ({
        id: `popular_${search}`,
        text: search,
        type: 'popular' as const,
        count: Math.floor(Math.random() * 100) + 10
      }))
  }

  // Get smart contextual suggestions
  private async getSmartSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = []
    const queryLower = query.toLowerCase()

    // Medical term suggestions
    if (queryLower.includes('med') || queryLower.includes('drug')) {
      suggestions.push({
        id: 'smart_medicines',
        text: 'medicines and inventory',
        type: 'suggestion' as const,
        category: 'inventory'
      })
    }

    // Patient-related suggestions
    if (queryLower.includes('patient') || queryLower.match(/^\d/)) {
      suggestions.push({
        id: 'smart_patients',
        text: 'patient records',
        type: 'suggestion' as const,
        category: 'patients'
      })
    }

    // Date-based suggestions
    if (queryLower.includes('today') || queryLower.includes('yesterday')) {
      suggestions.push({
        id: 'smart_today_appointments',
        text: "today's appointments",
        type: 'suggestion' as const,
        category: 'appointments'
      })
    }

    return suggestions
  }

  // Get search facets for filtering
  private async getFacets(_query: string, _filters: SearchFilters): Promise<Record<string, Array<{ value: string; count: number }>>> {
    const facets: Record<string, Array<{ value: string; count: number }>> = {}

    // Type facets
    facets.type = [
      { value: 'patient', count: 150 },
      { value: 'appointment', count: 89 },
      { value: 'medicine', count: 234 },
      { value: 'service', count: 45 },
      { value: 'invoice', count: 67 },
      { value: 'user', count: 12 }
    ]

    // Status facets
    facets.status = [
      { value: 'active', count: 120 },
      { value: 'pending', count: 45 },
      { value: 'completed', count: 234 },
      { value: 'cancelled', count: 12 }
    ]

    // Date range facets
    facets.dateRange = [
      { value: 'today', count: 23 },
      { value: 'this_week', count: 67 },
      { value: 'this_month', count: 189 },
      { value: 'this_year', count: 456 }
    ]

    return facets
  }

  // Parse search query into terms
  private parseSearchQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => term.trim())
  }

  // Calculate relevance score
  private calculateRelevanceScore(query: string, fields: (string | null | undefined)[]): number {
    const queryTerms = this.parseSearchQuery(query)
    let score = 0

    for (const field of fields) {
      if (!field) continue
      
      const fieldLower = field.toLowerCase()
      
      // Exact match gets highest score
      if (fieldLower === query.toLowerCase()) {
        score += 100
        continue
      }

      // Starts with query gets high score
      if (fieldLower.startsWith(query.toLowerCase())) {
        score += 80
        continue
      }

      // Contains all terms gets good score
      const containsAll = queryTerms.every(term => fieldLower.includes(term))
      if (containsAll) {
        score += 60
      }

      // Contains some terms gets partial score
      const matchingTerms = queryTerms.filter(term => fieldLower.includes(term)).length
      score += (matchingTerms / queryTerms.length) * 40
    }

    return Math.min(score, 100)
  }

  // Highlight matching terms in text
  private highlightMatches(text: string, query: string): string {
    if (!text || !query) return text

    const queryTerms = this.parseSearchQuery(query)
    let highlighted = text

    for (const term of queryTerms) {
      const regex = new RegExp(`(${term})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    }

    return highlighted
  }

  // Generate cache key
  private generateCacheKey(query: string, filters: SearchFilters, config: SearchConfig): string {
    return `search_${query}_${JSON.stringify(filters)}_${JSON.stringify(config)}`
  }

  // Add to search history
  private addToHistory(query: string): void {
    if (!query.trim()) return

    // Remove if exists and add to beginning
    this.searchHistory = this.searchHistory.filter(h => h !== query)
    this.searchHistory.unshift(query)

    // Keep only recent searches
    this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems)

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory))
    }
  }

  // Load search history from storage
  loadSearchHistory(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('searchHistory')
      if (stored) {
        try {
          this.searchHistory = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to parse search history:', e)
        }
      }
    }
  }

  // Log search for analytics
  private async logSearch(query: string, filters: SearchFilters, resultCount: number): Promise<void> {
    // In a real app, this would log to analytics service
    console.log('Search logged:', { query, filters, resultCount })
  }

  // Get search analytics
  async getSearchAnalytics(_dateRange?: { start: string; end: string }): Promise<SearchAnalytics> {
    // Mock analytics data - in real app would query from database
    return {
      totalSearches: 1247,
      topQueries: [
        { query: 'patient records', count: 89 },
        { query: 'medicine inventory', count: 67 },
        { query: 'appointments today', count: 45 },
        { query: 'overdue payments', count: 34 },
        { query: 'lab results', count: 28 }
      ],
      topResults: [
        { type: 'patient', title: 'John Smith', clicks: 156 },
        { type: 'medicine', title: 'Paracetamol', clicks: 134 },
        { type: 'appointment', title: 'Cardiology Consultation', clicks: 98 }
      ],
      averageResultsPerQuery: 8.5,
      noResultsQueries: [
        'xyz medicine',
        'cancelled appointments yesterday',
        'patient xyz123'
      ]
    }
  }

  // Clear caches
  clearCache(): void {
    this.searchCache.clear()
    this.suggestionCache.clear()
  }
}

// Export singleton instance
export const searchEngine = SearchEngine.getInstance()
export { SearchEngine }