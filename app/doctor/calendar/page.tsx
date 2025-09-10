"use client";

import { useState, useEffect, useCallback } from "react";
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
  ClockIcon,
  UserCheckIcon,
  StethoscopeIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  PlayIcon,
  ClipboardListIcon,
  HistoryIcon,
} from "lucide-react";
import { RoleBasedCalendar } from "@/components/appointments/role-based-calendar";
import { createAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import type { Appointment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface DoctorStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  averageConsultationTime: number;
  nextAppointment: Appointment | null;
  patientsSeen: number;
}

export default function DoctorCalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DoctorStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    averageConsultationTime: 30,
    nextAppointment: null,
    patientsSeen: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get current doctor ID from auth context
  const doctorId = user?.role === "doctor" ? user.id : "";

  // Fetch doctor-specific statistics function that can be reused
  // Wrapped in useCallback to prevent infinite re-renders
  const fetchStats = useCallback(async () => {
    if (!doctorId) return;

    const supabase = createAuthenticatedClient();
    try {
      const today = new Date().toISOString().split("T")[0]!;
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      // Get today's appointments for this doctor
      const { data: todayAppointments } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients(id, full_name, phone)
        `
        )
        .eq("doctor_id", doctorId)
        .eq("scheduled_date", today)
        .order("scheduled_time");

      // Get upcoming appointments (next 7 days)
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: upcomingAppointments } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients(id, full_name, phone)
        `
        )
        .eq("doctor_id", doctorId)
        .gte("scheduled_date", today)
        .lte("scheduled_date", weekEnd.toISOString().split("T")[0])
        .in("status", ["scheduled", "confirmed", "arrived"])
        .order("scheduled_date")
        .order("scheduled_time");

      const todayTotal = todayAppointments?.length || 0;
      const upcomingTotal = upcomingAppointments?.length || 0;
      const completedToday =
        todayAppointments?.filter((apt) => apt.status === "completed").length ||
        0;

      // Find next appointment - Fix time comparison logic
      const nextAppointment =
        todayAppointments?.find((apt) => {
          // Convert times to comparable format (remove seconds if present)
          const aptTime = apt.scheduled_time.split(":").slice(0, 2).join(":");
          const currTime = currentTime.split(":").slice(0, 2).join(":");
          return (
            aptTime >= currTime &&
            ["scheduled", "confirmed", "arrived"].includes(apt.status)
          );
        }) ||
        upcomingAppointments?.find(
          (apt) =>
            apt.scheduled_date > today &&
            ["scheduled", "confirmed", "arrived"].includes(apt.status)
        ) ||
        null;

      // Calculate average consultation time for completed appointments
      const completedAppointments =
        todayAppointments?.filter((apt) => apt.status === "completed") || [];
      const avgTime =
        completedAppointments.length > 0
          ? Math.round(
              completedAppointments.reduce(
                (sum, apt) => sum + (apt.duration || 30),
                0
              ) / completedAppointments.length
            )
          : 30;

      // Count unique patients seen today - only count completed appointments
      const uniquePatients = new Set(
        todayAppointments
          ?.filter((apt) => apt.status === "completed")
          .map((apt) => apt.patient_id)
      ).size;

      setStats({
        todayAppointments: todayTotal,
        upcomingAppointments: upcomingTotal,
        completedToday,
        averageConsultationTime: avgTime,
        nextAppointment: nextAppointment
          ? {
              ...nextAppointment,
              patient: nextAppointment.patients
                ? {
                    id: nextAppointment.patients.id,
                    name: nextAppointment.patients.full_name,
                    mobile: nextAppointment.patients.phone,
                    dob: null,
                    gender: null,
                    address: null,
                    email: null,
                    emergency_contact: null,
                    created_by: nextAppointment.created_by,
                    created_at: nextAppointment.created_at,
                    updated_at: nextAppointment.updated_at,
                  }
                : undefined,
            }
          : null,
        patientsSeen: uniquePatients,
      });
    } catch (error) {
      console.error("Error fetching doctor stats:", error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]); // Only depend on doctorId, not the entire function

  // Fetch doctor-specific statistics
  useEffect(() => {
    if (!doctorId) return;

    fetchStats();

    // Refresh stats every 2 minutes
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, [doctorId, fetchStats]); // fetchStats is now stable due to useCallback

  const handleAppointmentSelect = (appointment: Appointment) => {
    // Navigate to OPD workflow for the patient
    console.log({ appointment });
    if (appointment.patient_id && appointment.opd_id) {
      router.push(
        `/doctor/opd/${appointment.opd_id}?patientId=${appointment.patient_id}`
      );
    } else if (appointment.patient_id) {
      // Fallback to general OPD page if opd_id is missing
      router.push(`/doctor/opd?patientId=${appointment.patient_id}`);
    } else {
      console.warn("No patient_id found for appointment:", appointment);
      // Fallback to appointment details if patient_id is missing
      router.push(`/doctor/appointments/${appointment.id}`);
    }
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient();

    // Add loading state to prevent multiple clicks
    if (loading) return;

    setLoading(true);

    try {
      // Update appointment status to in_progress
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "in_progress",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Consultation started successfully:", appointment.id);

      // Navigate to OPD workflow page with patient ID
      console.log(
        "🔄 Navigating to OPD workflow for patient:",
        appointment.patient_id
      );
      router.push(`/doctor/opd?patientId=${appointment.patient_id}`);

      // Refresh stats from database to get accurate data
      await fetchStats();
    } catch (error) {
      console.error("Error starting consultation:", error);

      // More specific error messages based on error type
      let errorMessage = "Failed to start consultation. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const errorMsg = error.message as string;
        if (errorMsg.includes("permission")) {
          errorMessage =
            "You do not have permission to start this consultation.";
        } else if (errorMsg.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (errorMsg.includes("not found")) {
          errorMessage =
            "Appointment not found. It may have been modified by another user.";
        }
      }

      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient();

    // Add loading state to prevent multiple clicks
    if (loading) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Appointment completed:", appointment.id);

      console.log("Appointment completed successfully!");

      // Refresh stats from database to get accurate next appointment and statistics
      await fetchStats();

      // Optionally redirect to prescription/summary form
      // router.push(`/doctor/prescriptions/new?appointmentId=${appointment.id}`)
    } catch (error) {
      console.error("Error completing appointment:", error);

      let errorMessage = "Failed to complete appointment. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const errorMsg = error.message as string;
        if (errorMsg.includes("permission")) {
          errorMessage =
            "You do not have permission to complete this appointment.";
        } else if (errorMsg.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        }
      }

      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient();

    // Add loading state to prevent multiple clicks
    if (loading) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "arrived",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Patient marked as arrived:", appointment.id);

      console.log("Patient marked as arrived successfully!");

      // Refresh stats from database to get accurate data
      await fetchStats();
    } catch (error) {
      console.error("Error marking patient as arrived:", error);

      // More specific error messages
      let errorMessage = "Failed to mark patient as arrived. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        const errorMsg = error.message as string;
        if (errorMsg.includes("permission")) {
          errorMessage =
            "You do not have permission to update this appointment.";
        } else if (errorMsg.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (errorMsg.includes("not found")) {
          errorMessage =
            "Appointment not found. It may have been modified by another user.";
        }
      }

      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatientHistory = (patientId: string) => {
    // Navigate to patient history page
    router.push(`/doctor/patients/${patientId}`);
  };

  const handleViewPrescriptions = () => {
    router.push("/doctor/prescriptions");
  };

  const handleViewAvailability = () => {
    router.push("/doctor/availability");
  };

  const handleViewPatientRecords = () => {
    router.push("/doctor/patients");
  };

  const handleSlotSelect = (date: string, time: string, doctorId?: string) => {
    console.log("📅 Available slot selected:", { date, time, doctorId });
    // For doctor view, navigate to book appointment with doctor pre-selected
    const params = new URLSearchParams({
      date,
      time,
      doctorId: doctorId || user?.id || "",
    });
    router.push(`/appointments/new?${params.toString()}`);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    console.log("📝 Edit appointment:", appointment.id);
    // Navigate to appointment workflow based on type
    if (
      appointment.appointment_type === "treatment" ||
      appointment.appointment_type === "procedure"
    ) {
      router.push(`/doctor/appointments/${appointment.id}/treatment`);
    } else {
      router.push(`/doctor/appointments/${appointment.id}/consultation`);
    }
  };

  const handleBookAppointment = () => {
    console.log("📅 Navigating to book appointment page");
    router.push(`/appointments/new?doctorId=${user?.id || ""}`);
  };

  const handleApproveAppointment = async (appointment: Appointment) => {
    const supabase = createAuthenticatedClient();
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointment.id);

      if (error) throw error;

      console.log("Appointment approved:", appointment.id);
      await fetchStats(); // Refresh data
    } catch (error) {
      console.error("Error approving appointment:", error);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (
      !confirm(
        `Cancel appointment for ${
          appointment.patients?.full_name || "this patient"
        }?`
      )
    )
      return;

    const supabase = createAuthenticatedClient();
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);

      if (error) throw error;

      console.log("Appointment cancelled:", appointment.id);
      await fetchStats(); // Refresh data
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  // Show loading state while auth is being determined
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is a doctor (this is handled by the layout, but keeping as backup)
  if (user.role !== "doctor") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            This page is only accessible to doctors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground">
            Personal appointment calendar and patient management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.nextAppointment && (
            <Button
              onClick={() => handleStartConsultation(stats.nextAppointment!)}
              disabled={
                stats.nextAppointment.status === "in_progress" || loading
              }
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {loading
                ? "Starting..."
                : stats.nextAppointment.status === "in_progress"
                ? "In Progress"
                : "Start Next"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.todayAppointments}
            </div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.upcomingAppointments}
            </div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : stats.completedToday}
            </div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.patientsSeen}
            </div>
            <p className="text-xs text-muted-foreground">seen today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.averageConsultationTime}m
            </div>
            <p className="text-xs text-muted-foreground">per patient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div
              className={`h-4 w-4 rounded-full ${
                stats.nextAppointment ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {stats.nextAppointment ? "Ready" : "Free"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.nextAppointment ? "next patient" : "no pending"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Calendar */}
        <div className="md:col-span-3">
          <RoleBasedCalendar
            userRole="doctor"
            userId={doctorId}
            onAppointmentSelect={handleAppointmentSelect}
            onSlotSelect={handleSlotSelect}
            onBookAppointment={handleBookAppointment}
            onEditAppointment={handleEditAppointment}
            onApproveAppointment={handleApproveAppointment}
            onCancelAppointment={handleCancelAppointment}
            viewMode="week"
            readonly={false}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Appointment */}
          {stats.nextAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Next Appointment
                </CardTitle>
                <CardDescription>
                  {stats.nextAppointment.scheduled_date ===
                  new Date().toISOString().split("T")[0]
                    ? "Today"
                    : new Date(
                        stats.nextAppointment.scheduled_date
                      ).toLocaleDateString()}{" "}
                  at {stats.nextAppointment.scheduled_time}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">
                    {stats.nextAppointment.patients?.full_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.nextAppointment.patients?.phone}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {stats.nextAppointment.status}
                    </Badge>
                    <Badge variant="outline">
                      {stats.nextAppointment.appointment_type}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {stats.nextAppointment.status === "scheduled" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleMarkArrived(stats.nextAppointment!)}
                      disabled={loading}
                    >
                      <UserCheckIcon className="h-4 w-4 mr-2" />
                      {loading ? "Marking..." : "Mark as Arrived"}
                    </Button>
                  )}

                  {stats.nextAppointment.status === "arrived" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleStartConsultation(stats.nextAppointment!)
                      }
                      disabled={loading}
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      {loading ? "Starting..." : "Start Consultation"}
                    </Button>
                  )}

                  {stats.nextAppointment.status === "in_progress" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleCompleteAppointment(stats.nextAppointment!)
                      }
                      disabled={loading}
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      {loading ? "Completing..." : "Complete"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      handleViewPatientHistory(
                        stats.nextAppointment?.patient_id || ""
                      )
                    }
                    disabled={!stats.nextAppointment?.patient_id}
                  >
                    <HistoryIcon className="h-4 w-4 mr-2" />
                    View Patient History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={handleViewPrescriptions}
              >
                <ClipboardListIcon className="h-4 w-4 mr-2" />
                View Prescriptions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={handleViewAvailability}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                My Availability
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={handleViewPatientRecords}
              >
                <UserCheckIcon className="h-4 w-4 mr-2" />
                Patient Records
              </Button>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Summary</CardTitle>
              <CardDescription>Performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <Badge variant="outline">
                  {stats.todayAppointments > 0
                    ? Math.round(
                        (stats.completedToday / stats.todayAppointments) * 100
                      )
                    : 0}
                  %
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>On-time Performance</span>
                <Badge variant="outline" className="text-green-600">
                  95%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Patient Satisfaction</span>
                <Badge variant="outline" className="text-blue-600">
                  4.8/5
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
