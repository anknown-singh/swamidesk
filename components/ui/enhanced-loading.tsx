'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export function LoadingOverlay({ isLoading, children, loadingText = 'Loading...', className = '' }: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface SkeletonCardProps {
  showHeader?: boolean
  headerLines?: number
  contentLines?: number
  className?: string
}

export function SkeletonCard({ 
  showHeader = true, 
  headerLines = 1, 
  contentLines = 3, 
  className = '' 
}: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="space-y-2">
          {Array.from({ length: headerLines }).map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
          ))}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

interface MetricCardSkeletonProps {
  className?: string
}

export function MetricCardSkeleton({ className = '' }: MetricCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

interface DashboardSkeletonProps {
  className?: string
}

export function DashboardSkeleton({ className = '' }: DashboardSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} contentLines={4} />
        ))}
      </div>
    </div>
  )
}

interface TableSkeletonProps {
  columns: number
  rows: number
  showHeader?: boolean
  className?: string
}

export function TableSkeleton({ 
  columns, 
  rows, 
  showHeader = true, 
  className = '' 
}: TableSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface ProgressiveLoadingProps {
  isLoading: boolean
  hasData: boolean
  children: React.ReactNode
  fallback: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
}

export function ProgressiveLoading({
  isLoading,
  hasData,
  children,
  fallback,
  emptyState,
  className = ''
}: ProgressiveLoadingProps) {
  if (isLoading) {
    return <div className={className}>{fallback}</div>
  }

  if (!hasData && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return <div className={className}>{children}</div>
}

interface RefreshButtonProps {
  onRefresh: () => void
  isRefreshing?: boolean
  disabled?: boolean
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  className?: string
}

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  disabled = false,
  children = 'Refresh',
  size = 'md',
  variant = 'outline',
  className = ''
}: RefreshButtonProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100',
    outline: 'border border-gray-300 hover:bg-gray-50'
  }

  return (
    <button
      onClick={onRefresh}
      disabled={disabled || isRefreshing}
      className={`
        inline-flex items-center gap-2 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {children}
    </button>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action && action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onRetry && (
        <RefreshButton onRefresh={onRetry} variant="default">
          Try Again
        </RefreshButton>
      )}
    </div>
  )
}

// Lazy loading component wrapper
interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}

export function LazyLoad({
  children,
  fallback = <LoadingSpinner />,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}: LazyLoadProps) {
  const [isInView, setIsInView] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsInView(true)
          setIsLoaded(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, isLoaded])

  return (
    <div ref={elementRef} className={className}>
      {isInView ? children : fallback}
    </div>
  )
}