'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorInfo {
  componentStack: string
  errorBoundary: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  resetError: () => void
  errorId: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.prototype.generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    }

    this.setState({
      errorInfo: enhancedErrorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error ID:', this.state.errorId)
      console.groupEnd()
    }

    // Report error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, enhancedErrorInfo, this.state.errorId)
    }

    // Call custom error handler
    this.props.onError?.(error, enhancedErrorInfo)
  }

  generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // In a real application, you would send this to an error tracking service
    // like Sentry, Bugsnag, or your own logging service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Example: Send to error tracking service
    // errorTrackingService.reportError(errorReport)
    
    console.error('Error Report:', errorReport)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, errorInfo, resetError, errorId }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const copyErrorDetails = () => {
    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard'))
      .catch(() => console.error('Failed to copy error details'))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while loading this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error ID for support */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Error ID</div>
            <code className="text-xs font-mono text-gray-600 break-all">{errorId}</code>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleReload} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Development info */}
          {isDevelopment && (
            <details className="bg-red-50 rounded-lg">
              <summary className="p-4 cursor-pointer text-sm font-medium text-red-700 flex items-center">
                <Bug className="h-4 w-4 mr-2" />
                Development Error Details
              </summary>
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">Error Message</div>
                  <code className="text-xs bg-white p-2 rounded border block">
                    {error.message}
                  </code>
                </div>
                
                {error.stack && (
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-1">Stack Trace</div>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}
                
                {errorInfo?.componentStack && (
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-1">Component Stack</div>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <Button size="sm" variant="outline" onClick={copyErrorDetails}>
                  Copy Error Details
                </Button>
              </div>
            </details>
          )}

          {/* Production support info */}
          {!isDevelopment && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-700 mb-2">Need help?</div>
              <div className="text-sm text-blue-600 space-y-1">
                <p>Please contact support with the Error ID above.</p>
                <p>Email: support@swamidesk.com</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyErrorDetails} className="mt-3">
                Copy Error Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Lightweight error boundary for isolated components
interface AsyncErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<Pick<ErrorFallbackProps, 'resetError'>>
  onError?: (error: Error) => void
}

export function AsyncErrorBoundary({ children, fallback: Fallback, onError }: AsyncErrorBoundaryProps) {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error) {
      console.error('AsyncErrorBoundary caught error:', error)
      onError?.(error)
    }
  }, [error, onError])

  if (error) {
    if (Fallback) {
      return <Fallback resetError={resetError} />
    }
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700">Error loading component</div>
            <div className="text-sm text-red-600">{error.message}</div>
          </div>
          <Button size="sm" variant="outline" onClick={resetError}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  )
}

// Hook for handling async errors in components
export function useAsyncError() {
  const [, setError] = React.useState()

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error
      })
    },
    []
  )
}

// HOC for adding error boundary to any component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export { ErrorBoundary }
export type { ErrorBoundaryProps, ErrorFallbackProps }