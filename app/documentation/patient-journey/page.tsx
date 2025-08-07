'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftIcon } from 'lucide-react'

export default function PatientJourneyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
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
            🏥 Complete Patient Journey Workflow
          </h1>
          <p className="text-xl text-gray-600">
            Swamidesk Clinic Management System - From Arrival to Payment
          </p>
        </div>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900">🎯 Core Patient Storyline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Patient Arrival</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Registration</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Appointment</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Consultation</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Diagnosis</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Treatment Planning</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Admin Approval</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Procedures/Pharmacy</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Billing</span>
                <span className="text-gray-400">→</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">Payment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 1: Patient Entry & Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-900">📋 Phase 1: Patient Entry & Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-xl font-semibold text-green-800 mb-3">New Patient Registration</h3>
              <div className="space-y-2">
                <p><strong>Actor:</strong> Receptionist</p>
                <p><strong>Location:</strong> <code>/receptionist/patients</code></p>
                <div className="bg-green-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Process:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "New Patient" button</li>
                    <li>Fill comprehensive registration form:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li><strong>Personal Details:</strong> Name, phone, DOB, gender, address</li>
                        <li><strong>Medical History:</strong> Previous conditions, surgeries</li>
                        <li><strong>Allergies:</strong> Known allergies and reactions</li>
                        <li><strong>Emergency Contact:</strong> Name and phone</li>
                      </ul>
                    </li>
                    <li>System auto-generates unique Patient ID</li>
                    <li>Patient record created in database</li>
                    <li><strong>Next Step:</strong> Add to queue or schedule appointment</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-xl font-semibold text-blue-800 mb-3">Returning Patient Lookup</h3>
              <div className="space-y-2">
                <p><strong>Actor:</strong> Receptionist</p>
                <p><strong>Location:</strong> <code>/receptionist/patients</code></p>
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Process:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Search by name, phone, or patient ID</li>
                    <li>Verify patient identity</li>
                    <li>Update information if needed</li>
                    <li>Review medical alerts (allergies, medical history)</li>
                    <li><strong>Next Step:</strong> Add to queue or schedule appointment</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 2: Appointment & Queue Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-900">📅 Phase 2: Appointment & Queue Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-xl font-semibold text-purple-800 mb-3">Appointment Scheduling</h3>
              <div className="space-y-2">
                <p><strong>Actor:</strong> Receptionist</p>
                <p><strong>Location:</strong> <code>/receptionist/appointments</code></p>
                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Process:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Select patient from registered patients</li>
                    <li>Choose consulting doctor from available doctors</li>
                    <li>Pick available time slot from doctor's schedule</li>
                    <li>Add chief complaint (reason for visit)</li>
                    <li>Patient automatically added to today's consultation queue</li>
                    <li>Queue number and estimated wait time provided</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 3: Doctor Consultation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-orange-900">👨‍⚕️ Phase 3: Doctor Consultation & Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-xl font-semibold text-orange-800 mb-3">Clinical Assessment Process</h3>
              <div className="space-y-2">
                <p><strong>Actor:</strong> Doctor</p>
                <p><strong>Location:</strong> <code>/doctor/opd</code></p>
                <div className="bg-orange-50 p-3 rounded">
                  <h4 className="font-semibold mb-2">Critical Process:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Select patient from consultation queue</li>
                    <li>Record chief complaint and symptoms</li>
                    <li>Conduct physical examination</li>
                    <li><strong className="text-red-600">🎯 CRITICAL:</strong> Establish definitive diagnosis (root cause identification)</li>
                    <li>Create comprehensive treatment plan based on diagnosis</li>
                    <li>Choose treatment path from decision matrix</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 4: Treatment Decision */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-red-900">💊 Phase 4: Treatment Decision & Smart Routing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-xl font-semibold text-red-800 mb-3">Treatment Options Matrix</h3>
              <div className="bg-red-50 p-3 rounded">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🏥 Procedures Required:</h4>
                    <p className="text-xs">Doctor creates custom quotes → Admin reviews pricing → Procedures department execution</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">💊 Medicines Only:</h4>
                    <p className="text-xs">Doctor adds prescription notes → Direct routing to pharmacy</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">🔄 Combined Treatment:</h4>
                    <p className="text-xs">Sequential routing: Procedures first → then Pharmacy → finally Billing</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">✅ Consultation Only:</h4>
                    <p className="text-xs">No additional treatment needed → Direct routing to billing</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">🔥 Key Workflow Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-blue-900">Zero Extra Steps</h3>
                <p className="text-sm text-blue-700">Single patient record flows through entire journey</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-semibold text-green-900">Custom Pricing</h3>
                <p className="text-sm text-green-700">Diagnosis-based pricing with admin approval</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-purple-900">Real-time Tracking</h3>
                <p className="text-sm text-purple-700">Live status updates across all departments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Documentation Link */}
        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              📖 Complete Documentation Available
            </h3>
            <p className="text-gray-600 mb-4">
              This is a summary view. The complete 380+ line workflow documentation includes detailed instructions for all roles and departments.
            </p>
            <div className="text-sm text-gray-500">
              <p>Full documentation: <code>docs/workflow-documentation/PATIENT_JOURNEY_WORKFLOW.md</code></p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Swamidesk Patient Journey Workflow - Production Ready ✅</p>
        </div>
      </div>
    </div>
  )
}