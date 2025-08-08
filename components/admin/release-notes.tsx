'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GitBranch, 
  Calendar, 
  Star, 
  Bug, 
  Zap, 
  Shield, 
  Wrench, 
  FileText, 
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import packageJson from '../../package.json'

interface ReleaseNote {
  version: string
  date: string
  type: 'major' | 'minor' | 'patch'
  status: 'latest' | 'stable' | 'archived'
  features: string[]
  improvements: string[]
  bugFixes: string[]
  security?: string[]
  breaking?: string[]
  documentation?: string[]
}

// This would typically come from a database or API
const releaseNotes: ReleaseNote[] = [
  {
    version: '1.7.0',
    date: '2024-12-XX',
    type: 'minor',
    status: 'latest',
    features: [
      'Added Help & Documentation sections to all role dashboards',
      'Integrated comprehensive documentation navigation in sidebar',
      'Role-specific documentation and release notes access',
      'Context-sensitive help guides for each user role'
    ],
    improvements: [
      'Enhanced dashboard user experience with documentation access',
      'Improved navigation with BookOpen icons and external link indicators',
      'Better onboarding experience for new users',
      'Consistent UI patterns across all role dashboards'
    ],
    bugFixes: [
      'Fixed all ESLint warnings and TypeScript compilation errors',
      'Resolved unused import and variable warnings across components',
      'Fixed unescaped HTML entities in JSX components',
      'Replaced explicit "any" types with proper TypeScript interfaces'
    ],
    security: [
      'Improved type safety throughout the application',
      'Enhanced code quality standards'
    ],
    documentation: [
      'Added comprehensive release notes component',
      'Updated user guides for all roles',
      'Enhanced system documentation with version tracking'
    ]
  },
  {
    version: '1.6.0',
    date: '2024-12-XX',
    type: 'minor',
    status: 'stable',
    features: [
      'OPD (Outpatient Department) management system - foundational components',
      'Diagnosis-based procedure quoting with admin approval workflow',
      'Integrated billing framework with consultation fees',
      'Patient journey workflow automation - core routing logic'
    ],
    improvements: [
      'Enhanced patient tracking across departments with real-time updates',
      'Custom pricing workflow with admin approval process',
      'Streamlined consultation and diagnosis workflow',
      'Better admin oversight dashboard for procedure pricing'
    ],
    bugFixes: [
      'Fixed patient status updates in workflow',
      'Resolved billing calculation edge cases',
      'Improved error handling in OPD records'
    ],
    documentation: [
      'Added OPD management guides',
      'Updated patient journey documentation',
      'Enhanced billing system documentation'
    ]
  },
  {
    version: '1.5.0',
    date: '2024-11-XX',
    type: 'minor',
    status: 'stable',
    features: [
      'Role-based dashboard system with foundational architecture',
      'Admin analytics dashboard with basic reporting',
      'Doctor consultation management interface for OPD workflow',
      'Receptionist patient registration and appointment queue management',
      'Service attendant dashboard with basic procedure tracking',
      'Pharmacy dashboard with prescription viewing and basic inventory'
    ],
    improvements: [
      'Responsive dashboard layouts',
      'Real-time data updates',
      'Improved user experience across all roles',
      'Enhanced navigation and accessibility'
    ],
    bugFixes: [
      'Fixed authentication state management',
      'Resolved dashboard loading issues',
      'Improved error handling in data fetching'
    ]
  }
]

