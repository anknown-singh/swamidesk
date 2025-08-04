'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users, FileText } from 'lucide-react';

const DoctorDashboard = () => {
  const todayAppointments = [
    { time: '09:00', patient: 'John Doe', type: 'Consultation' },
    { time: '10:30', patient: 'Jane Smith', type: 'Follow-up' },
    { time: '14:00', patient: 'Bob Johnson', type: 'Routine Check' },
    { time: '15:30', patient: 'Alice Brown', type: 'Emergency' },
  ];

  const stats = [
    {
      title: 'Today&apos;s Appointments',
      value: '8',
      icon: Calendar,
      description: '2 pending, 6 confirmed',
    },
    {
      title: 'Patients Seen',
      value: '156',
      icon: Users,
      description: 'This month',
    },
    {
      title: 'Avg. Consultation Time',
      value: '25 min',
      icon: Clock,
      description: 'Last 30 days',
    },
    {
      title: 'Records Updated',
      value: '12',
      icon: FileText,
      description: 'This week',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Dr. Smith. Here&apos;s your schedule for today.
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
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{appointment.time}</span>
                      <span className="text-sm text-muted-foreground">
                        {appointment.type}
                      </span>
                    </div>
                    <p className="text-sm">{appointment.patient}</p>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Create Medical Record
            </button>
            <button className="w-full justify-start bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Write Prescription
            </button>
            <button className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Patient History
            </button>
            <button className="w-full justify-start border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Update Availability
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;