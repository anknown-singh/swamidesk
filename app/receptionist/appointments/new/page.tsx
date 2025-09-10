"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  StethoscopeIcon,
  ArrowLeft,
  CheckCircleIcon,
} from "lucide-react";
import { AppointmentBookingForm } from "@/components/appointments/appointment-booking-form";
import type {
  AppointmentBookingForm as AppointmentBookingFormData,
  AppointmentType,
} from "@/lib/types";
import { createAuthenticatedClient } from "@/lib/supabase/authenticated-client";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-filled data from URL params
  const preFilledDate = searchParams.get("date");
  const preFilledTime = searchParams.get("time");
  const preFilledDoctorId = searchParams.get("doctorId");

  // Additional params from workflow requests
  const preFilledPatientId = searchParams.get("patientId");
  const preFilledAppointmentType = searchParams.get(
    "appointmentType"
  ) as AppointmentType;
  const workflowRequestId = searchParams.get("workflowRequestId");
  const preFilledNotes = searchParams.get("notes");
  const preFilledPriority = searchParams.get("priority") === "true";
  const opdId = searchParams.get("opdId");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: AppointmentBookingFormData) => {
    const supabase = createAuthenticatedClient();
    setIsSubmitting(true);

    try {
      // Step 1: Create OPD record first
      let opdRecordId = opdId; // Use existing OPD ID if provided

      if (!opdRecordId) {
        console.log("Creating new OPD record...");
        const { data: opdRecord, error: opdError } = await supabase
          .from("opd_records")
          .insert({
            patient_id: formData.patient_id,
            opd_status: "scheduled",
          })
          .select()
          .single();

        if (opdError) {
          console.error("Error creating OPD record:", opdError);
          throw opdError;
        }

        opdRecordId = opdRecord.id;
        console.log("Created OPD record with ID:", opdRecordId);
      }

      // Step 2: Create the appointment with OPD link
      const appointmentData: any = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        department: formData.department,
        appointment_type: formData.appointment_type,
        status: "scheduled",
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration: formData.duration || 30,
        title: formData.title || `${formData.appointment_type} appointment`,
        description: formData.description,
        notes: formData.notes,
        patient_notes: formData.patient_notes,
        priority: formData.priority || false,
        created_by: formData.created_by,
        opd_id: opdRecordId, // Always link to OPD record
      };

      console.log("Creating appointment with OPD ID:", opdRecordId);
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // If this came from a workflow request, mark it as completed
      if (workflowRequestId) {
        const { error: workflowUpdateError } = await supabase
          .from("workflow_requests")
          .update({
            status: "approved",
            response_notes: `Appointment scheduled for ${formData.scheduled_date} at ${formData.scheduled_time}`,
            responded_at: new Date().toISOString(),
          })
          .eq("id", workflowRequestId);

        if (workflowUpdateError) {
          console.error(
            "Error updating workflow request:",
            workflowUpdateError
          );
          // Don't fail the appointment creation, just log the error
        }
      }

      // Redirect back to appointments list or workflow requests if came from there
      if (workflowRequestId) {
        router.push("/receptionist/workflow-requests?appointment=created");
      } else {
        router.push("/receptionist/appointments?created=true");
      }
    } catch (error: any) {
      console.error("Error creating appointment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getInitialData = (): Partial<AppointmentBookingFormData> => {
    const initialData: Partial<AppointmentBookingFormData> = {};

    // Original pre-filled data
    if (preFilledDate) {
      initialData.scheduled_date = preFilledDate;
    }

    if (preFilledTime) {
      initialData.scheduled_time = preFilledTime;
    }

    if (preFilledDoctorId) {
      initialData.doctor_id = preFilledDoctorId;
    }

    // New pre-filled data from workflow requests
    if (preFilledPatientId) {
      initialData.patient_id = preFilledPatientId;
    }

    if (preFilledAppointmentType) {
      initialData.appointment_type = preFilledAppointmentType;
    }

    if (preFilledNotes) {
      initialData.patient_notes = preFilledNotes;
      initialData.description = preFilledNotes;
    }

    if (preFilledPriority !== undefined) {
      initialData.priority = preFilledPriority;
    }

    return initialData;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Book New Appointment
            </h1>
            <p className="text-muted-foreground">
              Schedule appointments with enhanced patient search and real-time
              availability
            </p>
          </div>
        </div>
      </div>

      {/* Pre-filled Information Card */}
      {(preFilledDate ||
        preFilledTime ||
        preFilledDoctorId ||
        preFilledPatientId ||
        preFilledAppointmentType ||
        opdId) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CheckCircleIcon className="h-5 w-5" />
              {workflowRequestId
                ? "Follow-up Request Details"
                : "Pre-selected Appointment Details"}
            </CardTitle>
            <CardDescription className="text-blue-800">
              {workflowRequestId
                ? "The following details have been pre-filled from the workflow request"
                : "The following details have been pre-filled from your selection"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {preFilledDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Date:</span>
                  <Badge variant="outline" className="text-blue-700">
                    {new Date(preFilledDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
              )}
              {preFilledTime && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Time:</span>
                  <Badge variant="outline" className="text-blue-700">
                    {preFilledTime}
                  </Badge>
                </div>
              )}
              {preFilledDoctorId && (
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Doctor:</span>
                  <Badge variant="outline" className="text-blue-700">
                    Selected Doctor
                  </Badge>
                </div>
              )}
              {preFilledPatientId && (
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Patient:</span>
                  <Badge variant="outline" className="text-blue-700">
                    Pre-selected
                  </Badge>
                </div>
              )}
              {preFilledAppointmentType && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline" className="text-blue-700">
                    {preFilledAppointmentType.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              )}
              {opdId && (
                <div className="flex items-center gap-2">
                  <StethoscopeIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">OPD Session:</span>
                  <Badge variant="outline" className="text-blue-700">
                    {opdId.slice(-8)}
                  </Badge>
                </div>
              )}
              {preFilledPriority && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Priority:</span>
                  <Badge
                    variant="outline"
                    className="text-red-700 border-red-300"
                  >
                    HIGH PRIORITY
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Appointment Booking Form */}
      <AppointmentBookingForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        initialData={getInitialData()}
      />
    </div>
  );
}
