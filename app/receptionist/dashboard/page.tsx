import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, Calendar, CreditCard } from 'lucide-react'

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">
          Manage patient registration and queue operations
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
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Patients waiting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Scheduled today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹15,240</div>
            <p className="text-xs text-muted-foreground">
              Today&apos;s collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for patient management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium">Register New Patient</div>
                <div className="text-sm text-muted-foreground">Add patient details and generate OPD token</div>
              </button>
              <button className="text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium">Search Existing Patient</div>
                <div className="text-sm text-muted-foreground">Find and update patient information</div>
              </button>
              <button className="text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="font-medium">View Queue Status</div>
                <div className="text-sm text-muted-foreground">Monitor doctor queues and waiting times</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Queue</CardTitle>
            <CardDescription>
              Current waiting patients by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">ENT</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">3 waiting</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Dental</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">2 waiting</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Cosmetic</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">3 waiting</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}