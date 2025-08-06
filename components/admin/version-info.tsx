'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Calendar, ExternalLink } from 'lucide-react'

export function VersionInfo() {
  // In a real app, this would come from an API or environment variables
  const versionInfo = {
    version: require('../../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    buildDate: new Date().toLocaleDateString(),
    repository: 'https://github.com/yourusername/swamidesk',
    deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swamidesk.vercel.app'
  }

  const getEnvironmentBadgeColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-green-500'
      case 'development': return 'bg-blue-500'
      case 'staging': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          System Information
        </CardTitle>
        <CardDescription>
          Current version and deployment details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Version</span>
              <Badge variant="outline" className="font-mono">
                v{versionInfo.version}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Environment</span>
              <Badge className={`${getEnvironmentBadgeColor(versionInfo.environment)} text-white`}>
                {versionInfo.environment}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Build Date</span>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                {versionInfo.buildDate}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Repository</span>
              <a 
                href={versionInfo.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                GitHub
              </a>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Live URL</span>
              <a 
                href={versionInfo.deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3" />
                Production
              </a>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Release System</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✅ Active
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-muted-foreground">
            Automated releases via Release Please + Vercel deployment
          </p>
        </div>
      </CardContent>
    </Card>
  )
}