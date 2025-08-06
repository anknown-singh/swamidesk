import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    )

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Missing environment variables',
          missing: missingEnvVars,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    // Test database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    const dbStatus = dbError ? 'disconnected' : 'connected'

    // Check application version
    const version = process.env.npm_package_version || '1.3.2'

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        connection: !dbError
      },
      services: {
        supabase: !dbError,
        nextjs: true,
        vercel: !!process.env.VERCEL
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
      }
    }

    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  // Simple HEAD request for basic uptime monitoring
  return new NextResponse(null, { status: 200 })
}