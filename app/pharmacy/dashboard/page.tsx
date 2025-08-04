import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pill, Package, AlertTriangle, TrendingDown } from 'lucide-react'

export default function PharmacyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">
          Manage prescriptions and inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Pending dispensing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">485</div>
            <p className="text-xs text-muted-foreground">
              Total medicines in stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Items need reordering
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Expiring in 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prescription Queue</CardTitle>
            <CardDescription>
              Pending prescriptions for dispensing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { patient: 'Rajesh Kumar', medicines: 3, doctor: 'Dr. Sharma', priority: false },
                { patient: 'Priya Patel', medicines: 2, doctor: 'Dr. Kumar', priority: true },
                { patient: 'Amit Singh', medicines: 1, doctor: 'Dr. Sharma', priority: false },
                { patient: 'Sunita Devi', medicines: 4, doctor: 'Dr. Patel', priority: false },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.patient}
                      {item.priority && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.medicines} medicines • {item.doctor}
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Dispense
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>
              Medicines requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { medicine: 'Paracetamol 500mg', stock: 15, minLevel: 50, urgent: true },
                { medicine: 'Amoxicillin 250mg', stock: 8, minLevel: 20, urgent: true },
                { medicine: 'Cetirizine 10mg', stock: 25, minLevel: 40, urgent: false },
                { medicine: 'Omeprazole 20mg', stock: 12, minLevel: 25, urgent: true },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.medicine}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {item.stock} / Min: {item.minLevel}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.urgent 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.urgent ? 'Critical' : 'Low'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Pharmacy management shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <button className="text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Dispense Medicines</div>
                  <div className="text-sm text-muted-foreground">Process prescription queue</div>
                </div>
              </div>
            </button>
            <button className="text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Update Inventory</div>
                  <div className="text-sm text-muted-foreground">Add new stock arrivals</div>
                </div>
              </div>
            </button>
            <button className="text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Stock Alerts</div>
                  <div className="text-sm text-muted-foreground">Manage reorder points</div>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}