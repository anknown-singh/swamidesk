'use client'

import { useParams, useRouter } from 'next/navigation'
import { ConsultationWorkflow } from '@/components/consultation/consultation-workflow'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Consultation</h1>
          <p className="text-muted-foreground mb-4">No appointment ID provided</p>
          <Button onClick={() => router.push('/doctor/consultations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Consultations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ConsultationWorkflow 
        appointmentId={appointmentId}
        onComplete={() => {
          router.push('/doctor/consultations?completed=true')
        }}
        onCancel={() => {
          router.push('/doctor/consultations')
        }}
      />
    </div>
  )
}