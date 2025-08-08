'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircleIcon, 
  AlertCircleIcon, 
  XCircleIcon,
  UserIcon,
  StethoscopeIcon,
  ActivityIcon,
  PillIcon,
  CreditCardIcon,
  CalendarIcon
} from 'lucide-react'
import Link from 'next/link'

interface WorkflowModule {
  name: string
  completion: number
  status: 'complete' | 'partial' | 'incomplete'
  description: string
  icon: React.ReactNode
  href?: string
}

interface WorkflowStatusIndicatorProps {
  compact?: boolean
  showDetails?: boolean
}

export function WorkflowStatusIndicator({ 
  compact = false, 
  showDetails = true 
}: WorkflowStatusIndicatorProps) {
  const modules: WorkflowModule[] = [
    {
      name: 'Patient Registration',
      completion: 100,
      status: 'complete',
      description: 'Registration, search, and profile management',
      icon: <UserIcon className="h-4 w-4" />,
      href: '/admin/patients'
    },
    {
      name: 'Appointments',
      completion: 100,
      status: 'complete', 
      description: 'Booking, scheduling, and queue management',
      icon: <CalendarIcon className="h-4 w-4" />,
      href: '/admin/appointments'
    },
    {
      name: 'OPD/Consultation',
      completion: 95,
      status: 'complete',
      description: 'Doctor consultations and diagnosis workflow',
      icon: <StethoscopeIcon className="h-4 w-4" />,
      href: '/admin/opd'
    },
    {
      name: 'Procedure Execution',
      completion: 60,
      status: 'partial',
      description: 'Service attendant procedure workflow',
      icon: <ActivityIcon className="h-4 w-4" />,
      href: '/attendant/procedures'
    },
    {
      name: 'Pharmacy System',
      completion: 40,
      status: 'incomplete',
      description: 'Medicine dispensing and inventory integration',
      icon: <PillIcon className="h-4 w-4" />,
      href: '/pharmacy/pharmacy'
    },
    {
      name: 'Billing Integration',
      completion: 80,
      status: 'partial',
      description: 'Invoice generation and payment processing',
      icon: <CreditCardIcon className="h-4 w-4" />,
      href: '/admin/billing'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'partial': return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
      case 'incomplete': return <XCircleIcon className="h-4 w-4 text-red-600" />
      default: return <AlertCircleIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string, completion: number) => {
    if (status === 'complete') return <Badge className="bg-green-500 text-white text-xs">Complete</Badge>
    if (status === 'partial') return <Badge className="bg-yellow-500 text-white text-xs">{completion}%</Badge>
    return <Badge className="bg-red-500 text-white text-xs">Incomplete</Badge>
  }

  const overallCompletion = Math.round(
    modules.reduce((sum, module) => sum + module.completion, 0) / modules.length
  )

  if (compact) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Workflow Status</CardTitle>
            <Link href="/documentation/status" className="text-xs text-blue-600 hover:text-blue-800 underline">
              View Details
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={overallCompletion} className="flex-1 h-2" />
            <span className="text-xs font-medium">{overallCompletion}%</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {modules.map((module) => (
              <div key={module.name} className="flex items-center gap-2">
                {getStatusIcon(module.status)}
                <span className="truncate">{module.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Workflow Implementation Status</CardTitle>
            <CardDescription>
              Core patient journey modules - {overallCompletion}% complete
            </CardDescription>
          </div>
          <Link href="/documentation/status" className="text-sm text-blue-600 hover:text-blue-800 underline">
            View Detailed Report →
          </Link>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{overallCompletion}%</span>
          </div>
          <Progress value={overallCompletion} className="h-3" />
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent>
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {module.icon}
                  <div>
                    <div className="font-medium text-sm">{module.name}</div>
                    <div className="text-xs text-gray-600">{module.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(module.status, module.completion)}
                  {getStatusIcon(module.status)}
                </div>
              </div>
            ))}
          </div>
          
          {overallCompletion < 100 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Core workflow gaps prevent end-to-end functionality
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Priority: Complete procedure execution and pharmacy dispensing workflows
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}