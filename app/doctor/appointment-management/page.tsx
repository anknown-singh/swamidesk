"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  StethoscopeIcon,
  FileTextIcon,
  CheckCircleIcon,
} from "lucide-react";
import { AppointmentStatusManager } from "@/components/appointments/appointment-status-manager";
import { RoleBasedCalendar } from "@/components/appointments/role-based-calendar";
import {
  createAuthenticatedClient,
  useAuthenticatedUser,
} from "@/lib/supabase/authenticated-client";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from "@/lib/types";

export default function DoctorAppointmentManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [activeView, setActiveView] = useState<
    "today" | "upcoming" | "completed" | "calendar"
  >("today");
  const [loading, setLoading] = useState(true);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const supabase = useMemo(() => createAuthenticatedClient(), []);
  const authenticatedUser = useAuthenticatedUser();

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => authenticatedUser?.id, [authenticatedUser?.id]);
  const userRole = useMemo(
    () => authenticatedUser?.role,
    [authenticatedUser?.role]
  );

  // Get current authenticated doctor using cookie-based auth
  useEffect(() => {
    // Skip if already redirecting or doctor ID already set
    if (redirecting || currentDoctorId) return;

    if (!userId) {
      console.warn("No authenticated user found. Redirecting to login...");
      setRedirecting(true);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    // Verify user role is doctor
    if (userRole !== "doctor") {
      console.error("Access denied: User is not a doctor");
      setRedirecting(true);
      if (typeof window !== "undefined") {
        console.error("Access denied. This page is only for doctors.");
        window.location.href = "/login";
      }
      return;
    }

    console.log(
      "✅ Doctor authenticated:",
      authenticatedUser?.full_name || authenticatedUser?.name || "Doctor",
      "ID:",
      userId
    );
    setCurrentDoctorId(userId);
  }, [userId, userRole, redirecting, currentDoctorId, authenticatedUser?.full_name, authenticatedUser?.name]);

  useEffect(() => {
    if (!currentDoctorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            *,
            patients(id, full_name, phone, email, date_of_birth, gender, address, emergency_contact_phone, created_at, updated_at),
            users!appointments_doctor_id_fkey(
              id, 
              full_name, 
              email, 
              phone, 
              created_at, 
              updated_at,
              user_profiles!inner(department, specialization)
            )
          `
          )
          .eq("doctor_id", currentDoctorId)
          .order("scheduled_date", { ascending: true })
          .order("scheduled_time", { ascending: true });

        if (error) throw error;

        interface DatabaseAppointment {
          id: string;
          patient_id: string;
          doctor_id: string;
          department: string;
          appointment_type: string;
          status: string;
          scheduled_date: string;
          scheduled_time: string;
          duration?: number;
          title?: string;
          priority?: boolean;
          is_recurring?: boolean;
          reminder_sent?: boolean;
          confirmation_sent?: boolean;
          confirmed_at?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          patients?: {
            id: string;
            full_name: string;
            phone: string;
            email: string;
            date_of_birth: string;
            gender: string;
            address: string;
            emergency_contact_phone: string;
            created_at: string;
            updated_at: string;
          };
          users?: {
            id: string;
            full_name: string;
            email: string;
            phone: string;
            created_at: string;
            updated_at: string;
            user_profiles: Array<{
              department: string;
              specialization: string;
            }>;
          };
        }

        const mappedAppointments = (data as DatabaseAppointment[]).map(
          (apt: DatabaseAppointment) => ({
            id: apt.id,
            appointment_number: null,
            patient_id: apt.patient_id,
            doctor_id: apt.doctor_id,
            department: apt.department,
            appointment_type: apt.appointment_type as AppointmentType,
            status: apt.status as AppointmentStatus,
            scheduled_date: apt.scheduled_date,
            scheduled_time: apt.scheduled_time,
            duration: apt.duration || 30,
            estimated_end_time: null,
            title: apt.title || "Appointment",
            description: null,
            chief_complaint: null,
            notes: null,
            patient_notes: null,
            priority: apt.priority || false,
            is_recurring: apt.is_recurring || false,
            recurrence_type: null,
            recurrence_end_date: null,
            parent_appointment_id: null,
            reminder_sent: apt.reminder_sent || false,
            confirmation_sent: apt.confirmation_sent || false,
            confirmed_at: apt.confirmed_at || null,
            estimated_cost: null,
            actual_cost: null,
            arrived_at: null,
            started_at: null,
            completed_at: null,
            cancelled_at: null,
            cancellation_reason: null,
            created_by: apt.created_by,
            created_at: apt.created_at,
            updated_at: apt.updated_at,
            patients: apt.patients
              ? {
                  id: apt.patients.id,
                  full_name: apt.patients.full_name,
                  phone: apt.patients.phone,
                  date_of_birth: apt.patients.date_of_birth || null,
                  gender: apt.patients.gender as
                    | "male"
                    | "female"
                    | "other"
                    | null,
                  address: apt.patients.address || null,
                  email: apt.patients.email || null,
                  emergency_contact_name: null,
                  emergency_contact_phone:
                    apt.patients.emergency_contact_phone || null,
                  medical_history: null,
                  allergies: null,
                  notes: null,
                  created_by: apt.created_by,
                  created_at: apt.patients.created_at,
                  updated_at: apt.patients.updated_at,
                }
              : undefined,
            users: apt.users
              ? {
                  id: apt.users.id,
                  role: "doctor" as const,
                  full_name: apt.users.full_name,
                  email: apt.users.email || "",
                  phone: apt.users.phone,
                  department: apt.users.department || null,
                  specialization: apt.users.specialization || null,
                  password_hash: "",
                  is_active: true,
                  created_at: apt.users.created_at,
                  updated_at: apt.users.updated_at,
                }
              : undefined,
          })
        ) as Appointment[];

        setAppointments(mappedAppointments);
      } catch (error) {
        console.error("Error fetching doctor appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 2 minutes to keep data dynamic without overwhelming the server
    const interval = setInterval(fetchData, 120000);

    return () => clearInterval(interval);
  }, [currentDoctorId, supabase]);

  const handleStatusUpdate = async (
    appointmentId: string,
    status: AppointmentStatus,
    data?: Partial<Appointment>
  ) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status,
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status, ...data, updated_at: new Date().toISOString() }
            : apt
        )
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const handleSendReminder = async (
    appointmentId: string,
    type: "sms" | "email" | "call"
  ) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          reminder_sent: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                reminder_sent: true,
                updated_at: new Date().toISOString(),
              }
            : apt
        )
      );

      console.log("Doctor reminder sent:", { appointmentId, type });
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const getStatusInfo = (status: AppointmentStatus) => {
    switch (status) {
      case "scheduled":
        return { color: "bg-blue-100 text-blue-800", label: "Scheduled" };
      case "confirmed":
        return { color: "bg-green-100 text-green-800", label: "Confirmed" };
      case "arrived":
        return { color: "bg-purple-100 text-purple-800", label: "Arrived" };
      case "in_progress":
        return { color: "bg-orange-100 text-orange-800", label: "In Progress" };
      case "completed":
        return { color: "bg-gray-100 text-gray-800", label: "Completed" };
      case "cancelled":
        return { color: "bg-red-100 text-red-800", label: "Cancelled" };
      case "no_show":
        return { color: "bg-yellow-100 text-yellow-800", label: "No Show" };
      case "rescheduled":
        return { color: "bg-indigo-100 text-indigo-800", label: "Rescheduled" };
      default:
        return { color: "bg-gray-100 text-gray-800", label: status };
    }
  };

  // Filter appointments based on active view
  const today = new Date().toISOString().split("T")[0]!;
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = appointment.scheduled_date;

    switch (activeView) {
      case "today":
        return appointmentDate === today;
      case "upcoming":
        return (
          appointmentDate > today ||
          (appointmentDate === today &&
            ["scheduled", "confirmed"].includes(appointment.status))
        );
      case "completed":
        return appointment.status === "completed";
      default:
        return true;
    }
  });

  // Calculate stats for doctor view
  const todayDate = new Date().toISOString().split("T")[0]!;
  const stats = {
    today: appointments.filter((apt) => apt.scheduled_date === todayDate)
      .length,
    upcoming: appointments.filter(
      (apt) =>
        apt.scheduled_date > todayDate ||
        (apt.scheduled_date === todayDate &&
          ["scheduled", "confirmed"].includes(apt.status))
    ).length,
    completed: appointments.filter((apt) => apt.status === "completed").length,
    in_progress: appointments.filter((apt) => apt.status === "in_progress")
      .length,
    arrived: appointments.filter((apt) => apt.status === "arrived").length,
  };

  // Show authentication loading state or redirect message
  if (!authenticatedUser || redirecting) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doctor Portal</h1>
            <p className="text-muted-foreground">
              {redirecting ? "Redirecting to login..." : "Authenticating..."}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">
            {redirecting
              ? "You will be redirected to the login page shortly."
              : "Please wait while we verify your credentials."}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Appointments
            </h1>
            <p className="text-muted-foreground">
              Loading your appointment schedule, Dr.{" "}
              {authenticatedUser?.full_name ||
                authenticatedUser?.name ||
                "Doctor"}
              ...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">
            Welcome, Dr.{" "}
            {authenticatedUser?.full_name ||
              authenticatedUser?.name ||
              "Doctor"}{" "}
            - Manage your patient appointments and consultations
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Today: {stats.today}
          </Badge>
          {stats.in_progress > 0 && (
            <Badge variant="default">{stats.in_progress} In Progress</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.today}
            </div>
            <div className="text-sm text-muted-foreground">
              Today&apos;s Schedule
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.upcoming}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.arrived}
            </div>
            <div className="text-sm text-muted-foreground">Arrived</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.in_progress}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {stats.completed}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeView === "today" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("today")}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
        </Button>
        <Button
          variant={activeView === "upcoming" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("upcoming")}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Upcoming
        </Button>
        <Button
          variant={activeView === "completed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("completed")}
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Completed
        </Button>
        <Button
          variant={activeView === "calendar" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("calendar")}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar View
        </Button>
      </div>

      {/* Calendar View */}
      {activeView === "calendar" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>
                View and manage your appointments in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleBasedCalendar
                userRole="doctor"
                userId={currentDoctorId || ""}
                onAppointmentSelect={(appointment) =>
                  setSelectedAppointment(appointment)
                }
                onSlotSelect={(date, time, doctorId) => {
                  console.log("Selected slot:", { date, time, doctorId });
                  // In a real app, this would open appointment booking dialog
                }}
                onBookAppointment={() => {
                  console.log("Book appointment clicked");
                  // In a real app, this would open appointment booking dialog
                }}
                onEditAppointment={async (appointment) => {
                  console.log("Edit appointment:", appointment);
                  // In a real app, this would open appointment editing dialog
                }}
                onCancelAppointment={async (appointment) => {
                  await handleStatusUpdate(appointment.id, "cancelled");
                }}
                selectedDoctorId={currentDoctorId || ""}
                viewMode="week"
                readonly={false}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* List Views */}
      {activeView !== "calendar" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointment List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeView === "today" && "Today's Appointments"}
                  {activeView === "upcoming" && "Upcoming Appointments"}
                  {activeView === "completed" && "Completed Appointments"} (
                  {filteredAppointments.length})
                </CardTitle>
                <CardDescription>
                  Click on an appointment to manage its details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAppointments.map((appointment) => {
                    const statusInfo = getStatusInfo(appointment.status);
                    return (
                      <div
                        key={appointment.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAppointment?.id === appointment.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {appointment.patients?.full_name}
                              </h3>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                              {appointment.priority && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 border-red-200"
                                >
                                  Priority
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3" />
                                {new Date(
                                  appointment.scheduled_date
                                ).toLocaleDateString()}{" "}
                                at {appointment.scheduled_time}
                              </div>
                              <div className="flex items-center gap-2">
                                <StethoscopeIcon className="h-3 w-3" />
                                {appointment.appointment_type} •{" "}
                                {appointment.department}
                              </div>
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-3 w-3" />
                                {appointment.patients?.phone} •{" "}
                                {appointment.patients?.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-sm text-muted-foreground">
                              {appointment.duration} min
                            </div>
                            {appointment.status === "arrived" && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-200"
                              >
                                Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <StethoscopeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No appointments found for this view</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Details & Status Management */}
          <div>
            {selectedAppointment ? (
              <div className="space-y-4">
                {/* Patient Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAppointment.patients?.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Age</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAppointment.patients?.date_of_birth
                              ? new Date().getFullYear() -
                                new Date(
                                  selectedAppointment.patients.date_of_birth
                                ).getFullYear()
                              : "N/A"}{" "}
                            years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Gender</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedAppointment.patients?.gender || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Mobile</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAppointment.patients?.phone}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.patients?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.patients?.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Management */}
                <AppointmentStatusManager
                  appointment={selectedAppointment}
                  onStatusUpdate={handleStatusUpdate}
                  onSendReminder={handleSendReminder}
                  canModify={true}
                />

                {/* Quick Actions for Doctors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm">
                        View History
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Notes
                      </Button>
                      <Button variant="outline" size="sm">
                        Prescribe
                      </Button>
                      <Button variant="outline" size="sm">
                        Schedule Follow-up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <StethoscopeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Select an Appointment
                  </h3>
                  <p className="text-muted-foreground">
                    Choose an appointment from your schedule to view patient
                    details and manage consultation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
