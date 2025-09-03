'use client'

import { SaveStatus } from '@/lib/hooks/useAutoSave'
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSaved?: Date | null
  error?: string | null
  className?: string
  compact?: boolean
}

export function SaveStatusIndicator({ 
  status, 
  lastSaved, 
  error, 
  className,
  compact = false
}: SaveStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'saved':
        return <Check className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Save className="w-4 h-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return compact ? 'Saved' : `Saved ${lastSaved ? getTimeAgo(lastSaved) : ''}`
      case 'error':
        return compact ? 'Error' : `Failed to save${error ? `: ${error}` : ''}`
      default:
        return ''
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return 'text-blue-500'
      case 'saved':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    
    if (diffSeconds < 60) {
      return 'just now'
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`
    } else {
      return `${Math.floor(diffSeconds / 3600)}h ago`
    }
  }

  if (status === 'idle' && !lastSaved) {
    return null
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm transition-all duration-200",
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      <span className="font-medium">{getStatusText()}</span>
    </div>
  )
}