import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, FileText, Activity } from 'lucide-react'

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage consultations and patient care
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              6 completed, 12 pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Written today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procedures</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Services assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Queue</CardTitle>
            <CardDescription>
              Patients waiting for consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { token: 'ENT001', name: 'Rajesh Kumar', time: '10:30 AM', priority: false },
                { token: 'ENT002', name: 'Priya Sharma', time: '10:45 AM', priority: true },
                { token: 'ENT003', name: 'Amit Patel', time: '11:00 AM', priority: false },
                { token: 'ENT004', name: 'Sunita Devi', time: '11:15 AM', priority: false },
              ].map((patient, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {patient.name}
                      {patient.priority && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{patient.token} • {patient.time}</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Start
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common consultation tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Start Next Consultation</div>
                <div className="text-sm text-muted-foreground">Begin consultation with next patient</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">View Treatment Plans</div>
                <div className="text-sm text-muted-foreground">Manage ongoing treatment plans</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">Prescription History</div>
                <div className="text-sm text-muted-foreground">Review recent prescriptions</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}