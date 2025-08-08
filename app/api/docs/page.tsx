'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  Copy, 
  ExternalLink, 
  Key, 
  Shield,
  Webhook,
  FileText,
  Database,
  Users,
  Calendar,
  Pill,
  CreditCard,
  Activity,
  CheckCircle
} from 'lucide-react'

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  requestBody?: {
    type: string
    schema: string
  }
  responses: Array<{
    code: number
    description: string
    example?: string
  }>
  example?: {
    request?: string
    response: string
  }
}

export default function APIDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const endpoints: APIEndpoint[] = [
    {
      method: 'GET',
      path: '/api/v1/patients',
      title: 'List Patients',
      description: 'Retrieve a paginated list of patients with filtering and search capabilities.',
      parameters: [
        { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
        { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 10, max: 100)' },
        { name: 'search', type: 'string', required: false, description: 'Search by name, phone, or email' },
        { name: 'gender', type: 'string', required: false, description: 'Filter by gender (male, female, other)' },
        { name: 'sort', type: 'string', required: false, description: 'Sort field (created_at, full_name, date_of_birth)' },
        { name: 'order', type: 'string', required: false, description: 'Sort order (asc, desc)' }
      ],
      responses: [
        { code: 200, description: 'Success' },
        { code: 400, description: 'Invalid parameters' },
        { code: 500, description: 'Internal server error' }
      ],
      example: {
        response: `{
  "data": [
    {
      "patient_id": "123e4567-e89b-12d3-a456-426614174000",
      "full_name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "date_of_birth": "1985-06-15",
      "gender": "male",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 150,
    "total_pages": 15,
    "has_next": true,
    "has_prev": false
  }
}`
      }
    },
    {
      method: 'POST',
      path: '/api/v1/patients',
      title: 'Create Patient',
      description: 'Create a new patient record in the system.',
      requestBody: {
        type: 'application/json',
        schema: `{
  "full_name": "string (required)",
  "phone": "string (required)",
  "email": "string (optional)",
  "date_of_birth": "string (required)",
  "gender": "male|female|other (required)",
  "address": "string (optional)",
  "blood_group": "A+|A-|B+|B-|AB+|AB-|O+|O- (optional)",
  "allergies": "string (optional)",
  "medical_history": "string (optional)"
}`
      },
      responses: [
        { code: 201, description: 'Patient created successfully' },
        { code: 400, description: 'Invalid patient data' },
        { code: 409, description: 'Patient with phone number already exists' },
        { code: 500, description: 'Internal server error' }
      ],
      example: {
        request: `{
  "full_name": "Jane Smith",
  "phone": "+919876543211",
  "email": "jane@example.com",
  "date_of_birth": "1990-03-22",
  "gender": "female",
  "address": "123 Main St, City",
  "blood_group": "O+"
}`,
        response: `{
  "message": "Patient created successfully",
  "data": {
    "patient_id": "456e7890-e89b-12d3-a456-426614174001",
    "full_name": "Jane Smith",
    "phone": "+919876543211",
    "created_at": "2024-01-15T10:45:00Z"
  }
}`
      }
    },
    {
      method: 'GET',
      path: '/api/v1/appointments',
      title: 'List Appointments',
      description: 'Retrieve appointments with filtering by date, doctor, patient, or status.',
      parameters: [
        { name: 'date', type: 'string', required: false, description: 'Filter by appointment date (YYYY-MM-DD)' },
        { name: 'doctor_id', type: 'string', required: false, description: 'Filter by doctor UUID' },
        { name: 'patient_id', type: 'string', required: false, description: 'Filter by patient UUID' },
        { name: 'status', type: 'string', required: false, description: 'Filter by status (scheduled, confirmed, completed, etc.)' },
        { name: 'type', type: 'string', required: false, description: 'Filter by type (consultation, follow_up, procedure, emergency)' }
      ],
      responses: [
        { code: 200, description: 'Success' },
        { code: 400, description: 'Invalid parameters' },
        { code: 500, description: 'Internal server error' }
      ],
      example: {
        response: `{
  "data": [
    {
      "id": "789e1234-e89b-12d3-a456-426614174002",
      "patient_id": "123e4567-e89b-12d3-a456-426614174000",
      "doctor_id": "987e6543-e89b-12d3-a456-426614174003",
      "appointment_date": "2024-01-20T14:30:00Z",
      "appointment_type": "consultation",
      "status": "scheduled",
      "patients": {
        "full_name": "John Doe",
        "phone": "+919876543210"
      },
      "doctors": {
        "full_name": "Dr. Sarah Wilson"
      }
    }
  ]
}`
      }
    }
  ]

  const webhookEvents = [
    { event: 'patient.created', description: 'Triggered when a new patient is registered' },
    { event: 'patient.updated', description: 'Triggered when patient information is updated' },
    { event: 'appointment.created', description: 'Triggered when a new appointment is scheduled' },
    { event: 'appointment.cancelled', description: 'Triggered when an appointment is cancelled' },
    { event: 'prescription.created', description: 'Triggered when a new prescription is written' },
    { event: 'invoice.paid', description: 'Triggered when an invoice is marked as paid' },
    { event: 'inventory.low_stock', description: 'Triggered when medicine stock falls below threshold' }
  ]

  const authExample = `// Using API Key Authentication
const response = await fetch('/api/v1/patients', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`

  const webhookExample = `// Webhook payload example
{
  "event": "patient.created",
  "data": {
    "patient_id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "John Doe",
    "phone": "+919876543210",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:01Z",
  "webhook_id": "wh_123456789"
}`

  const curlExample = `# Get patients with search
curl -X GET "https://your-domain.com/api/v1/patients?search=john&limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create new patient
curl -X POST "https://your-domain.com/api/v1/patients" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "Jane Smith",
    "phone": "+919876543211",
    "email": "jane@example.com",
    "date_of_birth": "1990-03-22",
    "gender": "female"
  }'`

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">SwamIDesk API Documentation</h1>
          <p className="text-lg text-gray-600 mb-4">
            Complete API reference for integrating with SwamIDesk Healthcare Management System
          </p>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              v1.0 Stable
            </Badge>
            <Badge variant="outline">REST API</Badge>
            <Badge variant="outline">JSON</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  API Overview
                </CardTitle>
                <CardDescription>
                  SwamIDesk provides a comprehensive REST API for healthcare management operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Base URL</h3>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      https://your-domain.com/api/v1
                    </code>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Response Format</h3>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      JSON
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Available Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'Patients', icon: Users, description: 'Patient registration and management' },
                      { name: 'Appointments', icon: Calendar, description: 'Appointment scheduling and tracking' },
                      { name: 'Prescriptions', icon: Pill, description: 'Medicine prescriptions and dispensing' },
                      { name: 'Billing', icon: CreditCard, description: 'Invoicing and payment processing' },
                      { name: 'Inventory', icon: Database, description: 'Medicine stock management' },
                      { name: 'Analytics', icon: Activity, description: 'Business intelligence and reports' },
                      { name: 'Webhooks', icon: Webhook, description: 'Real-time event notifications' }
                    ].map((resource) => {
                      const Icon = resource.icon
                      return (
                        <div key={resource.name} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-gray-600">{resource.description}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>API usage limits to ensure service quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1000</div>
                    <div className="text-sm text-gray-600">requests per hour</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">100</div>
                    <div className="text-sm text-gray-600">requests per minute</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">10MB</div>
                    <div className="text-sm text-gray-600">max request size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>
                  Secure your API requests with proper authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">API Key Authentication</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Include your API key in the Authorization header of every request.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">Authorization Header</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
                      >
                        {copiedCode === 'auth-header' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm bg-white p-2 rounded border">
                      <code>Authorization: Bearer YOUR_API_KEY</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Example Usage</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">JavaScript Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(authExample, 'auth-example')}
                      >
                        {copiedCode === 'auth-example' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                      <code>{authExample}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <Key className="h-5 w-5 text-yellow-400 mr-2" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">API Key Security</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Keep your API keys secure and never expose them in client-side code. 
                        Use environment variables and rotate keys regularly.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant={
                        endpoint.method === 'GET' ? 'default' :
                        endpoint.method === 'POST' ? 'default' :
                        endpoint.method === 'PUT' ? 'secondary' : 'destructive'
                      }>
                        {endpoint.method}
                      </Badge>
                      <code className="text-base font-mono">{endpoint.path}</code>
                    </CardTitle>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.parameters && (
                    <div>
                      <h4 className="font-semibold mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                            <code className="font-mono text-sm">{param.name}</code>
                            <Badge variant="outline" className="text-xs">{param.type}</Badge>
                            {param.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                            <span className="text-sm text-gray-600">{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {endpoint.requestBody && (
                    <div>
                      <h4 className="font-semibold mb-2">Request Body</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <pre className="text-sm"><code>{endpoint.requestBody.schema}</code></pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Responses</h4>
                    <div className="space-y-2">
                      {endpoint.responses.map((response, responseIndex) => (
                        <div key={responseIndex} className="flex items-center gap-2">
                          <Badge variant={response.code < 300 ? 'default' : 'destructive'}>
                            {response.code}
                          </Badge>
                          <span className="text-sm">{response.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {endpoint.example && (
                    <div>
                      <h4 className="font-semibold mb-2">Example</h4>
                      {endpoint.example.request && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-1">Request</h5>
                          <div className="bg-gray-50 p-3 rounded">
                            <pre className="text-sm overflow-x-auto"><code>{endpoint.example.request}</code></pre>
                          </div>
                        </div>
                      )}
                      <div>
                        <h5 className="text-sm font-medium mb-1">Response</h5>
                        <div className="bg-gray-50 p-3 rounded">
                          <pre className="text-sm overflow-x-auto"><code>{endpoint.example.response}</code></pre>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>
                  Real-time notifications for important events in your healthcare system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">How Webhooks Work</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Webhooks allow you to receive HTTP POST notifications whenever certain events occur in SwamIDesk.
                    Configure your endpoint to receive real-time updates about patients, appointments, and more.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Available Events</h3>
                  <div className="space-y-2">
                    {webhookEvents.map((event, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono">
                          {event.event}
                        </code>
                        <span className="text-sm text-gray-600">{event.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Webhook Payload Example</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">Webhook Payload</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhookExample, 'webhook-example')}
                      >
                        {copiedCode === 'webhook-example' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                      <code>{webhookExample}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-blue-400 mr-2" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Webhook Security</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        All webhook payloads are signed with HMAC-SHA256. Verify the signature using the 
                        X-SwamIDesk-Signature header to ensure the request is from SwamIDesk.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  cURL Examples
                </CardTitle>
                <CardDescription>
                  Ready-to-use command line examples for common API operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono">Common API Requests</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(curlExample, 'curl-example')}
                    >
                      {copiedCode === 'curl-example' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                    <code>{curlExample}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SDKs and Libraries</CardTitle>
                <CardDescription>Official and community-maintained client libraries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'JavaScript/Node.js', status: 'Official', color: 'bg-yellow-100 text-yellow-800' },
                    { name: 'Python', status: 'Official', color: 'bg-blue-100 text-blue-800' },
                    { name: 'PHP', status: 'Community', color: 'bg-purple-100 text-purple-800' },
                    { name: 'Ruby', status: 'Planned', color: 'bg-gray-100 text-gray-800' },
                    { name: 'Java', status: 'Planned', color: 'bg-gray-100 text-gray-800' },
                    { name: 'C#/.NET', status: 'Planned', color: 'bg-gray-100 text-gray-800' }
                  ].map((sdk) => (
                    <div key={sdk.name} className="p-4 border rounded-lg">
                      <div className="font-medium mb-1">{sdk.name}</div>
                      <Badge variant="outline" className={sdk.color}>
                        {sdk.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t text-center text-gray-600">
          <p className="mb-2">
            Need help? Contact our API support team at{' '}
            <a href="mailto:api-support@swamidesk.com" className="text-blue-600 hover:underline">
              api-support@swamidesk.com
            </a>
          </p>
          <p className="text-sm">
            API Version 1.0 • Last updated: January 2024 • 
            <a href="/status" className="text-blue-600 hover:underline ml-1">
              Service Status <ExternalLink className="h-3 w-3 inline ml-1" />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}