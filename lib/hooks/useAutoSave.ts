'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions {
  delay?: number // Debounce delay in milliseconds
  enabled?: boolean // Whether auto-save is enabled
  onSave?: (data: any) => Promise<void> // Custom save function
  onError?: (error: Error) => void // Error callback
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus
  lastSaved: Date | null
  forceSave: () => Promise<void>
  error: string | null
}

export function useAutoSave<T>(
  data: T,
  tableName: string,
  keyField: string,
  keyValue: string,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError
  } = options

  const supabase = createClient()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<T>(data)
  const isInitialMount = useRef(true)

  const performSave = useCallback(async (dataToSave: T) => {
    if (!enabled || !keyValue) return

    try {
      setSaveStatus('saving')
      setError(null)

      if (onSave) {
        await onSave(dataToSave)
      } else {
        // Default save logic - upsert to database
        const { data: existingData } = await supabase
          .from(tableName)
          .select('id')
          .eq(keyField, keyValue)
          .single()

        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from(tableName)
            .update(dataToSave)
            .eq(keyField, keyValue)

          if (updateError) throw updateError
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from(tableName)
            .insert([{ [keyField]: keyValue, ...dataToSave }])

          if (insertError) throw insertError
        }
      }

      setSaveStatus('saved')
      setLastSaved(new Date())
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000)

    } catch (err) {
      console.error('Auto-save error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      setError(errorMessage)
      setSaveStatus('error')
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }, [enabled, keyValue, onSave, tableName, keyField, supabase, onError])

  const forceSave = useCallback(async () => {
    await performSave(data)
  }, [data, performSave])

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastDataRef.current = data
      return
    }

    // Check if data actually changed
    if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return
    }

    lastDataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      performSave(data)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    lastSaved,
    forceSave,
    error
  }
}