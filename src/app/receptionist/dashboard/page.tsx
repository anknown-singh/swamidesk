'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, Phone } from 'lucide-react';

const ReceptionistDashboard = () => {
  const todayAppointments = [
    { time: '09:00', patient: 'John Doe', doctor: 'Dr. Smith', status: 'Confirmed' },
    { time: '10:30', patient: 'Jane Wilson', doctor: 'Dr. Johnson', status: 'Pending' },
    { time: '14:00', patient: 'Bob Brown', doctor: 'Dr. Smith', status: 'Confirmed' },
    { time: '15:30', patient: 'Alice Green', doctor: 'Dr. Wilson', status: 'Waiting' },
  ];

  const pendingTasks = [
    'Call John Doe for appointment confirmation',
    'Register new patient - Mary Johnson',
    'Schedule follow-up for patient ID #1234',
    'Update insurance information for Jane Smith',
  ];

  const stats = [
    {
      title: 'Today&apos;s Appointments',
      value: '12',
      icon: Calendar,
      description: '3 pending confirmation',
    },
    {
      title: 'Waiting Patients',
      value: '4',
      icon: Users,
      description: 'Currently in clinic',
    },
    {
      title: 'Avg. Wait Time',
      value: '15min',
      icon: Clock,
      description: 'Today',
    },
    {
      title: 'Calls to Make',
      value: '8',
      icon: Phone,
      description: 'Pending reminders',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">
          Good morning, Mary. Here&apos;s your task overview for today.
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
            <CardTitle>Today&apos;s Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{appointment.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'Confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm">{appointment.patient}</p>
                    <p className="text-xs text-muted-foreground">{appointment.doctor}</p>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300" 
                  />
                  <span className="text-sm">{task}</span>
                </div>
              ))}
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
              Schedule Appointment
            </button>
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Register New Patient
            </button>
            <button className="bg-accent text-accent-foreground hover:bg-accent/80 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Check-in Patient
            </button>
            <button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Doctor Schedules
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceptionistDashboard;