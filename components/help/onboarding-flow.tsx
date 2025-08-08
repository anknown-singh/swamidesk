'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Clock,
  Star,
  Award,
  BookOpen,
  Target,
  AlertCircle,
  Lightbulb,
  Video,
  FileText,
  MousePointer,
  Eye,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import {
  helpSystem,
  type OnboardingFlow,
  type OnboardingStep,
  type UserProgress,
  UserRole
} from '@/lib/help/help-system'

interface OnboardingFlowProps {
  userId: string
  userRole: UserRole
  onComplete?: (flowId: string) => void
  onSkip?: () => void
  autoStart?: boolean
  className?: string
}

interface OnboardingState {
  flow: OnboardingFlow | null
  currentStepIndex: number
  stepProgress: Record<string, boolean>
  isActive: boolean
  showWelcome: boolean
  estimatedTimeRemaining: number
}

export function OnboardingFlowComponent({
  userId,
  userRole,
  onComplete,
  onSkip,
  autoStart = false,
  className = ''
}: OnboardingFlowProps) {
  const [state, setState] = useState<OnboardingState>({
    flow: null,
    currentStepIndex: 0,
    stepProgress: {},
    isActive: false,
    showWelcome: true,
    estimatedTimeRemaining: 0
  })

  const [// userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const targetElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Check if user should see onboarding
    if (helpSystem.shouldShowOnboarding(userId, userRole)) {
      const flow = helpSystem.getOnboardingFlow(userRole)
      const progress = helpSystem.getUserProgress(userId)
      
      if (flow) {
        setState(prev => ({
          ...prev,
          flow,
          estimatedTimeRemaining: flow.estimatedDuration * 60, // Convert to seconds
          isActive: autoStart
        }))
        setUserProgress(progress)
      }
    }
  }, [userId, userRole, autoStart])

  // Update estimated time remaining
  useEffect(() => {
    if (state.isActive && state.flow) {
      const currentStep = state.flow.steps[state.currentStepIndex]
      if (currentStep?.estimatedTime) {
        const timer = setInterval(() => {
          setState(prev => ({
            ...prev,
            estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - 1)
          }))
        }, 1000)

        return () => clearInterval(timer)
      }
    }
  }, [state.isActive, state.currentStepIndex, state.flow])

  const startOnboarding = () => {
    setState(prev => ({
      ...prev,
      isActive: true,
      showWelcome: false,
      currentStepIndex: 0
    }))
  }

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      showWelcome: false
    }))
    onSkip?.()
  }

  const nextStep = () => {
    if (!state.flow) return

    const currentStep = state.flow.steps[state.currentStepIndex]
    
    // Mark current step as completed
    setState(prev => ({
      ...prev,
      stepProgress: {
        ...prev.stepProgress,
        [currentStep.id]: true
      }
    }))

    // Move to next step or complete
    if (state.currentStepIndex < state.flow.steps.length - 1) {
      setState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1
      }))
      
      // Focus on target element if specified
      const nextStep = state.flow.steps[state.currentStepIndex + 1]
      if (nextStep.targetElement) {
        focusTargetElement(nextStep.targetElement)
      }
    } else {
      completeOnboarding()
    }
  }

  const previousStep = () => {
    if (state.currentStepIndex > 0) {
      setState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1
      }))
    }
  }

  const completeOnboarding = () => {
    if (!state.flow) return

    // Track completion
    helpSystem.trackProgress(userId, 'complete_onboarding', state.flow.id)
    
    setState(prev => ({
      ...prev,
      isActive: false,
      showWelcome: false
    }))

    onComplete?.(state.flow.id)
  }

  const focusTargetElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      targetElementRef.current = element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Add highlight effect
      element.style.position = 'relative'
      element.style.zIndex = '1001'
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)'
      element.style.borderRadius = '8px'
    }
  }

  const // clearTargetHighlight = () => {
    if (targetElementRef.current) {
      const element = targetElementRef.current
      element.style.position = ''
      element.style.zIndex = ''
      element.style.boxShadow = ''
      element.style.borderRadius = ''
      targetElementRef.current = null
    }
  }

  const getStepIcon = (step: OnboardingStep, isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return <Check className="h-4 w-4 text-green-500" />
    }

    switch (step.type) {
      case 'tour':
        return <Eye className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      case 'action':
        return <MousePointer className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      case 'form':
        return <FileText className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      case 'video':
        return <Video className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      case 'reading':
        return <BookOpen className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      default:
        return <Target className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompletedStepsCount = () => {
    return Object.values(state.stepProgress).filter(Boolean).length
  }

  const getProgressPercentage = () => {
    if (!state.flow) return 0
    return Math.round((getCompletedStepsCount() / state.flow.steps.length) * 100)
  }

  if (!state.flow) return null

  const currentStep = state.flow.steps[state.currentStepIndex]
  const isLastStep = state.currentStepIndex === state.flow.steps.length - 1

  // Welcome dialog
  if (state.showWelcome && !state.isActive) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && skipOnboarding()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Welcome to SwamIDesk!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Let's get you started with a quick tour
              </h3>
              <p className="text-gray-600">
                {state.flow.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="font-medium">{state.flow.estimatedDuration} minutes</div>
                <div className="text-sm text-gray-600">Estimated time</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="font-medium">{state.flow.steps.length} steps</div>
                <div className="text-sm text-gray-600">Interactive lessons</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="font-medium">Badges</div>
                <div className="text-sm text-gray-600">Earn rewards</div>
              </div>
            </div>

            {/* Prerequisites */}
            {state.flow.prerequisites && state.flow.prerequisites.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Before we start:</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {state.flow.prerequisites.map((prereq, index) => (
                    <li key={index}>• {prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What you'll learn */}
            <div className="space-y-3">
              <h4 className="font-medium">What you'll learn:</h4>
              <div className="space-y-2">
                {state.flow.steps.slice(0, 4).map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step.title}</span>
                  </div>
                ))}
                {state.flow.steps.length > 4 && (
                  <div className="text-sm text-gray-500 ml-9">
                    +{state.flow.steps.length - 4} more steps...
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={skipOnboarding} variant="outline" className="flex-1">
                Skip for now
              </Button>
              <Button onClick={startOnboarding} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Tour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Active onboarding overlay
  if (state.isActive && currentStep) {
    return (
      <>
        {/* Overlay backdrop */}
        <div 
          ref={overlayRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-1000"
          style={{ zIndex: 1000 }}
        />
        
        {/* Onboarding step modal */}
        <div 
          className="fixed z-1001 bg-white rounded-lg shadow-2xl border max-w-md"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getStepIcon(currentStep, false, true)}
                <span className="text-sm font-medium text-gray-600">
                  Step {state.currentStepIndex + 1} of {state.flow.steps.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {currentStep.estimatedTime && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil(currentStep.estimatedTime / 60)}m
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipOnboarding}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <Progress value={getProgressPercentage()} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{getCompletedStepsCount()} completed</span>
                <span>{getProgressPercentage()}% done</span>
              </div>
            </div>

            {/* Step content */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{currentStep.title}</h3>
                <p className="text-gray-600 text-sm">{currentStep.description}</p>
              </div>

              {/* Step-specific content */}
              {currentStep.type === 'reading' && currentStep.content && (
                <ScrollArea className="h-40 p-4 bg-gray-50 rounded border">
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentStep.content.replace(/\n/g, '<br />') }} />
                  </div>
                </ScrollArea>
              )}

              {currentStep.type === 'action' && currentStep.action && (
                <Alert>
                  <MousePointer className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action required:</strong> {currentStep.action.description}
                  </AlertDescription>
                </Alert>
              )}

              {currentStep.type === 'form' && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Complete the form to continue to the next step.
                  </AlertDescription>
                </Alert>
              )}

              {currentStep.optional && (
                <div className="text-xs text-gray-500 italic">
                  This step is optional and can be skipped.
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={state.currentStepIndex === 0}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {currentStep.optional && (
                  <Button variant="ghost" onClick={nextStep}>
                    Skip
                  </Button>
                )}
                
                <Button onClick={nextStep} className="flex items-center gap-1">
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Time remaining */}
            {state.estimatedTimeRemaining > 0 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Estimated time remaining: {formatTime(state.estimatedTimeRemaining)}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return null
}

// Onboarding progress indicator for dashboard
export function OnboardingProgress({ userId, userRole, className = '' }: {
  userId: string
  userRole: UserRole
  className?: string
}) {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [recommendations, setRecommendations] = useState<any>(null)

  useEffect(() => {
    const userProgress = helpSystem.getUserProgress(userId)
    const recommended = helpSystem.getRecommendedContent(userId, userRole)
    
    setProgress(userProgress)
    setRecommendations(recommended)
  }, [userId, userRole])

  if (!recommendations?.onboarding && (!progress || progress.progressScore >= 100)) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Getting Started
        </CardTitle>
        <CardDescription>
          Complete your onboarding to unlock all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progress.progressScore}%</span>
            </div>
            <Progress value={progress.progressScore} className="h-2" />
          </div>
        )}

        {recommendations?.onboarding && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-900">Continue Onboarding</span>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              {recommendations.onboarding.description}
            </p>
            <OnboardingFlowComponent
              userId={userId}
              userRole={userRole}
              onComplete={() => {
                // Refresh progress
                const newProgress = helpSystem.getUserProgress(userId)
                setProgress(newProgress)
              }}
            />
          </div>
        )}

        {progress?.badges && progress.badges.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Your Badges</h4>
            <div className="flex flex-wrap gap-1">
              {progress.badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  {badge.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}