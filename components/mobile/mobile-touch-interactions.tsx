'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Plus,
  Minus,
  Check,
  X
} from 'lucide-react'

interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function TouchButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  
  const variantClasses = {
    default: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
    primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 border-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    success: 'bg-green-600 border-green-600 text-white hover:bg-green-700 active:bg-green-800',
    warning: 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
    danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-150',
        'transform active:scale-95 touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        isPressed && 'transform scale-95',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </button>
  )
}

interface SwipeCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: React.ComponentType<any>
    label: string
    color: string
  }
  rightAction?: {
    icon: React.ComponentType<any>
    label: string
    color: string
  }
  className?: string
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: SwipeCardProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentX = e.touches[0].clientX
    const deltaX = currentX - startX
    setDragX(Math.max(-100, Math.min(100, deltaX)))
  }

  const handleTouchEnd = () => {
    if (Math.abs(dragX) > 50) {
      if (dragX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (dragX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    setDragX(0)
    setIsDragging(false)
    setStartX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left Action */}
      {leftAction && dragX > 20 && (
        <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-red-500 text-white">
          <div className="flex items-center gap-2">
            <leftAction.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right Action */}
      {rightAction && dragX < -20 && (
        <div className="absolute left-0 top-0 h-full flex items-center px-4 bg-green-500 text-white">
          <div className="flex items-center gap-2">
            <rightAction.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        className={cn(
          'bg-white border rounded-lg transition-transform duration-200',
          isDragging && 'transition-none',
          className
        )}
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

interface TouchExpandableProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  icon?: React.ComponentType<any>
  badge?: string
}

export function TouchExpandable({
  title,
  children,
  defaultExpanded = false,
  icon: Icon,
  badge
}: TouchExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border rounded-lg overflow-hidden">
      <TouchButton
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between bg-gray-50 border-0 rounded-none"
        size="md"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5" />}
          <span className="font-medium">{title}</span>
          {badge && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </TouchButton>

      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

interface TouchStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
}

export function TouchStepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit
}: TouchStepperProps) {
  const decrease = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const increase = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
      <div className="flex-1">
        {label && (
          <div className="text-sm font-medium text-gray-700 mb-1">
            {label}
          </div>
        )}
        <div className="flex items-center gap-3">
          <TouchButton
            onClick={decrease}
            disabled={value <= min}
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0"
          >
            <Minus className="h-4 w-4" />
          </TouchButton>
          
          <div className="text-center min-w-[60px]">
            <span className="text-lg font-semibold">
              {value}
              {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </span>
          </div>
          
          <TouchButton
            onClick={increase}
            disabled={value >= max}
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0"
          >
            <Plus className="h-4 w-4" />
          </TouchButton>
        </div>
      </div>
    </div>
  )
}

interface TouchActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  actions: Array<{
    label: string
    icon?: React.ComponentType<any>
    onClick: () => void
    variant?: 'default' | 'danger'
    disabled?: boolean
  }>
}

export function TouchActionSheet({
  isOpen,
  onClose,
  title,
  actions
}: TouchActionSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl border-t shadow-xl animate-in slide-in-from-bottom-full duration-300">
        {title && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <TouchButton
                onClick={onClose}
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0"
              >
                <X className="h-4 w-4" />
              </TouchButton>
            </div>
          </div>
        )}
        
        <div className="p-4 space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <TouchButton
                key={index}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
                className="w-full justify-start gap-3"
                variant={action.variant === 'danger' ? 'danger' : 'default'}
                disabled={action.disabled}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {action.label}
              </TouchButton>
            )
          })}
        </div>

        {/* Handle bar */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  )
}

interface TouchTabsProps {
  tabs: Array<{
    id: string
    label: string
    icon?: React.ComponentType<any>
    badge?: number
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TouchTabs({
  tabs,
  activeTab,
  onTabChange,
  className
}: TouchTabsProps) {
  return (
    <div className={cn("flex bg-gray-100 rounded-lg p-1", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = tab.id === activeTab
        
        return (
          <TouchButton
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 justify-center gap-2 border-0 transition-all",
              isActive 
                ? "bg-white shadow-sm text-blue-600" 
                : "bg-transparent text-gray-600 hover:text-gray-900"
            )}
            size="sm"
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="font-medium">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] text-center">
                {tab.badge}
              </span>
            )}
          </TouchButton>
        )
      })}
    </div>
  )
}