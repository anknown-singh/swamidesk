"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Types
import {
  BaseConsultationSession,
  BaseConsultationStep,
  BaseStepComponentProps,
} from "../shared/base-consultation-workflow";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dental Step Components
import { DentalChiefComplaintsForm } from "./dental-chief-complaints-form";
import { DentalExaminationForm } from "./dental-examination-form";
import { DentalDiagnosisForm } from "./dental-diagnosis-form";
import { DentalTreatmentPlanForm } from "./dental-treatment-plan-form";
import { DentalConsultationSummary } from "./dental-consultation-summary";

interface DentalConsultationWorkflowProps {
  appointmentId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

// Dental consultation steps (no vitals needed for dental)
const DENTAL_CONSULTATION_STEPS: BaseConsultationStep[] = [
  "chief_complaints",
  "examination",
  "diagnosis",
  "treatment",
  "completed",
];

const STEP_NAMES: Record<BaseConsultationStep, string> = {
  chief_complaints: "Chief Complaints",
  history: "Medical History",
  vitals: "Vital Signs",
  examination: "Dental Examination",
  diagnosis: "Diagnosis",
  investigations: "Investigations",
  treatment: "Treatment Plan",
  completed: "Summary",
};

export function DentalConsultationWorkflow({
  appointmentId,
  onComplete,
  onCancel,
}: DentalConsultationWorkflowProps) {
  const router = useRouter();
  const [session, setSession] = useState<BaseConsultationSession | null>(null);
  const [currentStep, setCurrentStep] =
    useState<BaseConsultationStep>("chief_complaints");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);

  const supabase = createClient();

  // Get current step index
  const currentStepIndex = DENTAL_CONSULTATION_STEPS.indexOf(currentStep);
  const progress =
    ((currentStepIndex + 1) / DENTAL_CONSULTATION_STEPS.length) * 100;

  // Fetch appointment and patient data
  const fetchAppointmentData = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select(
          `
          *,
          patients (
            id,
            full_name,
            phone,
            email,
            date_of_birth,
            address
          )
        `
        )
        .eq("id", appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      setAppointment(appointmentData);
      setPatient(appointmentData.patients);
    } catch (err) {
      console.error("Error fetching appointment data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load appointment data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, supabase]);

  // Fetch or create consultation session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check for existing session
      const { data: existingSession, error: sessionError } = await supabase
        .from("consultation_sessions")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (sessionError && sessionError.code !== "PGRST116") {
        throw sessionError;
      }

      if (existingSession) {
        setSession(existingSession as BaseConsultationSession);
        setCurrentStep(
          (existingSession.current_step as BaseConsultationStep) ||
            "chief_complaints"
        );
      } else {
        // Create new session
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const newSession = {
          appointment_id: appointmentId,
          patient_id: appointment?.patient_id || patient?.id,
          doctor_id: user.id,
          current_step: "chief_complaints",
          is_completed: false,
        };

        const { data: createdSession, error: createError } = await supabase
          .from("consultation_sessions")
          .insert([newSession])
          .select()
          .single();

        if (createError) throw createError;

        setSession(createdSession as BaseConsultationSession);
        setCurrentStep("chief_complaints");
      }
    } catch (err) {
      console.error("Error initializing session:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initialize consultation session"
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, appointment, patient, supabase]);

  // Save step data - for dental consultations, data is saved in specific dental tables
  const saveStepData = useCallback(
    async (step: BaseConsultationStep, data: any) => {
      if (!session) return;

      try {
        setIsLoading(true);

        // Only update the current step in consultation_sessions
        // The actual data is saved by individual step components to dental tables
        const { error: updateError } = await supabase
          .from("consultation_sessions")
          .update({
            current_step: step,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        if (updateError) throw updateError;

        setSession((prev) =>
          prev
            ? {
                ...prev,
                current_step: step,
              }
            : null
        );
      } catch (err) {
        console.error("Error saving step data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to save step data"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [session, supabase]
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < DENTAL_CONSULTATION_STEPS.length) {
      setCurrentStep(DENTAL_CONSULTATION_STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(DENTAL_CONSULTATION_STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  // Complete consultation
  const completeConsultation = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);

      const { error: completeError } = await supabase
        .from("consultation_sessions")
        .update({
          is_completed: true,
          ended_at: new Date().toISOString(),
          current_step: "completed",
        })
        .eq("id", session.id);

      if (completeError) throw completeError;

      setSession((prev) =>
        prev
          ? {
              ...prev,
              is_completed: true,
              ended_at: new Date().toISOString(),
              current_step: "completed",
            }
          : null
      );

      setCurrentStep("completed");

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Error completing consultation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete consultation"
      );
    } finally {
      setIsLoading(false);
    }
  }, [session, supabase, onComplete]);

  // Initialize data on mount
  useEffect(() => {
    fetchAppointmentData();
  }, [fetchAppointmentData]);

  useEffect(() => {
    if (appointment && patient) {
      initializeSession();
    }
  }, [appointment, patient, initializeSession]);

  // Render current step component
  const renderStep = () => {
    if (!session || !patient) return null;

    const stepProps: BaseStepComponentProps = {
      consultationId: session.id,
      patientId: patient.id,
      appointmentId: appointmentId,
      onNext: nextStep,
      onPrevious: previousStep,
      onSave: (data) => saveStepData(currentStep, data),
      isReadOnly: session.is_completed,
    };

    switch (currentStep) {
      case "chief_complaints":
        return <DentalChiefComplaintsForm {...stepProps} />;
      case "examination":
        return <DentalExaminationForm {...stepProps} />;
      case "diagnosis":
        return <DentalDiagnosisForm {...stepProps} />;
      case "treatment":
        return <DentalTreatmentPlanForm {...stepProps} />;
      case "completed":
        return <DentalConsultationSummary {...stepProps} />;
      default:
        return <div>Step not implemented</div>;
    }
  };

  if (isLoading && !session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dental consultation...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  console.log("Dental Consultation Workflow!");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Dental Consultation</CardTitle>
                <CardDescription>
                  {patient?.full_name} • {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {session?.is_completed && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Progress</h3>
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of{" "}
                {DENTAL_CONSULTATION_STEPS.length}
              </span>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex justify-between text-xs text-muted-foreground">
              {DENTAL_CONSULTATION_STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`
                    ${
                      index === currentStepIndex
                        ? "text-blue-600 font-medium"
                        : ""
                    }
                    ${index < currentStepIndex ? "text-green-600" : ""}
                  `}
                >
                  {STEP_NAMES[step]}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[500px]">{renderStep()}</div>

      {/* Navigation */}
      {!session?.is_completed && currentStep !== "completed" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={currentStepIndex === 0 || isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                {STEP_NAMES[currentStep]}
              </div>

              {currentStepIndex === DENTAL_CONSULTATION_STEPS.length - 2 ? (
                <Button
                  onClick={completeConsultation}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete Consultation
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={isLoading}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
