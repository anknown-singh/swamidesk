import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function AttendantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Attendant Dashboard</h1>
        <p className="text-muted-foreground">
          Manage assigned procedures and services
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Today&apos;s assignments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Services completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Queue</CardTitle>
            <CardDescription>
              Services assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { patient: 'Rajesh Kumar', service: 'Ear Cleaning', status: 'assigned', priority: false },
                { patient: 'Priya Sharma', service: 'Nasal Endoscopy', status: 'in_progress', priority: true },
                { patient: 'Amit Patel', service: 'Hearing Test', status: 'assigned', priority: false },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.patient}
                      {item.priority && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{item.service}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'in_progress' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Service management shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Start Next Service</div>
                <div className="text-sm text-muted-foreground">Begin next assigned procedure</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Update Service Status</div>
                <div className="text-sm text-muted-foreground">Mark procedures as completed</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Service History</div>
                <div className="text-sm text-muted-foreground">Review completed procedures</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}