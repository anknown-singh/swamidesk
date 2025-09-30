'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BaseConsultationSession, BaseConsultationStep, UseConsultationSessionReturn } from './base-consultation-workflow'

export function useConsultationSession(
  appointmentId: string,
  specialty: string = 'general-medicine'
): UseConsultationSessionReturn {
  const [session, setSession] = useState<BaseConsultationSession | null>(null)
  const [currentStep, setCurrentStep] = useState<BaseConsultationStep>('chief_complaints')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch existing consultation session
  const fetchConsultationSession = useCallback(async () => {
    if (!appointmentId) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setSession(data as BaseConsultationSession)
        setCurrentStep((data.current_step as BaseConsultationStep) || 'chief_complaints')
      }
    } catch (err) {
      console.error('Error fetching consultation session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch consultation session')
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId, supabase])

  // Start new consultation session
  const startSession = useCallback(async (appointmentId: string, specialty: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('id', appointmentId)
        .single()

      if (appointmentError || !appointment) {
        throw new Error('Appointment not found')
      }

      // Create new consultation session
      const sessionData = {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: user.id,
        specialty,
        current_step: 'chief_complaints',
        status: 'active',
        started_at: new Date().toISOString(),
        is_completed: false,
        session_data: {}
      }

      const { data: newSession, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert([sessionData])
        .select()
        .single()

      if (sessionError) {
        throw sessionError
      }

      setSession(newSession as BaseConsultationSession)
      setCurrentStep('chief_complaints')
    } catch (err) {
      console.error('Error starting consultation session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start consultation session')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Update consultation step
  const updateStep = useCallback(async (step: BaseConsultationStep, data: any) => {
    if (!session) return

    try {
      setIsLoading(true)
      setError(null)

      const updatedSessionData = {
        ...session.session_data,
        [step]: data
      }

      const { error: updateError } = await supabase
        .from('consultation_sessions')
        .update({
          current_step: step,
          session_data: updatedSessionData
        })
        .eq('id', session.id)

      if (updateError) {
        throw updateError
      }

      setSession(prev => prev ? {
        ...prev,
        current_step: step,
        session_data: updatedSessionData
      } : null)

      setCurrentStep(step)
    } catch (err) {
      console.error('Error updating consultation step:', err)
      setError(err instanceof Error ? err.message : 'Failed to update consultation step')
    } finally {
      setIsLoading(false)
    }
  }, [session, supabase])

  // Complete consultation session
  const completeSession = useCallback(async () => {
    if (!session) return

    try {
      setIsLoading(true)
      setError(null)

      const { error: completeError } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          is_completed: true,
          completed_at: new Date().toISOString(),
          current_step: 'completed'
        })
        .eq('id', session.id)

      if (completeError) {
        throw completeError
      }

      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        is_completed: true,
        completed_at: new Date().toISOString(),
        current_step: 'completed'
      } : null)

      setCurrentStep('completed')
    } catch (err) {
      console.error('Error completing consultation session:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete consultation session')
    } finally {
      setIsLoading(false)
    }
  }, [session, supabase])

  // Pause consultation session
  const pauseSession = useCallback(async () => {
    if (!session) return

    try {
      setIsLoading(true)
      setError(null)

      const { error: pauseError } = await supabase
        .from('consultation_sessions')
        .update({ status: 'paused' })
        .eq('id', session.id)

      if (pauseError) {
        throw pauseError
      }

      setSession(prev => prev ? { ...prev, status: 'paused' } : null)
    } catch (err) {
      console.error('Error pausing consultation session:', err)
      setError(err instanceof Error ? err.message : 'Failed to pause consultation session')
    } finally {
      setIsLoading(false)
    }
  }, [session, supabase])

  // Resume consultation session
  const resumeSession = useCallback(async () => {
    if (!session) return

    try {
      setIsLoading(true)
      setError(null)

      const { error: resumeError } = await supabase
        .from('consultation_sessions')
        .update({ status: 'active' })
        .eq('id', session.id)

      if (resumeError) {
        throw resumeError
      }

      setSession(prev => prev ? { ...prev, status: 'active' } : null)
    } catch (err) {
      console.error('Error resuming consultation session:', err)
      setError(err instanceof Error ? err.message : 'Failed to resume consultation session')
    } finally {
      setIsLoading(false)
    }
  }, [session, supabase])

  // Fetch session on mount and appointment change
  useEffect(() => {
    fetchConsultationSession()
  }, [fetchConsultationSession])

  return {
    session,
    currentStep,
    isLoading,
    error,
    startSession,
    updateStep,
    completeSession,
    pauseSession,
    resumeSession
  }
}