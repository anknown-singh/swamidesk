'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveWrapperProps {
  children: React.ReactNode
  mobileComponent?: React.ComponentType<any>
  mobileProps?: any
  breakpoint?: number
}

export function ResponsiveWrapper({ 
  children, 
  mobileComponent: MobileComponent, 
  mobileProps = {},
  breakpoint = 1024 
}: ResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (isMobile && MobileComponent) {
    return <MobileComponent {...mobileProps} />
  }

  return <>{children}</>
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  const gapClass = `gap-${gap}`
  
  return (
    <div className={cn(
      'grid',
      cols.mobile && `${gridCols[cols.mobile as keyof typeof gridCols]}`,
      cols.tablet && `sm:${gridCols[cols.tablet as keyof typeof gridCols]}`,
      cols.desktop && `lg:${gridCols[cols.desktop as keyof typeof gridCols]}`,
      gapClass,
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl'
  padding?: boolean
  className?: string
}

export function ResponsiveContainer({ 
  children, 
  maxWidth = 'lg',
  padding = true,
  className 
}: ResponsiveContainerProps) {
  const widthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-4xl',
    'xl': 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '7xl': 'max-w-7xl'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      widthClasses[maxWidth],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  direction?: {
    mobile?: 'row' | 'col'
    desktop?: 'row' | 'col'  
  }
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: number
  className?: string
}

export function ResponsiveStack({
  children,
  direction = { mobile: 'col', desktop: 'row' },
  align = 'stretch',
  justify = 'start',
  gap = 4,
  className
}: ResponsiveStackProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center', 
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end', 
    between: 'justify-between',
    around: 'justify-around'
  }

  return (
    <div className={cn(
      'flex',
      direction.mobile && directionClasses[direction.mobile],
      direction.desktop && `lg:${directionClasses[direction.desktop]}`,
      alignClasses[align],
      justifyClasses[justify],
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}

export function useResponsive(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return { isMobile, mounted }
}