export function ReleaseNotes() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['1.7.0']))

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(version)) {
      newExpanded.delete(version)
    } else {
      newExpanded.add(version)
    }
    setExpandedVersions(newExpanded)
  }

  const getVersionBadgeColor = (type: string, status: string) => {
    if (status === 'latest') return 'bg-green-500 text-white'
    if (type === 'major') return 'bg-red-100 text-red-800'
    if (type === 'minor') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'latest':
        return <Badge className="bg-green-500 text-white">Latest</Badge>
      case 'stable':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Stable</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      default:
        return null
    }
  }

  const renderChangeList = (changes: string[], icon: React.ReactNode, title: string, colorClass: string) => {
    if (!changes.length) return null
    
    return (
      <div className="space-y-2">
        <h4 className={`flex items-center gap-2 font-medium ${colorClass}`}>
          {icon}
          {title}
        </h4>
        <ul className="space-y-1">
          {changes.map((change, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
              {change}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Release Notes
            </CardTitle>
            <CardDescription>
              Version history and changelog for SwamIDesk v{packageJson.version}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              Current: v{packageJson.version}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/yourusername/swamidesk/releases', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              All Releases
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recent Updates</TabsTrigger>
            <TabsTrigger value="all">All Versions</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            <div className="space-y-4">
              {releaseNotes.slice(0, 2).map((release) => (
                <Card key={release.version} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getVersionBadgeColor(release.type, release.status)}>
                            v{release.version}
                          </Badge>
                          {getStatusBadge(release.status)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {release.date}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVersion(release.version)}
                      >
                        {expandedVersions.has(release.version) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {expandedVersions.has(release.version) && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {renderChangeList(
                          release.features, 
                          <Star className="h-4 w-4" />, 
                          'New Features', 
                          'text-green-700'
                        )}
                        
                        {renderChangeList(
                          release.improvements, 
                          <Zap className="h-4 w-4" />, 
                          'Improvements', 
                          'text-blue-700'
                        )}
                        
                        {renderChangeList(
                          release.bugFixes, 
                          <Bug className="h-4 w-4" />, 
                          'Bug Fixes', 
                          'text-orange-700'
                        )}
                        
                        {release.security && renderChangeList(
                          release.security, 
                          <Shield className="h-4 w-4" />, 
                          'Security Updates', 
                          'text-red-700'
                        )}
                        
                        {release.breaking && renderChangeList(
                          release.breaking, 
                          <Wrench className="h-4 w-4" />, 
                          'Breaking Changes', 
                          'text-red-700'
                        )}
                        
                        {release.documentation && renderChangeList(
                          release.documentation, 
                          <FileText className="h-4 w-4" />, 
                          'Documentation', 
                          'text-purple-700'
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <div className="space-y-3">
              {releaseNotes.map((release) => (
                <Card key={release.version} className={`${release.status === 'latest' ? 'border-green-200 bg-green-50/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getVersionBadgeColor(release.type, release.status)}>
                          v{release.version}
                        </Badge>
                        {getStatusBadge(release.status)}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {release.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{release.features.length + release.improvements.length + release.bugFixes.length} changes</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVersion(release.version)}
                        >
                          {expandedVersions.has(release.version) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {expandedVersions.has(release.version) && (
                      <div className="mt-4 space-y-4">
                        {renderChangeList(
                          release.features, 
                          <Star className="h-4 w-4" />, 
                          'New Features', 
                          'text-green-700'
                        )}
                        
                        {renderChangeList(
                          release.improvements, 
                          <Zap className="h-4 w-4" />, 
                          'Improvements', 
                          'text-blue-700'
                        )}
                        
                        {renderChangeList(
                          release.bugFixes, 
                          <Bug className="h-4 w-4" />, 
                          'Bug Fixes', 
                          'text-orange-700'
                        )}
                        
                        {release.security && renderChangeList(
                          release.security, 
                          <Shield className="h-4 w-4" />, 
                          'Security Updates', 
                          'text-red-700'
                        )}
                        
                        {release.breaking && renderChangeList(
                          release.breaking, 
                          <Wrench className="h-4 w-4" />, 
                          'Breaking Changes', 
                          'text-red-700'
                        )}
                        
                        {release.documentation && renderChangeList(
                          release.documentation, 
                          <FileText className="h-4 w-4" />, 
                          'Documentation', 
                          'text-purple-700'
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="roadmap" className="space-y-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">📊 Current Implementation Status</CardTitle>
                <CardDescription className="text-blue-700">
                  Honest assessment as of version {packageJson.version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">✅ Completed (70%)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Patient registration & search (100%)</li>
                      <li>• Appointment booking & queue (100%)</li>
                      <li>• Doctor consultation workflow (95%)</li>
                      <li>• Admin approval system (85%)</li>
                      <li>• Billing framework (80%)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">🔧 Needs Completion (30%)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Procedure execution workflow (60%)</li>
                      <li>• Medicine dispensing logic (40%)</li>
                      <li>• Inventory integration (30%)</li>
                      <li>• End-to-end billing completion</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-900">🚨 Critical Completion Priority</CardTitle>
                  <CardDescription className="text-red-700">
                    Essential items needed for end-to-end workflow functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-l-red-500 pl-4">
                      <h4 className="font-medium text-red-800">v1.7.1 - Core Workflow Completion (Immediate)</h4>
                      <ul className="text-sm text-red-700 space-y-1 mt-2">
                        <li>🔴 Complete medicine dispensing logic in pharmacy workflow</li>
                        <li>🔴 Fix procedure execution workflow for service attendants</li>
                        <li>🔴 Integrate inventory system with prescription dispensing</li>
                        <li>🔴 Enable end-to-end billing with procedure and medicine costs</li>
                      </ul>
                      <div className="mt-2 text-xs text-red-600 italic">
                        Status: 60 hours estimated • Blocks complete patient journey
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Future Enhancements</CardTitle>
                  <CardDescription>
                    Features planned after core workflow completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-l-yellow-300 pl-4">
                      <h4 className="font-medium text-yellow-700">v1.8.0 - Polish & Testing</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                        <li>• End-to-end testing and bug fixes</li>
                        <li>• Complete settings pages for all roles</li>
                        <li>• Enhanced error handling and validation</li>
                        <li>• Performance optimization</li>
                      </ul>
                    </div>
                    
                    <div className="border-l-4 border-l-blue-300 pl-4">
                      <h4 className="font-medium text-blue-700">v1.9.0 - Enhanced Analytics</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                        <li>• Advanced reporting dashboards</li>
                        <li>• Patient analytics and insights</li>
                        <li>• Revenue forecasting</li>
                        <li>• Performance metrics tracking</li>
                      </ul>
                    </div>
                    
                    <div className="border-l-4 border-l-purple-300 pl-4">
                      <h4 className="font-medium text-purple-700">v2.0.0 - Mobile & Integrations</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                        <li>• Progressive Web App (PWA) support</li>
                        <li>• Mobile-first responsive design</li>
                        <li>• Public API for third-party integrations</li>
                        <li>• Laboratory system integration</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}