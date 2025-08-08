'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Check,
  Lightbulb,
  Target,
  MapPin,
  Zap
} from 'lucide-react'
import {
  helpSystem,
  type Tour,
  type TourStep,
  type ContextHelp,
  UserRole
} from '@/lib/help/help-system'
import { useRouter } from 'next/navigation'

// Context help tooltip/popover component
interface ContextHelpTriggerProps {
  elementSelector?: string
  title: string
  content: string
  type?: 'tooltip' | 'popover' | 'modal'
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  className?: string
  showIcon?: boolean
  maxShowCount?: number
  userId?: string
}

export function ContextHelpTrigger({
  elementSelector,
  title,
  content,
  type = 'tooltip',
  position = 'top',
  trigger = 'hover',
  className = '',
  showIcon = true,
  maxShowCount = 5,
  userId
}: ContextHelpTriggerProps) {
  const [showCount, setShowCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (userId) {
      // Load show count from storage
      const storageKey = `help-shown-${elementSelector}-${userId}`
      const count = parseInt(localStorage.getItem(storageKey) || '0')
      setShowCount(count)
    }
  }, [elementSelector, userId])

  const handleShow = () => {
    if (maxShowCount && showCount >= maxShowCount) return

    const newCount = showCount + 1
    setShowCount(newCount)

    if (userId && elementSelector) {
      const storageKey = `help-shown-${elementSelector}-${userId}`
      localStorage.setItem(storageKey, newCount.toString())
    }
  }

  // Don't show if max count reached
  if (maxShowCount && showCount >= maxShowCount) return null

  const HelpIcon = () => (
    <HelpCircle className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-help" />
  )

  const helpContent = (
    <div className="p-3 max-w-sm">
      <div className="font-medium text-sm mb-2">{title}</div>
      <div className="text-xs text-gray-600 leading-relaxed">{content}</div>
    </div>
  )

  if (type === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={className} onClick={handleShow}>
              {showIcon && <HelpIcon />}
            </span>
          </TooltipTrigger>
          <TooltipContent side={position as any}>
            {helpContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (type === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <span className={className} onClick={handleShow}>
            {showIcon && <HelpIcon />}
          </span>
        </PopoverTrigger>
        <PopoverContent side={position as any} className="p-0">
          {helpContent}
        </PopoverContent>
      </Popover>
    )
  }

  if (type === 'modal') {
    return (
      <>
        <span 
          className={`cursor-pointer ${className}`}
          onClick={() => {
            setIsOpen(true)
            handleShow()
          }}
        >
          {showIcon && <HelpIcon />}
        </span>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-600 leading-relaxed">
              {content}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return null
}

// Interactive tour component
interface InteractiveTourProps {
  tourId?: string
  tour?: Tour
  userId: string
  userRole: UserRole
  onComplete?: (tourId: string) => void
  onSkip?: () => void
  autoStart?: boolean
  className?: string
}

interface TourState {
  isActive: boolean
  currentStepIndex: number
  tour: Tour | null
  completedSteps: string[]
  isPaused: boolean
}

export function InteractiveTour({
  tourId,
  tour: providedTour,
  userId,
  userRole,
  onComplete,
  onSkip,
  autoStart = false,
  className = ''
}: InteractiveTourProps) {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    tour: null,
    completedSteps: [],
    isPaused: false
  })

  const overlayRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const tourModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let tour = providedTour
    if (tourId && !tour) {
      tour = helpSystem.getTour(tourId) || null
    }

    if (tour) {
      setState(prev => ({
        ...prev,
        tour,
        isActive: autoStart
      }))
    }
  }, [tourId, providedTour, autoStart])

  useEffect(() => {
    if (state.isActive && state.tour) {
      positionTourElements()
      window.addEventListener('resize', positionTourElements)
      window.addEventListener('scroll', positionTourElements)

      return () => {
        window.removeEventListener('resize', positionTourElements)
        window.removeEventListener('scroll', positionTourElements)
      }
    }
  }, [state.isActive, state.currentStepIndex, state.tour])

  const positionTourElements = () => {
    if (!state.tour || !state.isActive) return

    const currentStep = state.tour.steps[state.currentStepIndex]
    if (!currentStep?.target) return

    const targetElement = document.querySelector(currentStep.target) as HTMLElement
    if (!targetElement) return

    const rect = targetElement.getBoundingClientRect()
    
    // Position highlight overlay
    if (highlightRef.current) {
      const highlight = highlightRef.current
      highlight.style.top = `${rect.top + window.scrollY - 4}px`
      highlight.style.left = `${rect.left + window.scrollX - 4}px`
      highlight.style.width = `${rect.width + 8}px`
      highlight.style.height = `${rect.height + 8}px`
    }

    // Position tour modal
    if (tourModalRef.current) {
      const modal = tourModalRef.current
      let top = rect.top + window.scrollY
      let left = rect.left + window.scrollX

      switch (currentStep.position) {
        case 'top':
          top = rect.top + window.scrollY - modal.offsetHeight - 16
          left = rect.left + window.scrollX + (rect.width - modal.offsetWidth) / 2
          break
        case 'bottom':
          top = rect.bottom + window.scrollY + 16
          left = rect.left + window.scrollX + (rect.width - modal.offsetWidth) / 2
          break
        case 'left':
          top = rect.top + window.scrollY + (rect.height - modal.offsetHeight) / 2
          left = rect.left + window.scrollX - modal.offsetWidth - 16
          break
        case 'right':
          top = rect.top + window.scrollY + (rect.height - modal.offsetHeight) / 2
          left = rect.right + window.scrollX + 16
          break
        case 'center':
          top = window.innerHeight / 2 - modal.offsetHeight / 2 + window.scrollY
          left = window.innerWidth / 2 - modal.offsetWidth / 2 + window.scrollX
          break
      }

      // Ensure modal stays within viewport
      top = Math.max(16, Math.min(top, window.innerHeight - modal.offsetHeight - 16 + window.scrollY))
      left = Math.max(16, Math.min(left, window.innerWidth - modal.offsetWidth - 16))

      modal.style.top = `${top}px`
      modal.style.left = `${left}px`
    }

    // Scroll target into view if needed
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }

  const startTour = () => {
    setState(prev => ({ ...prev, isActive: true, currentStepIndex: 0, isPaused: false }))
  }

  const stopTour = () => {
    setState(prev => ({ ...prev, isActive: false, isPaused: false }))
    clearHighlights()
    onSkip?.()
  }

  const pauseTour = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const nextStep = () => {
    if (!state.tour) return

    const currentStep = state.tour.steps[state.currentStepIndex]
    
    // Mark step as completed
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, currentStep.id]
    }))

    // Execute custom action if present
    if (currentStep.customAction) {
      currentStep.customAction()
    }

    // Move to next step or complete tour
    if (state.currentStepIndex < state.tour.steps.length - 1) {
      setState(prev => ({ ...prev, currentStepIndex: prev.currentStepIndex + 1 }))
    } else {
      completeTour()
    }
  }

  const previousStep = () => {
    if (state.currentStepIndex > 0) {
      setState(prev => ({ ...prev, currentStepIndex: prev.currentStepIndex - 1 }))
    }
  }

  const restartTour = () => {
    setState(prev => ({
      ...prev,
      currentStepIndex: 0,
      completedSteps: [],
      isPaused: false
    }))
  }

  const completeTour = () => {
    if (!state.tour) return

    // Track completion
    helpSystem.trackProgress(userId, 'complete_tour', state.tour.id)

    setState(prev => ({ ...prev, isActive: false }))
    clearHighlights()
    onComplete?.(state.tour.id)
  }

  const clearHighlights = () => {
    // Remove any element highlights
    document.querySelectorAll('[data-tour-highlight]').forEach(el => {
      const element = el as HTMLElement
      element.style.position = ''
      element.style.zIndex = ''
      element.style.boxShadow = ''
      element.removeAttribute('data-tour-highlight')
    })
  }

  if (!state.tour) return null

  const currentStep = state.tour.steps[state.currentStepIndex]
  const isLastStep = state.currentStepIndex === state.tour.steps.length - 1
  const progressPercentage = Math.round(((state.currentStepIndex + 1) / state.tour.steps.length) * 100)

  return (
    <>
      {/* Tour trigger button */}
      {!state.isActive && (
        <Button
          onClick={startTour}
          variant="outline"
          size="sm"
          className={className}
        >
          <Play className="h-4 w-4 mr-2" />
          Start Tour: {state.tour.name}
        </Button>
      )}

      {/* Active tour overlay */}
      {state.isActive && !state.isPaused && (
        <>
          {/* Dark overlay */}
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black bg-opacity-60 z-1000 pointer-events-auto"
            style={{ zIndex: 1000 }}
          />

          {/* Target element highlight */}
          {currentStep?.target && currentStep.highlightTarget && (
            <div
              ref={highlightRef}
              className="absolute border-2 border-blue-400 rounded bg-blue-400 bg-opacity-20 z-1001 pointer-events-none"
              style={{ zIndex: 1001 }}
            />
          )}

          {/* Tour step modal */}
          <div
            ref={tourModalRef}
            className="absolute bg-white rounded-lg shadow-2xl border max-w-sm z-1002"
            style={{ zIndex: 1002 }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600">
                    Step {state.currentStepIndex + 1} of {state.tour.steps.length}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pauseTour}
                    className="h-6 w-6 p-0"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restartTour}
                    className="h-6 w-6 p-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopTour}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{state.tour.name}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-1">{currentStep.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentStep.content}</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    disabled={state.currentStepIndex === 0 || !currentStep.showPrev}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep.showSkip && (
                      <Button variant="ghost" size="sm" onClick={stopTour}>
                        Skip Tour
                      </Button>
                    )}
                    
                    {currentStep.showNext && (
                      <Button size="sm" onClick={nextStep}>
                        {isLastStep ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Finish
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Paused state */}
      {state.isActive && state.isPaused && (
        <div className="fixed top-4 right-4 z-1000 bg-white rounded-lg shadow-lg border p-4">
          <div className="flex items-center gap-3">
            <Pause className="h-5 w-5 text-orange-500" />
            <div>
              <div className="font-medium text-sm">Tour Paused</div>
              <div className="text-xs text-gray-500">Click to resume</div>
            </div>
            <Button size="sm" onClick={pauseTour}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// Available tours menu
export function AvailableToursMenu({ userId, userRole, className = '' }: {
  userId: string
  userRole: UserRole
  className?: string
}) {
  const [tours, setTours] = useState<Tour[]>([])
  const [activeTour, setActiveTour] = useState<string | null>(null)

  useEffect(() => {
    const availableTours = helpSystem.getTours(userRole)
    setTours(availableTours)
  }, [userRole])

  const startTour = (tourId: string) => {
    setActiveTour(tourId)
  }

  const completeTour = (tourId: string) => {
    setActiveTour(null)
    // Refresh tours list to reflect completion
    const availableTours = helpSystem.getTours(userRole)
    setTours(availableTours)
  }

  if (tours.length === 0) return null

  return (
    <div className={className}>
      {tours.map((tour) => (
        <div key={tour.id} className="mb-4">
          <InteractiveTour
            tour={tour}
            userId={userId}
            userRole={userRole}
            onComplete={completeTour}
            className="w-full"
          />
          
          {activeTour === tour.id && (
            <InteractiveTour
              tour={tour}
              userId={userId}
              userRole={userRole}
              onComplete={completeTour}
              autoStart={true}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Page-specific contextual help provider
export function PageContextualHelp({ _userId, userRole, currentPath }: {
  userId: string
  userRole: UserRole
  currentPath: string
}) {
  const [contextHelp, setContextHelp] = useState<ContextHelp[]>([])

  useEffect(() => {
    const helps = helpSystem.getContextHelp(currentPath, userRole)
    setContextHelp(helps)
  }, [currentPath, userRole])

  useEffect(() => {
    // Add help triggers to matching elements
    contextHelp.forEach(help => {
      if (help.element) {
        const elements = document.querySelectorAll(help.element)
        elements.forEach(_element => {
          // Add help trigger based on type and trigger
          if (help.trigger === 'auto' && help.type === 'tooltip') {
            // Auto-show tooltip once
            setTimeout(() => {
              // Implementation would show tooltip automatically
            }, 1000)
          }
        })
      }
    })
  }, [contextHelp])

  return null // This component works by adding help to existing elements
}