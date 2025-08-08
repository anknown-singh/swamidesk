'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeftIcon, 
  AlertTriangleIcon,
  ClockIcon,
  CreditCardIcon,
  SettingsIcon,
  BarChart3Icon,
  FileTextIcon,
  ZapIcon
} from 'lucide-react'

interface TodoItem {
  id: string
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'core-workflow' | 'polish' | 'enhancement' | 'documentation'
  impact: string
  description: string
  tasks: string[]
  blockers?: string[]
  estimatedHours: number
  dependsOn?: string[]
}

export default function TodoPage() {
  const todos: TodoItem[] = [
    {
      id: 'medicine-dispensing',
      title: 'Complete Medicine Dispensing Logic',
      priority: 'critical',
      category: 'core-workflow',
      impact: 'Blocks end-to-end patient billing workflow',
      description: 'Implement actual medicine dispensing workflow in pharmacy dashboard with inventory integration',
      tasks: [
        'Create medicine dispensing interface for pharmacist',
        'Implement prescription-to-inventory linking logic',
        'Add automatic stock deduction when medicines are dispensed',  
        'Calculate medicine costs for billing integration',
        'Handle out-of-stock scenarios and alternatives',
        'Add dispensing confirmation and patient counseling workflow'
      ],
      blockers: ['Pharmacy workflow incomplete', 'Medicine costs not calculated for billing'],
      estimatedHours: 24,
      dependsOn: ['inventory-integration']
    },
    {
      id: 'procedure-execution',
      title: 'Fix Procedure Execution Workflow',
      priority: 'critical', 
      category: 'core-workflow',
      impact: 'Service attendants cannot complete procedures, blocking billing',
      description: 'Complete service attendant interface for procedure execution and tracking',
      tasks: [
        'Add procedure execution interface for service attendants',
        'Implement procedure completion tracking and status updates', 
        'Add time/duration logging for completed procedures',
        'Create procedure-to-billing integration',
        'Add procedure notes and outcome documentation',
        'Implement priority-based procedure queue management'
      ],
      blockers: ['Cannot mark procedures as completed', 'Procedures not flowing to billing'],
      estimatedHours: 20
    },
    {
      id: 'inventory-integration',  
      title: 'Inventory System Integration',
      priority: 'critical',
      category: 'core-workflow', 
      impact: 'Required for accurate medicine dispensing and billing',
      description: 'Connect medicine inventory to prescription system with real-time tracking',
      tasks: [
        'Connect medicine inventory to prescription system',
        'Implement real-time stock checking during prescription creation',
        'Add automatic stock alerts and reorder point management',
        'Create medicine expiry date tracking and alerts',
        'Add medicine batch tracking for traceability',
        'Implement stock adjustment and audit trail'
      ],
      blockers: ['Critical for pharmacy workflow'],
      estimatedHours: 16
    },
    {
      id: 'end-to-end-testing',
      title: 'End-to-End Testing & Bug Fixes', 
      priority: 'high',
      category: 'core-workflow',
      impact: 'Ensures complete patient journey works without issues',
      description: 'Test complete patient workflow and fix integration issues',
      tasks: [
        'Test complete patient journey from registration to payment',
        'Fix integration issues between modules',
        'Resolve workflow routing bugs',
        'Add error handling for edge cases',
        'Performance optimization for database queries',
        'Add proper loading states and error messages'
      ],
      estimatedHours: 12,
      dependsOn: ['medicine-dispensing', 'procedure-execution']
    },
    {
      id: 'settings-pages',
      title: 'Settings Pages Implementation',
      priority: 'high', 
      category: 'polish',
      impact: 'Complete user role management and system configuration',
      description: 'Replace placeholder settings pages for all user roles with functional interfaces',
      tasks: [
        'Complete admin settings page with system configuration',
        'Add doctor settings for consultation preferences',
        'Implement receptionist settings for queue management',
        'Create attendant settings for procedure preferences',
        'Add pharmacist settings for inventory management', 
        'Implement user profile management for all roles'
      ],
      estimatedHours: 18
    },
    {
      id: 'billing-completion',
      title: 'Complete Billing Integration',
      priority: 'high',
      category: 'core-workflow',
      impact: 'Ensures accurate billing for all services',
      description: 'Complete billing system integration with all service types',
      tasks: [
        'Integrate completed procedure costs into billing',
        'Add dispensed medicine costs to invoice generation',
        'Implement consultation fee variations based on complexity',
        'Add billing history and payment tracking',
        'Create invoice templates for different service types',
        'Add payment method-specific processing logic'
      ],
      estimatedHours: 14,
      dependsOn: ['medicine-dispensing', 'procedure-execution']
    },
    {
      id: 'admin-features',
      title: 'Complete Admin Analytics & Reporting',
      priority: 'medium',
      category: 'enhancement', 
      impact: 'Enhanced business intelligence and management oversight',
      description: 'Implement advanced analytics and reporting features',
      tasks: [
        'Add revenue analytics and forecasting',
        'Implement patient flow analytics',
        'Create department performance reports',
        'Add inventory analytics and reorder recommendations',
        'Implement staff productivity tracking',
        'Add customizable dashboard widgets'
      ],
      estimatedHours: 24
    },
    {
      id: 'export-functionality',
      title: 'Export & Backup Functionality',
      priority: 'medium',
      category: 'enhancement',
      impact: 'Data portability and backup capabilities',
      description: 'Add export functionality for reports and data backup',
      tasks: [
        'Implement PDF export for reports and invoices',
        'Add Excel/CSV export for analytics data',
        'Create automated backup system',
        'Add data migration tools',
        'Implement audit log export',
        'Add patient record export for referrals'
      ],
      estimatedHours: 16
    },
    {
      id: 'mobile-optimization',
      title: 'Mobile Responsive Optimization',
      priority: 'medium',
      category: 'polish',
      impact: 'Better user experience on mobile devices',
      description: 'Optimize interface for mobile and tablet usage',
      tasks: [
        'Optimize dashboard layouts for mobile screens',
        'Add touch-friendly interface elements',
        'Implement mobile-specific navigation patterns',
        'Add offline capability for critical functions',
        'Optimize performance for mobile networks',
        'Add Progressive Web App (PWA) features'
      ],
      estimatedHours: 20
    },
    {
      id: 'api-documentation',
      title: 'API Documentation & Integration',
      priority: 'low',
      category: 'documentation',
      impact: 'Enables third-party integrations and future development',
      description: 'Create comprehensive API documentation and integration endpoints',
      tasks: [
        'Document all existing API endpoints',
        'Create API integration guide',
        'Add authentication and authorization documentation',
        'Implement webhook support for external integrations',
        'Add rate limiting and security documentation',
        'Create SDKs for common integration scenarios'
      ],
      estimatedHours: 12
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core-workflow': return <CreditCardIcon className="h-4 w-4" />
      case 'polish': return <SettingsIcon className="h-4 w-4" />
      case 'enhancement': return <BarChart3Icon className="h-4 w-4" />
      case 'documentation': return <FileTextIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const criticalTodos = todos.filter(t => t.priority === 'critical')
  const highTodos = todos.filter(t => t.priority === 'high')
  const mediumTodos = todos.filter(t => t.priority === 'medium')
  const lowTodos = todos.filter(t => t.priority === 'low')

  const totalHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)
  const criticalHours = criticalTodos.reduce((sum, todo) => sum + todo.estimatedHours, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/documentation" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Documentation
          </Link>
        </div>

        {/* Title */}
        <div className="text-center space-y-4 bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-4xl font-bold text-gray-900">
            📋 Development Roadmap & Action Items
          </h1>
          <p className="text-xl text-gray-600">
            Prioritized todo list for completing core clinic billing workflow
          </p>
        </div>

        {/* Summary */}
        <Card className="border-2 border-orange-300">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-900 flex items-center gap-2">
              <ZapIcon className="w-6 h-6" />
              Development Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-red-600">{criticalTodos.length}</div>
                <div className="text-sm text-gray-600">Critical Items</div>
                <div className="text-xs text-red-600">{criticalHours} hours estimated</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-orange-600">{todos.length}</div>
                <div className="text-sm text-gray-600">Total Items</div>
                <div className="text-xs text-orange-600">{totalHours} hours estimated</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600">Must Complete</div>
                <div className="text-xs text-green-600">For end-to-end workflow</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Priority */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-red-900">🚨 CRITICAL PRIORITY</h2>
            <Badge className="bg-red-500 text-white">Must Complete for Core Functionality</Badge>
          </div>
          
          <div className="grid gap-4">
            {criticalTodos.map((todo) => (
              <Card key={todo.id} className="border-l-4 border-l-red-500 bg-red-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(todo.category)}
                      <div>
                        <CardTitle className="text-lg text-red-900">{todo.title}</CardTitle>
                        <p className="text-sm text-red-700 mt-1">{todo.impact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                      <span className="text-sm text-gray-600">{todo.estimatedHours}h</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">{todo.description}</p>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Tasks:</h4>
                      <ul className="space-y-1">
                        {todo.tasks.map((task, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {todo.blockers && (
                      <div className="bg-white p-3 rounded border border-red-200">
                        <h4 className="font-medium text-red-800 mb-2">Current Blockers:</h4>
                        <ul className="space-y-1">
                          {todo.blockers.map((blocker, idx) => (
                            <li key={idx} className="text-sm text-red-700">⚠️ {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {todo.dependsOn && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-2">Dependencies:</h4>
                        <p className="text-sm text-yellow-700">Depends on: {todo.dependsOn.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* High Priority */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-orange-900">⚡ HIGH PRIORITY</h2>
          <div className="grid gap-4">
            {highTodos.map((todo) => (
              <Card key={todo.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(todo.category)}
                      <div>
                        <CardTitle className="text-lg">{todo.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{todo.impact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                      <span className="text-sm text-gray-600">{todo.estimatedHours}h</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">{todo.description}</p>
                  <details className="text-sm">
                    <summary className="font-medium text-gray-800 cursor-pointer hover:text-gray-900">
                      View {todo.tasks.length} tasks
                    </summary>
                    <ul className="mt-2 space-y-1 ml-4">
                      {todo.tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Medium Priority */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-yellow-900">🔧 MEDIUM PRIORITY</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {mediumTodos.map((todo) => (
              <Card key={todo.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(todo.category)}
                      <CardTitle className="text-md">{todo.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                      <span className="text-xs text-gray-600">{todo.estimatedHours}h</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{todo.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Low Priority */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-blue-900">📚 LOW PRIORITY</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {lowTodos.map((todo) => (
              <Card key={todo.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(todo.category)}
                      <CardTitle className="text-md">{todo.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(todo.priority)}>{todo.priority}</Badge>
                      <span className="text-xs text-gray-600">{todo.estimatedHours}h</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{todo.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-2">
          <p className="text-lg font-semibold text-orange-700">
            🎯 Focus: Complete 3 critical items ({criticalHours} hours) for end-to-end billing workflow
          </p>
          <p>Total estimated effort: {totalHours} hours across {todos.length} items</p>
          <div className="mt-4">
            <Link href="/documentation/status" className="text-orange-600 hover:text-orange-800 underline font-medium">
              ← Back to Implementation Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}