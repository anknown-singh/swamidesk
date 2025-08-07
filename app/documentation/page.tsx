'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileTextIcon, WorkflowIcon, BookOpenIcon, UsersIcon } from 'lucide-react'

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🏥 Swamidesk Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete patient journey workflow system - from arrival to payment with zero extra steps
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/documentation/patient-journey">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <WorkflowIcon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Patient Journey Workflow</CardTitle>
                <CardDescription className="text-lg">
                  Complete 380+ line guide covering every aspect of patient flow with role-based instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✅ Complete storyline mapping</p>
                  <p>✅ Role-based instructions</p>
                  <p>✅ Decision matrices</p>
                  <p>✅ Detailed routing logic</p>
                </div>
                <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full inline-block">
                  View Complete Workflow →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/documentation/implementation">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <FileTextIcon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-green-900">Implementation Complete</CardTitle>
                <CardDescription className="text-lg">
                  Implementation summary with all delivered components and system status
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✅ Smart routing system</p>
                  <p>✅ Unified patient tracking</p>
                  <p>✅ Integrated billing</p>
                  <p>✅ Department optimization</p>
                </div>
                <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-full inline-block">
                  View Implementation →
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Overview */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-2">
              <BookOpenIcon className="w-6 h-6" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">🎯</div>
                <h3 className="font-semibold text-gray-900">Zero Extra Steps</h3>
                <p className="text-sm text-gray-600">
                  Seamless workflow with automatic routing and smart handoffs
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-3xl">💰</div>
                <h3 className="font-semibold text-gray-900">Custom Pricing</h3>
                <p className="text-sm text-gray-600">
                  Diagnosis-based pricing with admin approval workflow
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-3xl">📊</div>
                <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                <p className="text-sm text-gray-600">
                  Live patient status across all departments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-2">
              <UsersIcon className="w-6 h-6" />
              Patient Journey Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center items-center gap-4 text-center">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">1</div>
                <span className="text-sm font-medium">Registration</span>
              </div>
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">2</div>
                <span className="text-sm font-medium">Consultation</span>
              </div>
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">3</div>
                <span className="text-sm font-medium">Diagnosis</span>
              </div>
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">4</div>
                <span className="text-sm font-medium">Admin Review</span>
              </div>
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">5</div>
                <span className="text-sm font-medium">Treatment</span>
              </div>
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">6</div>
                <span className="text-sm font-medium">Billing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Complete patient workflow system - Production ready ✅</p>
        </div>
      </div>
    </div>
  )
}