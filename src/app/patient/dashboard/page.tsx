'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, Pill, Clock } from 'lucide-react';

const PatientDashboard = () => {
  const upcomingAppointments = [
    { date: 'Today, 2:00 PM', doctor: 'Dr. Smith', type: 'Follow-up' },
    { date: 'Tomorrow, 10:00 AM', doctor: 'Dr. Johnson', type: 'Consultation' },
    { date: 'Friday, 3:30 PM', doctor: 'Dr. Wilson', type: 'Routine Check' },
  ];

  const recentPrescriptions = [
    { medication: 'Amoxicillin', dosage: '500mg', frequency: '3x daily' },
    { medication: 'Ibuprofen', dosage: '200mg', frequency: 'As needed' },
  ];

  const stats = [
    {
      title: 'Upcoming Appointments',
      value: '3',
      icon: Calendar,
      description: 'Next 7 days',
    },
    {
      title: 'Medical Records',
      value: '8',
      icon: FileText,
      description: 'Total records',
    },
    {
      title: 'Active Prescriptions',
      value: '2',
      icon: Pill,
      description: 'Current medications',
    },
    {
      title: 'Last Visit',
      value: '5 days',
      icon: Clock,
      description: 'Dr. Smith - Follow-up',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Jane. Here&apos;s your health overview.
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
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{appointment.date}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{appointment.doctor}</span>
                      <span>•</span>
                      <span>{appointment.type}</span>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    Reschedule
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPrescriptions.map((prescription, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{prescription.medication}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{prescription.dosage}</span>
                      <span>•</span>
                      <span>{prescription.frequency}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full text-sm text-primary hover:underline pt-2">
                View All Prescriptions
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Book Appointment
            </button>
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Medical Records
            </button>
            <button className="bg-accent text-accent-foreground hover:bg-accent/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Request Prescription Refill
            </button>
            <button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Contact Support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;