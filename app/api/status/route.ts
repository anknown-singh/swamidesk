import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic status endpoint for quick uptime checks
    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.3.2',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        platform: process.env.VERCEL ? 'vercel' : 'other',
        region: process.env.VERCEL_REGION || 'unknown'
      }
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}