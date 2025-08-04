import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, CreditCard, TrendingUp, UserCheck, Package, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Complete clinic management and analytics overview
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,230</div>
            <p className="text-xs text-muted-foreground">
              +8% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 doctors, 9 staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23%</div>
            <p className="text-xs text-muted-foreground">
              Patient visits growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Today&apos;s activity by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">ENT Department</div>
                  <div className="text-sm text-muted-foreground">18 patients • ₹12,450</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">+12%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Dental Department</div>
                  <div className="text-sm text-muted-foreground">15 patients • ₹18,200</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">+8%</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Cosmetic Department</div>
                  <div className="text-sm text-muted-foreground">8 patients • ₹14,580</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">-2%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Database</span>
                </div>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Payment Gateway</span>
                </div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Backup System</span>
                </div>
                <span className="text-xs text-muted-foreground">Running</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Inventory System</span>
                </div>
                <span className="text-xs text-muted-foreground">Synchronized</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Generate Reports</div>
                  <div className="text-sm text-muted-foreground">Financial & operational reports</div>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Manage Users</div>
                  <div className="text-sm text-muted-foreground">Add/edit staff accounts</div>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Inventory Alerts</div>
                  <div className="text-sm text-muted-foreground">View low stock items</div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '2 min ago', activity: 'New patient registered by Receptionist', type: 'patient', icon: Users },
              { time: '5 min ago', activity: 'Invoice #INV20250101234 generated - ₹2,450', type: 'billing', icon: CreditCard },
              { time: '10 min ago', activity: 'Prescription dispensed by Pharmacy', type: 'medicine', icon: Package },
              { time: '15 min ago', activity: 'Treatment plan completed - Patient ID #1234', type: 'treatment', icon: Activity },
              { time: '20 min ago', activity: 'Stock alert: Amoxicillin running low', type: 'inventory', icon: Package },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center gap-4 p-2">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.activity}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}