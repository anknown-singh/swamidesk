'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search, Package, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// Medicine type from medicine_master database
interface MedicineMaster {
  id: string
  name: string
  generic_name?: string
  brand_names?: string[]
  category: string
  subcategory?: string
  therapeutic_class?: string
  pharmacological_class?: string
  dosage_forms: string[]
  strengths: string[]
  standard_dosage_adult?: string
  standard_dosage_pediatric?: string
  routes: string[]
  frequencies?: string[]
  indications?: string[]
  contraindications?: string[]
  side_effects?: string[]
  drug_interactions?: string[]
  warnings?: string[]
  max_daily_dose?: string
  duration_guidelines?: string
  monitoring_requirements?: string[]
  mechanism_of_action?: string
  pregnancy_category?: string
  controlled_substance: boolean
  prescription_required: boolean
  search_keywords?: string[]
  is_active: boolean
}

interface MedicationAutocompleteProps {
  value: string
  onChange: (medicationName: string, medicineData?: MedicineMaster) => void
  placeholder?: string
  className?: string
}

export function MedicationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search medicines...",
  className
}: MedicationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState<MedicineMaster[]>([])
  const [searchTerm, setSearchTerm] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Debounced search function
  const searchMedicines = useCallback(async (term: string) => {
    if (term.length < 2) {
      setMedicines([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('medicine_master')
        .select('*')
        .or(`name.ilike.%${term}%,generic_name.ilike.%${term}%,category.ilike.%${term}%,therapeutic_class.ilike.%${term}%,subcategory.ilike.%${term}%`)
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(20)

      if (error) {
        console.error('Error searching medicines:', error)
        return
      }

      setMedicines(data || [])
    } catch (err) {
      console.error('Medicine search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchMedicines(searchTerm)
      } else {
        setMedicines([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchMedicines])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)
    setIsOpen(newValue.length >= 2)
  }

  // Handle medicine selection
  const handleMedicineSelect = (medicine: MedicineMaster) => {
    setSearchTerm(medicine.name)
    onChange(medicine.name, medicine)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true)
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load popular medicines on focus when input is empty
  const loadPopularMedicines = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medicine_master')
        .select('*')
        .eq('is_active', true)
        .in('category', ['Analgesic', 'Antibiotic', 'Cardiovascular', 'Antidiabetic'])
        .order('name', { ascending: true })
        .limit(15)

      if (error) {
        console.error('Error loading popular medicines:', error)
        return
      }

      setMedicines(data || [])
    } catch (err) {
      console.error('Failed to load popular medicines:', err)
    }
  }, [supabase])

  // Handle input focus - load popular medicines if search is empty
  const handleFocus = () => {
    if (searchTerm.length < 2) {
      loadPopularMedicines()
      setIsOpen(true)
    } else {
      setIsOpen(true)
    }
  }

  // Get prescription status
  const getPrescriptionStatus = (medicine: MedicineMaster) => {
    if (!medicine.prescription_required) return { status: 'otc', color: 'secondary' }
    if (medicine.controlled_substance) return { status: 'controlled', color: 'destructive' }
    return { status: 'prescription', color: 'default' }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[300px] overflow-auto"
        >
          {medicines.length === 0 && !loading && searchTerm.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No medicines found matching "{searchTerm}"
            </div>
          )}

          {medicines.length === 0 && !loading && searchTerm.length < 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search medicines
            </div>
          )}

          {searchTerm.length < 2 && medicines.length > 0 && (
            <div className="p-2 text-xs text-muted-foreground border-b bg-muted/50">
              Popular medicines from clinical database
            </div>
          )}

          {medicines.map((medicine) => {
            const prescriptionStatus = getPrescriptionStatus(medicine)
            return (
              <div
                key={medicine.id}
                className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                onClick={() => handleMedicineSelect(medicine)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {medicine.name}
                      </span>
                      <Badge variant={prescriptionStatus.color as any} className="text-xs">
                        {medicine.controlled_substance ? 'Controlled' : 
                         medicine.prescription_required ? 'Prescription' : 'OTC'}
                      </Badge>
                    </div>
                    
                    {medicine.generic_name && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Generic: {medicine.generic_name}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {medicine.dosage_forms?.[0] || 'Multiple forms'}
                        </span>
                      </div>
                      
                      {medicine.strengths?.[0] && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {medicine.strengths[0]}
                            {medicine.strengths.length > 1 && ` (+${medicine.strengths.length - 1})`}
                          </span>
                        </div>
                      )}
                      
                      {medicine.standard_dosage_adult && (
                        <div className="text-xs text-muted-foreground">
                          {medicine.standard_dosage_adult}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {medicine.category}
                      </Badge>
                      {medicine.subcategory && (
                        <span className="text-xs text-muted-foreground">
                          {medicine.subcategory}
                        </span>
                      )}
                      {medicine.therapeutic_class && (
                        <span className="text-xs text-muted-foreground">
                          • {medicine.therapeutic_class}
                        </span>
                      )}
                    </div>

                    {medicine.indications && medicine.indications.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Used for: {medicine.indications.slice(0, 3).join(', ')}
                        {medicine.indications.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}