'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { useAutoSave } from '@/lib/hooks/useAutoSave'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, ArrowRight, History, Heart, User, Users, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator'

interface HistoryTakingFormProps {
  consultationId: string
  onNext: () => void
  onPrevious: () => void
}

export function HistoryTakingForm({ consultationId, onNext, onPrevious }: HistoryTakingFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingHistory, setExistingHistory] = useState<any>(null)
  const [historyData, setHistoryData] = useState({
    present_illness: '',
    past_medical: '',
    personal: '',
    family: '',
    allergy: ''
  })

  // Auto-save functionality - Custom save logic for correct database structure
  const { saveStatus, lastSaved, forceSave, error: autoSaveError } = useAutoSave(
    historyData,
    'consultation_history',
    'consultation_id',
    consultationId,
    {
      delay: 2000,
      enabled: !loading && !!consultationId,
      onSave: async (data: typeof historyData) => {
        // Delete existing history records for this consultation first
        await supabase
          .from('consultation_history')
          .delete()
          .eq('consultation_id', consultationId)

        // Create records for each history type that has content
        const historyEntries = []
        
        if (data.present_illness?.trim()) {
          historyEntries.push({
            consultation_id: consultationId,
            history_type: 'present_illness',
            content: { text: data.present_illness },
            summary_text: data.present_illness.substring(0, 500) // Truncate for summary
          })
        }
        
        if (data.past_medical?.trim()) {
          historyEntries.push({
            consultation_id: consultationId,
            history_type: 'past_medical',
            content: { text: data.past_medical },
            summary_text: data.past_medical.substring(0, 500)
          })
        }
        
        if (data.personal?.trim()) {
          historyEntries.push({
            consultation_id: consultationId,
            history_type: 'personal',
            content: { text: data.personal },
            summary_text: data.personal.substring(0, 500)
          })
        }
        
        if (data.family?.trim()) {
          historyEntries.push({
            consultation_id: consultationId,
            history_type: 'family',
            content: { text: data.family },
            summary_text: data.family.substring(0, 500)
          })
        }
        
        if (data.allergy?.trim()) {
          historyEntries.push({
            consultation_id: consultationId,
            history_type: 'allergy',
            content: { text: data.allergy },
            summary_text: data.allergy.substring(0, 500)
          })
        }

        // Insert new history entries
        if (historyEntries.length > 0) {
          const { error } = await supabase
            .from('consultation_history')
            .insert(historyEntries)
          if (error) throw error
        }
      },
      onError: (error) => {
        if (!error.message.includes('does not exist') && !error.message.includes('PGRST116')) {
          console.error('Auto-save failed:', error.message)
        }
      }
    }
  )

  // Load existing history
  useEffect(() => {
    const loadExistingHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('consultation_history')
          .select('*')
          .eq('consultation_id', consultationId)

        if (error && error.code === 'PGRST116') {
          setExistingHistory(null)
          setLoading(false)
          return
        }

        if (error && error.code !== 'PGRST116') throw error

        if (data && data.length > 0) {
          setExistingHistory(data)
          
          // Transform the array of history records back to form data
          const historyMap = {
            present_illness: '',
            past_medical: '',
            personal: '',
            family: '',
            allergy: ''
          }
          
          data.forEach((record: any) => {
            if (record.content?.text && historyMap.hasOwnProperty(record.history_type)) {
              (historyMap as any)[record.history_type] = record.content.text
            }
          })
          
          setHistoryData(historyMap)
        }
      } catch (err: any) {
        console.error('Error loading history:', err)
        if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
          toast.error('Failed to load existing history')
        }
      } finally {
        setLoading(false)
      }
    }

    loadExistingHistory()
  }, [consultationId, supabase])

  const handleSave = async () => {
    try {
      setSaving(true)
      await forceSave() // Force save current data
      toast.success('Medical history saved successfully')
      onNext()
    } catch (err) {
      console.error('Error saving history:', err)
      toast.error('Failed to save medical history')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading medical history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Medical History</h3>
          </div>
          <SaveStatusIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            error={autoSaveError}
            compact
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive medical and personal history collection. Changes are automatically saved as you type.
        </p>
      </div>

      <Tabs defaultValue="present_illness" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="present_illness">Present Illness</TabsTrigger>
          <TabsTrigger value="past_medical">Past Medical</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="allergy">Allergies</TabsTrigger>
        </TabsList>

        <TabsContent value="present_illness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                History of Present Illness
              </CardTitle>
              <CardDescription>
                Detailed progression of the current illness and symptoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="present_illness">Present Illness Details</Label>
                  <Textarea
                    id="present_illness"
                    placeholder="Describe the detailed progression of symptoms, timeline, associated factors..."
                    className="min-h-[150px] mt-2"
                    value={historyData.present_illness}
                    onChange={(e) => setHistoryData(prev => ({ ...prev, present_illness: e.target.value }))}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Consider including:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Onset and progression</li>
                    <li>Associated symptoms</li>
                    <li>Previous treatment attempts</li>
                    <li>Impact on daily activities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past_medical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Past Medical History
              </CardTitle>
              <CardDescription>
                Previous illnesses, surgeries, hospitalizations, and medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="past_medical">Past Medical History</Label>
                  <Textarea
                    id="past_medical"
                    placeholder="Previous illnesses, surgeries, hospitalizations, chronic conditions, medications..."
                    className="min-h-[150px] mt-2"
                    value={historyData.past_medical}
                    onChange={(e) => setHistoryData(prev => ({ ...prev, past_medical: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal History
              </CardTitle>
              <CardDescription>
                Lifestyle, habits, occupation, and social history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="personal">Personal & Social History</Label>
                  <Textarea
                    id="personal"
                    placeholder="Smoking, alcohol, diet, exercise, occupation, stress factors..."
                    className="min-h-[150px] mt-2"
                    value={historyData.personal}
                    onChange={(e) => setHistoryData(prev => ({ ...prev, personal: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Family History
              </CardTitle>
              <CardDescription>
                Family medical history and genetic predispositions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="family">Family History</Label>
                  <Textarea
                    id="family"
                    placeholder="Family medical conditions, genetic disorders, cause of death of relatives..."
                    className="min-h-[150px] mt-2"
                    value={historyData.family}
                    onChange={(e) => setHistoryData(prev => ({ ...prev, family: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allergy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Allergy History
              </CardTitle>
              <CardDescription>
                Drug allergies, food allergies, and environmental sensitivities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allergy">Allergies & Adverse Reactions</Label>
                  <Textarea
                    id="allergy"
                    placeholder="Drug allergies, food allergies, environmental allergies, reactions..."
                    className="min-h-[150px] mt-2"
                    value={historyData.allergy}
                    onChange={(e) => setHistoryData(prev => ({ ...prev, allergy: e.target.value }))}
                  />
                </div>
                <Badge variant="destructive" className="w-fit">
                  ⚠️ Critical: Document all known allergies
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back: Chief Complaints
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : (
            <>
              Next: Vital Signs
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}