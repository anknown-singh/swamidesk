'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Activity, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Patients',
      value: '1,234',
      icon: Users,
      change: '+12%',
    },
    {
      title: 'Total Appointments',
      value: '89',
      icon: Calendar,
      change: '+8%',
    },
    {
      title: 'Active Doctors',
      value: '23',
      icon: Activity,
      change: '+2%',
    },
    {
      title: 'Monthly Revenue',
      value: '$45,678',
      icon: DollarSign,
      change: '+15%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of clinic operations and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New patient registered
                  </p>
                  <p className="text-sm text-muted-foreground">
                    John Doe - 2 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Appointment completed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dr. Smith with Jane Wilson - 15 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New doctor added
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dr. Johnson - Cardiology - 1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Add New Doctor
            </button>
            <button className="w-full justify-start bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Register New Patient
            </button>
            <button className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Analytics Report
            </button>
            <button className="w-full justify-start border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              System Settings
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;