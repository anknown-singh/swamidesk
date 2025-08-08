'use client'

import { useState, useEffect } from 'react'
import { MobileNav } from './mobile-nav'
import { MobileBottomNav } from './mobile-bottom-nav'
import { cn } from '@/lib/utils'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileDashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  onRefresh?: () => void
  refreshing?: boolean
}

export function MobileDashboardLayout({
  children,
  title,
  subtitle,
  actions,
  onRefresh,
  refreshing = false
}: MobileDashboardLayoutProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [touchStart, setTouchStart] = useState(0)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && onRefresh) {
      setTouchStart(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart > 0 && window.scrollY === 0) {
      const touchY = e.touches[0].clientY
      const pullDistance = touchY - touchStart

      if (pullDistance > 100) {
        setPullToRefresh(true)
      } else {
        setPullToRefresh(false)
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefresh && onRefresh) {
      onRefresh()
      setPullToRefresh(false)
    }
    setTouchStart(0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Connection Status */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-30">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>No internet connection</span>
          </div>
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      {pullToRefresh && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm z-30">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Release to refresh</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        <div 
          className={cn(
            "p-4 pt-16 lg:pt-8",
            !isOnline && "pt-20 lg:pt-12"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          {(title || actions) && (
            <div className="mb-6 space-y-2">
              {title && (
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm lg:text-base text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
              
              {actions && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {onRefresh && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="lg:hidden"
                      >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                      </Button>
                    )}
                  </div>
                  <div className="hidden lg:flex items-center gap-2">
                    {actions}
                  </div>
                </div>
              )}

              {/* Mobile Actions */}
              <div className="lg:hidden">
                {actions}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-4 lg:space-y-6">
            {children}
          </div>

          {/* Bottom Padding for Mobile */}
          <div className="h-20 lg:h-8" />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Mobile Bottom Spacer */}
      <div className="lg:hidden h-16" />
    </div>
  )
}

interface MobileGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

export function MobileGrid({ children, columns = 2, className }: MobileGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[columns],
      className
    )}>
      {children}
    </div>
  )
}

interface MobileStatsGridProps {
  children: React.ReactNode
  className?: string
}

export function MobileStatsGrid({ children, className }: MobileStatsGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4',
      className
    )}>
      {children}
    </div>
  )
}

interface MobileContentProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  className?: string
}

export function MobileContent({ children, sidebar, className }: MobileContentProps) {
  return (
    <div className={cn(
      'flex flex-col lg:flex-row gap-4 lg:gap-6',
      className
    )}>
      <div className="flex-1 space-y-4 lg:space-y-6">
        {children}
      </div>
      {sidebar && (
        <div className="lg:w-80 space-y-4 lg:space-y-6">
          {sidebar}
        </div>
      )}
    </div>
  )
}

export function MobileSection({ 
  title, 
  children, 
  className 
}: { 
  title?: string
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("space-y-3 lg:space-y-4", className)}>
      {title && (
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}