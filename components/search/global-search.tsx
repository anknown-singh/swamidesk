'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, Calendar, Pill, FileText, Clock, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'patient' | 'appointment' | 'medicine' | 'prescription' | 'invoice' | 'service'
  title: string
  subtitle: string
  description?: string
  url: string
  metadata?: Record<string, any>
}

interface GlobalSearchProps {
  userProfile: UserProfile
  className?: string
}

export function GlobalSearch({ userProfile, className = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchResults: SearchResult[] = []

    try {
      // Search based on user role
      await Promise.all([
        searchPatients(searchQuery, searchResults),
        searchAppointments(searchQuery, searchResults),
        searchMedicines(searchQuery, searchResults),
        userProfile.role === 'doctor' && searchPrescriptions(searchQuery, searchResults),
        userProfile.role === 'receptionist' && searchInvoices(searchQuery, searchResults),
        searchServices(searchQuery, searchResults)
      ].filter(Boolean))

      // Sort results by relevance (exact matches first, then partial)
      const sortedResults = searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(searchQuery.toLowerCase())
        const bExact = b.title.toLowerCase().includes(searchQuery.toLowerCase())
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })

      setResults(sortedResults.slice(0, 8)) // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Individual search functions
  const searchPatients = async (query: string, results: SearchResult[]) => {
    const { data: patients } = await supabase
      .from('patients')
      .select('id, full_name, phone, email, date_of_birth')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(3)

    patients?.forEach(patient => {
      results.push({
        id: patient.id,
        type: 'patient',
        title: patient.full_name,
        subtitle: patient.phone || patient.email || '',
        description: patient.date_of_birth ? `Born: ${new Date(patient.date_of_birth).toLocaleDateString()}` : '',
        url: `/${userProfile.role}/patients/${patient.id}`,
        metadata: patient
      })
    })
  }

  const searchAppointments = async (query: string, results: SearchResult[]) => {
    // Search appointments by status first, then by ID if no results
    let appointments: any[] = []
    
    // Try status search
    const { data: statusResults } = await supabase
      .from('appointments')
      .select(`
        id, scheduled_date, scheduled_time, status, patient_id, doctor_id,
        patients(full_name),
        doctor:users!doctor_id(full_name)
      `)
      .ilike('status', `%${query}%`)
      .limit(2)
    
    if (statusResults?.length) {
      appointments = appointments.concat(statusResults)
    }
    
    // Try ID search if we need more results
    if (appointments.length < 3) {
      const { data: idResults } = await supabase
        .from('appointments')
        .select(`
          id, scheduled_date, scheduled_time, status, patient_id, doctor_id,
          patients(full_name),
          doctor:users!doctor_id(full_name)
        `)
        .ilike('id', `%${query}%`)
        .limit(3 - appointments.length)
      
      if (idResults?.length) {
        appointments = appointments.concat(idResults)
      }
    }

    appointments?.forEach(apt => {
      const patientName = (apt.patients as any)?.full_name || 'Unknown Patient'
      const doctorName = (apt.doctor as any)?.full_name || 'Unknown Doctor'
      
      results.push({
        id: apt.id,
        type: 'appointment',
        title: `${patientName} - ${doctorName}`,
        subtitle: `Status: ${apt.status}`,
        description: `${new Date(apt.scheduled_date).toLocaleDateString()} at ${apt.scheduled_time}`,
        url: `/${userProfile.role}/appointments/${apt.id}`,
        metadata: { status: apt.status }
      })
    })
  }

  const searchMedicines = async (query: string, results: SearchResult[]) => {
    const { data: medicines } = await supabase
      .from('medicines')
      .select('id, name, category, dosage_form, stock_quantity')
      .ilike('name', `%${query}%`)
      .limit(3)

    medicines?.forEach(medicine => {
      results.push({
        id: medicine.id,
        type: 'medicine',
        title: medicine.name,
        subtitle: `${medicine.category} - ${medicine.dosage_form}`,
        description: `Stock: ${medicine.stock_quantity} units`,
        url: `/pharmacy/medicines/${medicine.id}`,
        metadata: medicine
      })
    })
  }

  const searchPrescriptions = async (query: string, results: SearchResult[]) => {
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        id, created_at, status,
        patients(full_name)
      `)
      .ilike('patients.full_name', `%${query}%`)
      .limit(2)

    prescriptions?.forEach(prescription => {
      const patientName = (prescription.patients as any)?.full_name || 'Unknown Patient'
      
      results.push({
        id: prescription.id,
        type: 'prescription',
        title: `Prescription - ${patientName}`,
        subtitle: `Status: ${prescription.status}`,
        description: `Created: ${new Date(prescription.created_at).toLocaleDateString()}`,
        url: `/${userProfile.role}/prescriptions/${prescription.id}`,
        metadata: prescription
      })
    })
  }

  const searchInvoices = async (query: string, results: SearchResult[]) => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        id, total_amount, payment_status, created_at,
        patients(full_name)
      `)
      .ilike('patients.full_name', `%${query}%`)
      .limit(2)

    invoices?.forEach(invoice => {
      const patientName = (invoice.patients as any)?.full_name || 'Unknown Patient'
      
      results.push({
        id: invoice.id,
        type: 'invoice',
        title: `Invoice - ${patientName}`,
        subtitle: `₹${invoice.total_amount} - ${invoice.payment_status}`,
        description: `Created: ${new Date(invoice.created_at).toLocaleDateString()}`,
        url: `/${userProfile.role}/billing/invoices/${invoice.id}`,
        metadata: invoice
      })
    })
  }

  const searchServices = async (query: string, results: SearchResult[]) => {
    const { data: services } = await supabase
      .from('services')
      .select('id, name, category, price')
      .ilike('name', `%${query}%`)
      .eq('is_active', true)
      .limit(2)

    services?.forEach(service => {
      results.push({
        id: service.id,
        type: 'service',
        title: service.name,
        subtitle: service.category,
        description: `₹${service.price}`,
        url: `/${userProfile.role}/services/${service.id}`,
        metadata: service
      })
    })
  }

  // Handle search input changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        setIsOpen(true)
        performSearch(query)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]!)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient': return <User className="h-4 w-4" />
      case 'appointment': return <Calendar className="h-4 w-4" />
      case 'medicine': return <Pill className="h-4 w-4" />
      case 'prescription': return <FileText className="h-4 w-4" />
      case 'invoice': return <FileText className="h-4 w-4" />
      case 'service': return <Clock className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  // Get badge color for result type
  const getBadgeVariant = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient': return 'default'
      case 'appointment': return 'secondary'
      case 'medicine': return 'outline'
      case 'prescription': return 'default'
      case 'invoice': return 'destructive'
      case 'service': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search patients, appointments, medicines..."
          className="pl-10 w-80"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && results.length > 0) {
              setIsOpen(true)
            }
          }}
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.trim() || results.length > 0) && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                      selectedIndex === index ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0 text-gray-400">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <Badge 
                            variant={getBadgeVariant(result.type)}
                            className="text-xs"
                          >
                            {result.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                        {result.description && (
                          <p className="text-xs text-gray-400 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts hint */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40">
          <Card className="bg-gray-50 border-t-0">
            <CardContent className="p-2">
              <div className="text-xs text-gray-500 flex items-center justify-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>⏎ Select</span>
                <span>Esc Close</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}