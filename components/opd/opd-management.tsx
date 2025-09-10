"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  StethoscopeIcon,
  PillIcon,
  CalendarIcon,
  FileTextIcon,
  SaveIcon,
  XIcon,
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  Upload,
  Download,
  FileText,
  PlusIcon,
} from "lucide-react";
import { createAuthenticatedClient } from "@/lib/supabase/authenticated-client";
import { ConsultationWorkflow } from "@/components/consultation/consultation-workflow";

interface Patient {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  gender: string;
  date_of_birth: string;
  address?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  patient?: {
    id: string;
    full_name?: string;
    name?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    gender: string;
    date_of_birth: string;
    address?: string;
  };
}

interface OPDManagementProps {
  userRole: "admin" | "doctor" | "receptionist";
  userId?: string;
  prefilledOpdId?: string;
  prefilledPatientId?: string | null;
}

export function OPDManagement({ 
  userRole, 
  userId,
  prefilledOpdId,
  prefilledPatientId
}: OPDManagementProps) {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveUserId, setEffectiveUserId] = useState<string>("");
  const [userIdLoading, setUserIdLoading] = useState(true);
  const [showConsultationWorkflow, setShowConsultationWorkflow] =
    useState(false);
  const [workflowData, setWorkflowData] = useState({
    conductedDate: new Date().toISOString().split("T")[0],
    furtherSuggestions: "",
  });
  const [showVisitWorkflow, setShowVisitWorkflow] = useState(false);
  const [visitWorkflowStarted, setVisitWorkflowStarted] = useState(false);
  const [showFullConsultationWorkflow, setShowFullConsultationWorkflow] =
    useState(false);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [consultationSession, setConsultationSession] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [consultationSummary, setConsultationSummary] = useState<any>(null);
  const [uploadingReport, setUploadingReport] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState({
    summary: "",
    interpretation: "",
  });
  const [showFollowUpWorkflow, setShowFollowUpWorkflow] = useState(false);
  const [showFollowUpOptions, setShowFollowUpOptions] = useState(false);
  const [showTreatmentWorkflow, setShowTreatmentWorkflow] = useState(false);
  const [followUpRequested, setFollowUpRequested] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    scheduledDate: "",
    followUpType: "follow_up",
    notes: "",
    isImmediate: false,
  });
  const [treatmentData, setTreatmentData] = useState({
    treatmentType: "medication",
    duration: "",
    instructions: "",
    isImmediate: false,
  });
  const [opdRecord, setOpdRecord] = useState<Record<string, unknown> | null>(
    null
  );
  const [opdRecordId, setOpdRecordId] = useState<string | null>(null);
  const [isCreatingOPD, setIsCreatingOPD] = useState<boolean>(false);
  const [opdCreationFailed, setOpdCreationFailed] = useState<boolean>(false);
  
  // New state for OPD records list
  const [opdRecords, setOpdRecords] = useState<any[]>([]);
  const [loadingOpdRecords, setLoadingOpdRecords] = useState<boolean>(false);

  // Fetch today's appointments that need OPD
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createAuthenticatedClient();
      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("appointments")
        .select(
          `
          *,
          patients(id, full_name, phone, email, gender, date_of_birth, address)
        `
        )
        .eq("scheduled_date", today)
        .in("status", ["arrived", "in_progress", "confirmed"])
        .eq("appointment_type", "consultation");

      // Filter by doctor if user is a doctor
      if (userRole === "doctor" && (userId || effectiveUserId)) {
        const userIdToUse = effectiveUserId || userId;
        query = query.eq("doctor_id", userIdToUse);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match our interface
      const transformedData: Appointment[] = (data || []).map((apt) => ({
        ...apt,
        patient: apt.patients
          ? {
              id: apt.patients.id,
              name: apt.patients.full_name,
              mobile: apt.patients.phone,
              email: apt.patients.email,
              gender: apt.patients.gender,
              date_of_birth: apt.patients.date_of_birth,
              address: apt.patients.address,
            }
          : undefined,
      }));

      setAppointments(transformedData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [userRole, userId, effectiveUserId]);

  // Fetch specific patient if patient ID is provided in URL or props
  const fetchPatientFromWorkflow = useCallback(async () => {
    const patientId = prefilledPatientId || searchParams.get("patientId");
    if (!patientId) return;

    try {
      const supabase = createAuthenticatedClient();
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, gender, date_of_birth, address")
        .eq("id", patientId)
        .single();

      if (error) throw error;

      const patient: Patient = {
        id: data.id,
        name: data.full_name,
        mobile: data.phone,
        email: data.email,
        gender: data.gender,

        date_of_birth: data.date_of_birth,
        address: data.address,
      };

      setSelectedPatient(patient);
      // Auto-show visit workflow tile when navigated from appointment slot
      setShowVisitWorkflow(true);

      // Load specific OPD record if provided, otherwise create or fetch a new one
      if (prefilledOpdId) {
        await loadSpecificOPDRecord(prefilledOpdId);
      } else {
        await createOrFetchOPDRecord(data.id);
      }

      // Check for existing consultation session for this patient
      await checkConsultationStatus(data.id);
    } catch (error) {
      console.error("Error fetching patient:", error);
    }
  }, [searchParams, prefilledPatientId, prefilledOpdId]);

  // Create or fetch OPD record for a patient
  const createOrFetchOPDRecord = async (patientId: string) => {
    setIsCreatingOPD(true);
    setOpdCreationFailed(false);
    try {
      console.log("Starting OPD record creation/fetch for patient:", patientId);
      const supabase = createAuthenticatedClient();
      const today = new Date().toISOString().split("T")[0];
      console.log("Today's date:", today);

      // First, check if OPD record exists for today
      console.log("Checking for existing OPD record...");
      const { data: existingRecord, error: fetchError } = await supabase
        .from("opd_records")
        .select("*")
        .eq("patient_id", patientId)
        .gte("created_at", today + "T00:00:00.000Z").lt("created_at", today + "T23:59:59.999Z")
        .single();

      console.log("Existing record query result:", {
        existingRecord,
        fetchError,
      });

      if (existingRecord && !fetchError) {
        console.log("Found existing OPD record:", existingRecord.id);
        setOpdRecord(existingRecord);
        setOpdRecordId(existingRecord.id);
        setIsCreatingOPD(false);
        return existingRecord;
      }

      // Handle case where fetchError exists but it's a "not found" error (which is expected)
      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Unexpected error fetching existing record:", fetchError);
        throw fetchError;
      }

      // Create new OPD record if none exists
      console.log("Creating new OPD record...");
      console.log("User ID for creation:", effectiveUserId);

      if (!effectiveUserId) {
        throw new Error("User ID is required to create OPD record");
      }
      const { data: newRecord, error: createError } = await supabase
        .from("opd_records")
        .insert({
          patient_id: patientId,
                    token_number: Math.floor(Math.random() * 999) + 1, // Simple token generation
          opd_status: "consultation",
                    created_by: effectiveUserId,
        })
        .select()
        .single();

      console.log("Create record result:", { newRecord, createError });

      if (createError) {
        console.error("Create error details:", createError);
        throw createError;
      }

      console.log("Successfully created OPD record:", newRecord.id);
      setOpdRecord(newRecord);
      setOpdRecordId(newRecord.id);
      console.log("State updated with new record");
      return newRecord;
    } catch (error) {
      console.error("Error creating/fetching OPD record:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setOpdCreationFailed(true);
      return null;
    } finally {
      setIsCreatingOPD(false);
    }
  };

  // Load a specific OPD record by ID (used when navigating from appointment with OPD ID)
  const loadSpecificOPDRecord = async (opdRecordId: string) => {
    setIsCreatingOPD(true);
    setOpdCreationFailed(false);
    try {
      console.log("Loading specific OPD record:", opdRecordId);
      const supabase = createAuthenticatedClient();

      // Fetch the specific OPD record
      const { data: opdRecord, error: fetchError } = await supabase
        .from("opd_records")
        .select("*")
        .eq("id", opdRecordId)
        .single();

      if (fetchError) {
        console.error("Error fetching specific OPD record:", fetchError);
        throw fetchError;
      }

      if (opdRecord) {
        console.log("Successfully loaded specific OPD record:", opdRecord.id);
        setOpdRecord(opdRecord);
        setOpdRecordId(opdRecord.id);
        setIsCreatingOPD(false);
        return opdRecord;
      } else {
        throw new Error("OPD record not found");
      }
    } catch (error) {
      console.error("Error loading specific OPD record:", error);
      setOpdCreationFailed(true);
      return null;
    } finally {
      setIsCreatingOPD(false);
    }
  };

  // Fetch all OPD records for the authenticated doctor
  const fetchDoctorOpdRecords = useCallback(async () => {
    if (!effectiveUserId || userRole !== 'doctor') return;
    
    setLoadingOpdRecords(true);
    try {
      const supabase = createAuthenticatedClient();
      
      // Fetch OPD records where the doctor is involved (created_by or via appointments)
      const { data: opdRecords, error } = await supabase
        .from('opd_records')
        .select(`
          id,
          patient_id,
          token_number,
          opd_status,
          created_at,
          patients (
            id,
            full_name,
            phone,
            email,
            gender,
            date_of_birth
          )
        `)
        .eq('created_by', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctor OPD records:', error);
        return;
      }

      console.log('Fetched OPD records for doctor:', opdRecords?.length || 0);
      setOpdRecords(opdRecords || []);
    } catch (error) {
      console.error('Error fetching OPD records:', error);
    } finally {
      setLoadingOpdRecords(false);
    }
  }, [effectiveUserId, userRole]);

  // Update OPD record status
  const updateOPDRecordStatus = async (status: string) => {
    if (!opdRecordId) return;

    try {
      const supabase = createAuthenticatedClient();
      const { error } = await supabase
        .from("opd_records")
        .update({
          opd_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opdRecordId);

      if (error) throw error;

      setOpdRecord((prev: any | null) =>
        prev ? { ...prev, opd_status: status } : null
      );
    } catch (error) {
      console.error("Error updating OPD record status:", error);
    }
  };

  // Initialize effective userId with fallback mechanisms
  useEffect(() => {
    setUserIdLoading(true);

    // Try to get userId from props first
    if (userId) {
      setEffectiveUserId(userId);
      setUserIdLoading(false);
      return;
    } else {
      // Add a small delay to ensure localStorage is accessible after page load
      const timeout = setTimeout(() => {
        // Fallback: Try to get from localStorage
        try {
          const storedUser = localStorage.getItem("swamicare_user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData?.id) {
              setEffectiveUserId(userData.id);
              console.log(
                "Using fallback userId from localStorage:",
                userData.id
              );
            }
          }
        } catch (error) {
          console.error("Error reading user from localStorage:", error);
        }
        setUserIdLoading(false);
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timeout);
    }
  }, [userId]);

  useEffect(() => {
    fetchAppointments();
    fetchPatientFromWorkflow();
  }, [fetchAppointments, fetchPatientFromWorkflow]);

  // Fetch OPD records for doctor when component loads
  useEffect(() => {
    if (userRole === 'doctor' && effectiveUserId && !userIdLoading) {
      fetchDoctorOpdRecords();
    }
  }, [userRole, effectiveUserId, userIdLoading, fetchDoctorOpdRecords]);

  const handlePatientSelect = async (appointment: Appointment) => {
    if (appointment.patient) {
      // Transform the patient data to match the Patient interface
      const patient: Patient = {
        id: appointment.patient.id,
        name: appointment.patient.full_name || appointment.patient.name,
        mobile: appointment.patient.phone || appointment.patient.mobile,
        email: appointment.patient.email,
        gender: appointment.patient.gender,
        date_of_birth: appointment.patient.date_of_birth,
        address: appointment.patient.address,
      };
      
      setSelectedPatient(patient);
      // Create or fetch OPD record for the patient
      await createOrFetchOPDRecord(appointment.patient.id);
      // Check consultation status when selecting from appointment list
      await checkConsultationStatus(appointment.patient.id);
    }
  };

  // Check consultation status for the patient
  const checkConsultationStatus = useCallback(async (patientId: string) => {
    if (!patientId) return;

    try {
      const supabase = createAuthenticatedClient();
      const today = new Date().toISOString().split("T")[0];

      // First, look for visits for this patient today
      const { data: visits, error: visitError } = await supabase
        .from("visits")
        .select("id")
        .eq("patient_id", patientId)
        .gte("created_at", today + "T00:00:00.000Z").lt("created_at", today + "T23:59:59.999Z")
        .order("created_at", { ascending: false });

      if (visitError) {
        console.error("Error checking visits:", visitError);
        return;
      }

      if (!visits || visits.length === 0) return;

      // Look for consultation session for any of today's visits
      const visitIds = visits.map((v) => v.id);
      const { data: session, error: sessionError } = await supabase
        .from("consultation_sessions")
        .select("*")
        .in("visit_id", visitIds)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (sessionError && sessionError.code !== "PGRST116") {
        console.error("Error checking consultation session:", sessionError);
        return;
      }

      if (session) {
        console.log("Found consultation session:", session);
        setConsultationSession(session);
        setVisitWorkflowStarted(true);
        setVisitId(session.visit_id);

        // Always fetch summary data to show current progress
        console.log(
          "Fetching consultation summary data, status:",
          session.is_completed ? "completed" : "in progress"
        );
        await fetchConsultationSummary(session.id);

        if (!session.is_completed) {
          console.log(
            "Consultation is in progress, current step:",
            session.current_step
          );
        }
      } else {
        console.log("No consultation session found for patient");
      }
    } catch (error) {
      console.error("Error checking consultation status:", error);
    }
  }, []);

  // Fetch consultation summary data
  const fetchConsultationSummary = async (consultationId: string) => {
    try {
      const supabase = createAuthenticatedClient();

      console.log(
        "=== Starting consultation summary fetch for ID:",
        consultationId
      );

      // Fetch basic consultation data
      const { data: session, error: sessionError } = await supabase
        .from("consultation_sessions")
        .select("*")
        .eq("id", consultationId)
        .single();

      if (sessionError) {
        console.error("❌ Error fetching session:", sessionError);
        return; // Exit early if session doesn't exist
      }
      console.log("✅ Session data loaded:", session);

      // Fetch chief complaints
      const { data: chiefComplaints, error: complaintsError } = await supabase
        .from("consultation_chief_complaints")
        .select("*")
        .eq("consultation_id", consultationId);

      if (complaintsError) {
        console.error("❌ Error fetching chief complaints:", complaintsError);
      }
      console.log(
        "✅ Chief complaints data:",
        chiefComplaints?.length || 0,
        "records"
      );

      // Fetch medical history
      const { data: history, error: historyError } = await supabase
        .from("consultation_history")
        .select("*")
        .eq("consultation_id", consultationId);

      if (historyError) {
        console.error("❌ Error fetching history:", historyError);
      }
      console.log("✅ History data:", history?.length || 0, "records");

      // Fetch vitals (latest)
      const { data: vitals, error: vitalsError } = await supabase
        .from("consultation_vitals")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (vitalsError) {
        console.error("❌ Error fetching vitals:", vitalsError);
      }
      console.log("✅ Vitals data:", vitals?.length || 0, "records");

      // Fetch examination findings
      const { data: examination, error: examinationError } = await supabase
        .from("examination_findings")
        .select("*")
        .eq("consultation_id", consultationId);

      if (examinationError) {
        console.error("❌ Error fetching examination:", examinationError);
      }
      console.log("✅ Examination data:", examination?.length || 0, "records");

      // Fetch diagnosis
      const { data: diagnosis, error: diagnosisError } = await supabase
        .from("consultation_diagnoses")
        .select("*")
        .eq("consultation_id", consultationId);

      if (diagnosisError) {
        console.error("❌ Error fetching diagnosis:", diagnosisError);
      }
      console.log("✅ Diagnosis data:", diagnosis?.length || 0, "records");

      // Fetch investigations
      const { data: investigations, error: investigationsError } =
        await supabase
          .from("investigation_orders")
          .select("*")
          .eq("consultation_id", consultationId);

      if (investigationsError) {
        console.error("❌ Error fetching investigations:", investigationsError);
      }
      console.log(
        "✅ Investigations data:",
        investigations?.length || 0,
        "records"
      );

      // Fetch all treatment plans and select the best one (with medications if available)
      const { data: treatmentPlans, error: treatmentError } = await supabase
        .from("consultation_treatment_plans")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: false });

      console.log("🔍 All treatment plans found:", treatmentPlans);

      // Select the most recent treatment plan that has medications, or fallback to latest
      let treatmentPlan = null;
      if (treatmentPlans && treatmentPlans.length > 0) {
        // First, try to find a treatment plan with medications
        const planWithMedications = treatmentPlans.find(
          (plan) =>
            (plan.medications &&
              Array.isArray(plan.medications) &&
              plan.medications.length > 0) ||
            (plan.plan_details &&
              plan.plan_details.medications &&
              Array.isArray(plan.plan_details.medications) &&
              plan.plan_details.medications.length > 0)
        );

        if (planWithMedications) {
          treatmentPlan = planWithMedications;
          console.log(
            "✅ Selected treatment plan with medications:",
            treatmentPlan.id
          );
        } else {
          // Fallback to the most recent plan
          treatmentPlan = treatmentPlans[0];
          console.log(
            "⚠️ No plans with medications found, using latest:",
            treatmentPlan.id
          );
        }
      }

      if (treatmentError) {
        console.error("❌ Error fetching treatment plan:", treatmentError);
      }
      console.log(
        "✅ Treatment plan data:",
        treatmentPlan ? "1 selected plan" : "no plan found"
      );

      const summaryData = {
        session,
        chiefComplaints: chiefComplaints || [],
        history: history || [],
        vitals: vitals?.[0] || null,
        examination: examination || [],
        diagnosis: diagnosis || [],
        investigations: investigations || [],
        treatmentPlan: treatmentPlan || null,
      };

      console.log("=== FINAL CONSULTATION SUMMARY ===");
      console.log(
        "📋 Chief Complaints:",
        summaryData.chiefComplaints.length,
        "items"
      );
      console.log("📋 History:", summaryData.history.length, "items");
      console.log("📋 Vitals:", summaryData.vitals ? "Yes" : "No");
      console.log("📋 Examination:", summaryData.examination.length, "items");
      console.log("📋 Diagnosis:", summaryData.diagnosis.length, "items");
      console.log(
        "📋 Investigations:",
        summaryData.investigations.length,
        "items"
      );
      console.log(
        "📋 Treatment Plan:",
        summaryData.treatmentPlan ? "Yes" : "No"
      );
      console.log("=== DETAILED EXAMINATION DATA ===");
      summaryData.examination.forEach((exam, i) => {
        console.log(`Exam ${i}:`, exam);
        console.log(`- system_examined:`, exam.system_examined);
        console.log(`- normal_findings:`, exam.normal_findings);
        console.log(`- abnormal_findings:`, exam.abnormal_findings);
        console.log(`- findings:`, exam.findings);
        console.log(`- findings type:`, typeof exam.findings);
      });

      console.log("=== DETAILED DIAGNOSIS DATA ===");
      summaryData.diagnosis.forEach((dx, i) => {
        console.log(`Diagnosis ${i}:`, dx);
        console.log(`- diagnosis:`, dx.diagnosis);
        console.log(`- icd_code:`, dx.icd_code);
        console.log(`- diagnosis_name:`, dx.diagnosis_name);
        console.log(`- primary_diagnosis:`, dx.primary_diagnosis);
      });

      console.log("=== DETAILED TREATMENT PLAN DATA ===");
      if (summaryData.treatmentPlan) {
        console.log(
          "🔍 FULL TREATMENT PLAN OBJECT:",
          JSON.stringify(summaryData.treatmentPlan, null, 2)
        );
        console.log(
          "📋 Treatment Plan Keys:",
          Object.keys(summaryData.treatmentPlan)
        );
        console.log(
          "💊 Direct medications:",
          summaryData.treatmentPlan.medications
        );
        console.log(
          "💊 Medications type:",
          typeof summaryData.treatmentPlan.medications
        );
        console.log(
          "💊 Medications stringified:",
          JSON.stringify(summaryData.treatmentPlan.medications)
        );
        console.log("📝 Plan details:", summaryData.treatmentPlan.plan_details);
        console.log("📑 Plan summary:", summaryData.treatmentPlan.plan_summary);

        // Deep inspection of all possible medication locations
        if (summaryData.treatmentPlan.plan_details) {
          console.log(
            "🔍 Plan details keys:",
            Object.keys(summaryData.treatmentPlan.plan_details)
          );
          console.log(
            "💊 plan_details.medications:",
            summaryData.treatmentPlan.plan_details.medications
          );
          console.log(
            "💊 plan_details stringified:",
            JSON.stringify(summaryData.treatmentPlan.plan_details, null, 2)
          );
        }

        // Check for other possible medication fields
        const possibleMedicationFields = [
          "medication",
          "drugs",
          "prescriptions",
          "medicine",
          "treatment_medications",
        ];
        possibleMedicationFields.forEach((field) => {
          if (summaryData.treatmentPlan[field]) {
            console.log(
              `🔍 Found medications in field '${field}':`,
              summaryData.treatmentPlan[field]
            );
          }
        });
      } else {
        console.log("❌ NO TREATMENT PLAN FOUND");
      }
      console.log("=== END SUMMARY ===");

      setConsultationSummary(summaryData);
    } catch (error) {
      console.error("❌ FATAL: Error fetching consultation summary:", error);
      setConsultationSummary(null);
    }
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setShowConsultationWorkflow(false);
    setShowVisitWorkflow(false);
    setVisitWorkflowStarted(false);
    setWorkflowData({
      conductedDate: new Date().toISOString().split("T")[0],
      furtherSuggestions: "",
    });
  };

  const handleAddConsultationWorkflow = () => {
    setShowConsultationWorkflow(true);
  };

  const handleSaveWorkflow = async () => {
    try {
      // Update OPD record with consultation notes
      if (opdRecordId && workflowData.furtherSuggestions) {
        const supabase = createAuthenticatedClient();
        await supabase
          .from("opd_records")
          .update({
                        opd_status: "consultation",
            updated_at: new Date().toISOString(),
          })
          .eq("id", opdRecordId);
      }

      console.log(
        "Consultation workflow saved successfully to OPD Record:",
        opdRecordId
      );
      console.log(`Workflow saved successfully! OPD ID: ${opdRecordId}`);
    } catch (error) {
      console.error("Error saving workflow:", error);
      console.error("Error saving workflow");
    }
  };

  const handleStartVisitWorkflow = async () => {
    // Use effective userId with fallback mechanisms
    const userIdToUse = effectiveUserId || userId;

    // Enhanced debug logging to identify what's missing
    console.log("handleStartVisitWorkflow called with:", {
      selectedPatient: selectedPatient,
      userId: userId,
      effectiveUserId: effectiveUserId,
      userIdToUse: userIdToUse,
      hasSelectedPatient: !!selectedPatient,
      hasUserId: !!userId,
      hasEffectiveUserId: !!effectiveUserId,
      hasUserIdToUse: !!userIdToUse,
    });

    if (!selectedPatient) {
      console.error("Patient information not loaded. Please refresh the page.");
      return;
    }

    if (!userIdToUse) {
      // Additional debugging for userId resolution
      console.error("UserId resolution failed:", {
        userId,
        effectiveUserId,
        userIdToUse,
        userIdLoading,
        localStorageUser: localStorage.getItem("swamicare_user"),
      });
      console.error("User session not found. Please log in again.");
      return;
    }

    try {
      const supabase = createAuthenticatedClient();

      // Check if a visit already exists for this patient today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingVisit, error: checkError } = await supabase
        .from("visits")
        .select("id")
        .eq("patient_id", selectedPatient.id)
        .gte("created_at", today + "T00:00:00.000Z").lt("created_at", today + "T23:59:59.999Z")
        .eq("doctor_id", userIdToUse)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking for existing visit:", checkError);
      }

      let currentVisitId = existingVisit?.id;

      // Create a new visit if none exists
      if (!currentVisitId) {
        const { data: newVisit, error: createError } = await supabase
          .from("visits")
          .insert({
            patient_id: selectedPatient.id,
            doctor_id: userIdToUse,
                        visit_time: new Date().toTimeString().slice(0, 5),
            status: "waiting",
                      })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating visit:", createError);
          return;
        }

        currentVisitId = newVisit.id;
      }

      setVisitId(currentVisitId);
      setVisitWorkflowStarted(true);
      setShowFullConsultationWorkflow(true);

      // Update consultation status check with correct visitId
      if (selectedPatient?.id) {
        await checkConsultationStatus(selectedPatient.id);
      }
      console.log("Opening comprehensive consultation workflow");
    } catch (error) {
      console.error("Error starting visit workflow:", error);
    }
  };

  const handleConsultationComplete = async () => {
    setShowFullConsultationWorkflow(false);
    // Keep visit workflow visible but mark as completed

    console.log("Consultation completed, refreshing data...");

    // Refresh consultation status to show completion
    if (selectedPatient?.id) {
      await checkConsultationStatus(selectedPatient.id);
    }

    // Small delay to ensure database updates are reflected
    setTimeout(async () => {
      if (consultationSession?.id) {
        console.log("Fetching updated consultation summary after completion");
        await fetchConsultationSummary(String(consultationSession.id));
      }
    }, 1000);

    console.log("Consultation completed successfully");
  };

  const handleConsultationCancel = async () => {
    setShowFullConsultationWorkflow(false);
    // Keep the visit workflow tile visible but reset the started state
    setVisitWorkflowStarted(false);

    console.log("Returned to OPD workflow, refreshing consultation summary...");

    // Refresh consultation summary to show any changes made during the consultation
    if (consultationSession?.id) {
      await fetchConsultationSummary(String(consultationSession.id));
    }
  };

  // Mark consultation/visit as completed
  const handleMarkAsCompleted = async () => {
    if (!consultationSession || !selectedPatient) {
      console.error("No consultation session or patient selected");
      return;
    }

    try {
      console.log("Marking consultation as completed...");
      const supabase = createAuthenticatedClient();

      // Update consultation session as completed
      const now = new Date().toISOString();
      const { error: sessionError } = await supabase
        .from("consultation_sessions")
        .update({
          is_completed: true,
          ended_at: now,
          current_step: "completed",
        })
        .eq("id", String(consultationSession.id));

      if (sessionError) {
        console.error("Error updating consultation session:", sessionError);
        throw sessionError;
      }

      // Update visit status to completed
      if (visitId) {
        const { error: visitError } = await supabase
          .from("visits")
          .update({
            status: "completed",
            updated_at: now,
          })
          .eq("id", visitId);

        if (visitError) {
          console.error("Error updating visit status:", visitError);
          throw visitError;
        }
      }

      // Update OPD record status to completed
      await updateOPDRecordStatus("completed");

      // Refresh consultation status and summary
      await checkConsultationStatus(selectedPatient.id);
      if (consultationSession?.id) {
        await fetchConsultationSummary(String(consultationSession.id));
      }

      console.log("✅ Successfully marked consultation as completed");
    } catch (error) {
      console.error("❌ Error marking consultation as completed:", error);
    }
  };

  // Investigation Report Upload Handler
  const handleUploadReport = async (investigationId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf,.doc,.docx";
    input.multiple = false;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error("File size must be less than 10MB");
        return;
      }

      setUploadingReport(investigationId);

      try {
        const supabase = createAuthenticatedClient();

        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${investigationId}-${Date.now()}.${fileExt}`;
        const filePath = `investigation-reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("medical-files")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          console.error("Failed to upload file. Please try again.");
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("medical-files")
          .getPublicUrl(filePath);

        // Update investigation record with file URL
        const { error: updateError } = await supabase
          .from("investigation_orders")
          .update({
            results: {
              report_file: urlData.publicUrl,
              uploaded_at: new Date().toISOString(),
            },
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", investigationId);

        if (updateError) {
          console.error("Database update error:", updateError);
          console.error("File uploaded but failed to update record. Please try again.");
          return;
        }

        // Refresh consultation summary
        if (consultationSession?.id) {
          await fetchConsultationSummary(String(consultationSession.id));
        }

        console.log("Report uploaded successfully!");
      } catch (error) {
        console.error("Error uploading report:", error);
        console.error("Failed to upload report. Please try again.");
      } finally {
        setUploadingReport(null);
      }
    };

    input.click();
  };

  // Investigation Report Download Handler
  const handleDownloadReport = async (
    reportUrl: string,
    investigationName: string
  ) => {
    try {
      const response = await fetch(reportUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${investigationName.replace(/\s+/g, "_")}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      console.error("Failed to download report. Please try again.");
    }
  };

  // Save text-based investigation results
  const handleSaveTextResults = async (investigationId: string) => {
    if (!reportData.summary.trim() && !reportData.interpretation.trim()) {
      console.log("Please enter at least a summary or interpretation");
      return;
    }

    try {
      const supabase = createAuthenticatedClient();

      const { error: updateError } = await supabase
        .from("investigation_orders")
        .update({
          results_summary: reportData.summary,
          interpretation: reportData.interpretation,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", investigationId);

      if (updateError) {
        console.error("Database update error:", updateError);
        console.error("Failed to save results. Please try again.");
        return;
      }

      // Refresh consultation summary
      if (consultationSession?.id) {
        await fetchConsultationSummary(String(consultationSession.id));
      }

      setEditingReport(null);
      setReportData({ summary: "", interpretation: "" });
      console.log("Results saved successfully!");
    } catch (error) {
      console.error("Error saving results:", error);
      console.error("Failed to save results. Please try again.");
    }
  };

  const handleEditReport = (
    investigationId: string,
    currentSummary?: string,
    currentInterpretation?: string
  ) => {
    setEditingReport(investigationId);
    setReportData({
      summary: currentSummary || "",
      interpretation: currentInterpretation || "",
    });
  };

  // Workflow Handler Functions
  const handleFollowUpWorkflow = () => {
    if (!selectedPatient) {
      console.log("Please select a patient first");
      return;
    }
    setShowFollowUpWorkflow(true);
    setFollowUpData({
      scheduledDate:
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] || "", // Default to 1 week from now
      followUpType: "follow_up",
      notes: "",
      isImmediate: false,
    });
  };

  const handleTreatmentWorkflow = () => {
    if (!selectedPatient) {
      console.log("Please select a patient first");
      return;
    }
    setShowTreatmentWorkflow(true);
    setTreatmentData({
      treatmentType: "medication",
      duration: "7 days",
      instructions: "",
      isImmediate: false,
    });
  };

  const handleSaveFollowUp = async () => {
    try {
      const supabase = createAuthenticatedClient();
      const status = followUpData.isImmediate ? "completed" : "scheduled";
      const scheduledDate = followUpData.isImmediate
        ? new Date().toISOString().split("T")[0]
        : followUpData.scheduledDate;

      // Generate appointment number
      const appointmentNumber = `APT-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Create a new appointment for the follow-up
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          appointment_number: appointmentNumber,
          patient_id: selectedPatient!.id,
          doctor_id: effectiveUserId,
          department: "OPD", // Required field for OPD appointments
          scheduled_date: scheduledDate,
          scheduled_time: "09:00:00", // Default time, can be made configurable
          appointment_type: followUpData.followUpType,
          status: status,
          duration: 30, // Default 30 minutes
          notes: `Follow-up: ${followUpData.notes}`,
          created_by: effectiveUserId,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      console.log("Follow-up appointment created:", data);

      // Update OPD record status
      await updateOPDRecordStatus("follow_up_scheduled");

      const message = followUpData.isImmediate
        ? `Follow-up created for ${selectedPatient?.name} - OPD ID: ${opdRecordId}`
        : `Follow-up scheduled for ${selectedPatient?.name} on ${followUpData.scheduledDate} - OPD ID: ${opdRecordId}`;
      console.log(message);
      setShowFollowUpWorkflow(false);
    } catch (error) {
      console.error("Error creating follow-up appointment:", error);
      console.error("Error processing follow-up");
    }
  };

  // New handlers for follow-up options
  const handleShowFollowUpOptions = () => {
    setShowFollowUpOptions(true);
  };

  const handleRequestFollowUp = async () => {
    // Handle follow-up request (patient requests follow-up)
    console.log("🚀 handleRequestFollowUp called");
    console.log("📋 selectedPatient:", selectedPatient);
    console.log("📋 opdRecordId:", opdRecordId);
    
    if (!selectedPatient) {
      console.log("Please select a patient first");
      return;
    }

    if (!opdRecordId) {
      console.error("No OPD session found. Please ensure an OPD session is active.");
      return;
    }

    try {
      const supabase = createAuthenticatedClient();
      
      // Get the first available user profile to use as the requester
      // Since this is just a patient request, any staff member can be the "requested_by"
      const { data: availableProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (profilesError || !availableProfiles || availableProfiles.length === 0) {
        console.error('No user profiles found:', profilesError);
        console.error('System error: No staff profiles found. Please contact administrator.');
        return;
      }

      const workflowData = {
        patient_id: selectedPatient.id,
        request_type: 'follow_up',
        priority: 'medium',
        status: 'pending',
        requested_by: availableProfiles[0].id, // Use first available user profile
        request_details: {
          type: 'follow_up_request',
          notes: 'Patient requested follow-up appointment',
          followUpType: 'follow_up',
          patientName: selectedPatient.name,
          patientMobile: selectedPatient.mobile,
          opdId: opdRecordId, // Include OPD ID to link appointment to this OPD session
        }
      };
      
      console.log("💾 Attempting to save workflow request with data:", workflowData);
      
      // Save workflow request to database
      const { data, error } = await supabase
        .from('workflow_requests')
        .insert(workflowData)
        .select();

      console.log("📤 Insert response - data:", data);
      console.log("❌ Insert response - error:", error);

      if (error) {
        console.error('Error saving workflow request:', error);
        console.error(`Failed to save follow-up request: ${error.message}`);
        return;
      }

      console.log("✅ Successfully saved workflow request!");

      setShowFollowUpOptions(false);
      setFollowUpRequested(true);
      setFollowUpData({
        scheduledDate: "",
        followUpType: "follow_up",
        notes: "Patient requested follow-up",
        isImmediate: false,
      });
      setShowFollowUpWorkflow(true);

      // Show success message
      console.log('Follow-up request has been sent to the receptionist for scheduling.');
    } catch (error) {
      console.error('Error in handleRequestFollowUp:', error);
      console.error('Failed to save follow-up request. Please try again.');
    }
  };

  const handleScheduleFollowUp = () => {
    // Handle direct follow-up scheduling (doctor schedules follow-up)
    if (!selectedPatient) {
      console.log("Please select a patient first");
      return;
    }
    setShowFollowUpOptions(false);
    setFollowUpRequested(true);
    setFollowUpData({
      scheduledDate:
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] || "", // Default to 1 week from now
      followUpType: "follow_up",
      notes: "Doctor scheduled follow-up",
      isImmediate: false,
    });
    setShowFollowUpWorkflow(true);
  };

  const handleSaveTreatment = async () => {
    try {
      const supabase = createAuthenticatedClient();

      // Create a consultation treatment plan entry
      const { data, error } = await supabase
        .from("consultation_treatment_plans")
        .insert({
          consultation_id: consultationSession?.id || null,
          patient_id: selectedPatient!.id,
          treatment_type: treatmentData.treatmentType,
          duration: treatmentData.duration,
          instructions: treatmentData.instructions,
          status: treatmentData.isImmediate ? "completed" : "active",
          created_by: effectiveUserId,
          created_at: new Date().toISOString(),
          completed_at: treatmentData.isImmediate
            ? new Date().toISOString()
            : null,
          medications: JSON.stringify([
            {
              treatment_type: treatmentData.treatmentType,
              duration: treatmentData.duration,
              instructions: treatmentData.instructions,
            },
          ]),
        })
        .select();

      if (error) throw error;

      // Update OPD record with treatment plan
      if (opdRecordId) {
        await supabase
          .from("opd_records")
          .update({
                        opd_status: treatmentData.isImmediate
              ? "treatment_completed"
              : "treatment_planned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", opdRecordId);
      }

      console.log("Treatment plan saved:", data);
      const message = treatmentData.isImmediate
        ? `Treatment applied immediately for ${selectedPatient?.name} - OPD ID: ${opdRecordId}`
        : `Treatment plan created for ${selectedPatient?.name} - OPD ID: ${opdRecordId}`;
      console.log(message);
      setShowTreatmentWorkflow(false);
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      console.error("Error processing treatment");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If a patient is selected, show consultation interface
  if (selectedPatient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OPD</h1>
            <p className="text-muted-foreground">
              Consulting with {selectedPatient.name}
            </p>
          </div>
          <div className="flex gap-2">
            Workflow Action Buttons
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleAddConsultationWorkflow}
            >
              <StethoscopeIcon className="h-4 w-4" />
              Add Consultation
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleFollowUpWorkflow}
            >
              <CalendarIcon className="h-4 w-4" />
              Follow Up
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleTreatmentWorkflow}
            >
              <FileTextIcon className="h-4 w-4" />
              Treatment
            </Button>
            {/* Completion Status Button in Header */}
            {consultationSession && !consultationSession.is_completed ? (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800"
                onClick={handleMarkAsCompleted}
              >
                <CheckCircle2Icon className="h-4 w-4" />
                Mark Completed
              </Button>
            ) : null}
            {/* Show completion status if already completed */}
            {consultationSession?.is_completed ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <CheckCircle2Icon className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            ) : null}
            <Button variant="outline" onClick={handleBackToList}>
              <XIcon className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </div>

        {/* Enhanced Patient Information Card */}
        {selectedPatient && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-6 shadow-sm border border-blue-200">
            {/* Header Section with Patient Name and Status */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full text-white font-semibold text-lg">
                  {selectedPatient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPatient.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Patient ID: {selectedPatient.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* OPD Status Badge */}
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  opdRecord
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : opdCreationFailed
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    opdRecord
                      ? "bg-green-500"
                      : opdCreationFailed
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                {opdRecord
                  ? `OPD-${
                      opdRecord.token_number ||
                      opdRecordId?.slice(-4).toUpperCase()
                    }`
                  : isCreatingOPD
                  ? "Creating OPD..."
                  : opdCreationFailed
                  ? "OPD Creation Failed"
                  : "OPD Pending"}
                {opdCreationFailed && (
                  <button
                    type="button"
                    onClick={() =>
                      selectedPatient &&
                      createOrFetchOPDRecord(selectedPatient.id)
                    }
                    className="ml-2 text-xs underline hover:no-underline"
                    disabled={isCreatingOPD}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {/* Patient Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Mobile */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Mobile
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPatient.mobile || "Not provided"}
                </p>
              </div>

              {/* Gender */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Gender
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {selectedPatient.gender || "Not specified"}
                </p>
              </div>

              {/* Age */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Age
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedPatient.date_of_birth
                    ? `${Math.floor(
                        (Date.now() -
                          new Date(selectedPatient.date_of_birth).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )} years`
                    : "Unknown"}
                </p>
              </div>

              {/* Visit Date */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Visit
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Additional Info Row */}
            {(selectedPatient.address || selectedPatient.email) && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedPatient.address && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-4 h-4">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="truncate">
                        {selectedPatient.address}
                      </span>
                    </div>
                  )}
                  {selectedPatient.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-4 h-4">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <span className="truncate">{selectedPatient.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Initial Patient Consultation - Simplified Design */}
        {showVisitWorkflow && (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              {/* Header with Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {consultationSession?.is_completed ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patient Consultation
                        </h3>
                        <p className="text-sm text-green-600">
                          Completed Successfully
                        </p>
                      </div>
                    </div>
                  ) : visitWorkflowStarted ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <ClockIcon className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patient Consultation
                        </h3>
                        <p className="text-sm text-blue-600">In Progress</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Patient Consultation
                        </h3>
                        <p className="text-sm text-gray-600">Ready to Start</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {consultationSession?.is_completed ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 px-3 py-1"
                  >
                    <CheckCircle2Icon className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : !visitWorkflowStarted ? (
                  <Button
                    onClick={handleStartVisitWorkflow}
                    disabled={userIdLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {userIdLoading ? "Loading..." : "Start Consultation"}
                  </Button>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 px-3 py-1"
                  >
                    <ClockIcon className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                )}
              </div>

              {/* Data Summary - Always show existing data regardless of consultation status */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Consultation Data Summary
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (consultationSession?.id) {
                        console.log(
                          "Manually refreshing consultation summary..."
                        );
                        fetchConsultationSummary(
                          String(consultationSession.id)
                        );
                      }
                    }}
                    className="text-xs h-6 px-2 text-gray-600 hover:text-gray-900"
                    disabled={!consultationSession?.id}
                  >
                    🔄 Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Chief Complaints Summary */}
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold text-xs">
                          1
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Chief Complaints
                      </span>
                      {Array.isArray(consultationSummary?.chiefComplaints) &&
                        consultationSummary.chiefComplaints.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-50 text-blue-700"
                          >
                            {Array.isArray(consultationSummary.chiefComplaints)
                              ? consultationSummary.chiefComplaints.length
                              : 0}
                          </Badge>
                        )}
                    </div>
                    {Array.isArray(consultationSummary?.chiefComplaints) &&
                    consultationSummary.chiefComplaints.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {consultationSummary.chiefComplaints
                          .slice(0, 5)
                          .map((complaint: any, index: number) => (
                            <div
                              key={index}
                              className="text-blue-700 text-sm leading-relaxed"
                            >
                              •{" "}
                              {(() => {
                                let complaintText = "";
                                if (typeof complaint.complaint === "string") {
                                  complaintText = complaint.complaint;
                                } else if (
                                  typeof complaint.complaint === "object" &&
                                  complaint.complaint.text
                                ) {
                                  complaintText = String(
                                    complaint.complaint.text
                                  );
                                } else if (
                                  typeof complaint.complaint === "object"
                                ) {
                                  complaintText =
                                    String(
                                      Object.values(complaint.complaint)[0]
                                    ) || JSON.stringify(complaint.complaint);
                                } else {
                                  complaintText = String(
                                    complaint.complaint || "Unknown complaint"
                                  );
                                }

                                // Truncate if too long for summary
                                const maxLength = 120;
                                if (complaintText.length > maxLength) {
                                  return (
                                    complaintText.substring(0, maxLength) +
                                    "..."
                                  );
                                }
                                return complaintText;
                              })()}
                              {complaint.duration && (
                                <span className="text-gray-600 text-xs">
                                  {" "}
                                  (
                                  {typeof complaint.duration === "string"
                                    ? complaint.duration
                                    : String(complaint.duration)}
                                  )
                                </span>
                              )}
                              {complaint.severity && (
                                <span className="text-orange-600 text-xs">
                                  {" "}
                                  - Severity:{" "}
                                  {typeof complaint.severity === "string"
                                    ? complaint.severity
                                    : String(complaint.severity)}
                                  /10
                                </span>
                              )}
                            </div>
                          ))}
                        {Array.isArray(consultationSummary.chiefComplaints) &&
                          consultationSummary.chiefComplaints.length > 5 && (
                            <div className="text-blue-600 text-xs font-medium">
                              +
                              {Array.isArray(
                                consultationSummary.chiefComplaints
                              )
                                ? consultationSummary.chiefComplaints.length - 5
                                : 0}{" "}
                              more complaints
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No complaints recorded
                      </div>
                    )}
                  </div>

                  {/* Medical History Summary */}
                  <div className="bg-white rounded-lg p-4 border border-yellow-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-700 font-semibold text-xs">
                          2
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Medical History
                      </span>
                      {Array.isArray(consultationSummary?.history) &&
                        consultationSummary.history.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-50 text-yellow-700"
                          >
                            {Array.isArray(consultationSummary.history)
                              ? consultationSummary.history.length
                              : 0}
                          </Badge>
                        )}
                    </div>
                    {Array.isArray(consultationSummary?.history) &&
                    consultationSummary.history.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {consultationSummary.history
                          .slice(0, 5)
                          .map((hist: any, index: number) => (
                            <div
                              key={index}
                              className="text-yellow-700 text-sm leading-relaxed"
                            >
                              •{" "}
                              <span className="font-medium">
                                {hist.history_type
                                  ?.replace("_", " ")
                                  .toUpperCase()}
                              </span>
                              {hist.content && (
                                <div className="text-gray-600 text-xs ml-2 mt-0.5 leading-relaxed">
                                  {(() => {
                                    let textContent = "";
                                    if (typeof hist.content === "string") {
                                      textContent = hist.content;
                                    } else if (
                                      typeof hist.content === "object" &&
                                      hist.content.text
                                    ) {
                                      // Extract text from JSON object like {"text": "actual content"}
                                      textContent = hist.content.text;
                                    } else if (
                                      typeof hist.content === "object"
                                    ) {
                                      // If it's an object but no text property, try to extract meaningful content
                                      textContent =
                                        String(
                                          Object.values(hist.content)[0]
                                        ) || JSON.stringify(hist.content);
                                    } else {
                                      textContent = String(hist.content);
                                    }

                                    // Truncate long text for summary view
                                    const maxLength = 150;
                                    if (textContent.length > maxLength) {
                                      return (
                                        textContent.substring(0, maxLength) +
                                        "..."
                                      );
                                    }
                                    return textContent;
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        {consultationSummary.history.length > 5 && (
                          <div className="text-yellow-600 text-xs font-medium">
                            +{consultationSummary.history.length - 5} more
                            history entries
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No history recorded
                      </div>
                    )}
                  </div>
                </div>

                {/* Second Row - Vital Signs, Examination, and more detailed sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  {/* Vital Signs Summary */}
                  <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-700 font-semibold text-xs">
                          3
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Vital Signs
                      </span>
                    </div>
                    {consultationSummary?.vitalSigns &&
                    typeof consultationSummary.vitalSigns === "object" ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {consultationSummary.vitalSigns?.pulse_rate && (
                            <div className="text-teal-700 text-sm">
                              <span className="font-medium">Pulse:</span>{" "}
                              {consultationSummary.vitalSigns.pulse_rate} bpm
                            </div>
                          )}
                          {consultationSummary.vitalSigns
                            ?.blood_pressure_systolic &&
                            consultationSummary.vitalSigns
                              ?.blood_pressure_diastolic && (
                              <div className="text-teal-700 text-sm">
                                <span className="font-medium">BP:</span>{" "}
                                {
                                  consultationSummary.vitalSigns
                                    .blood_pressure_systolic
                                }
                                /
                                {
                                  consultationSummary.vitalSigns
                                    .blood_pressure_diastolic
                                }
                              </div>
                            )}
                          {consultationSummary.vitalSigns?.temperature && (
                            <div className="text-teal-700 text-sm">
                              <span className="font-medium">Temp:</span>{" "}
                              {consultationSummary.vitalSigns.temperature}°F
                            </div>
                          )}
                          {consultationSummary.vitalSigns
                            ?.oxygen_saturation && (
                            <div className="text-teal-700 text-sm">
                              <span className="font-medium">O2 Sat:</span>{" "}
                              {consultationSummary.vitalSigns.oxygen_saturation}
                              %
                            </div>
                          )}
                          {consultationSummary.vitalSigns?.weight_kg && (
                            <div className="text-teal-700 text-sm">
                              <span className="font-medium">Weight:</span>{" "}
                              {consultationSummary.vitalSigns.weight_kg} kg
                            </div>
                          )}
                          {consultationSummary.vitalSigns?.height_cm && (
                            <div className="text-teal-700 text-sm">
                              <span className="font-medium">Height:</span>{" "}
                              {consultationSummary.vitalSigns.height_cm} cm
                            </div>
                          )}
                        </div>
                        {consultationSummary.vitalSigns?.weight_kg &&
                          consultationSummary.vitalSigns?.height_cm && (
                            <div className="text-teal-600 text-sm font-medium">
                              BMI:{" "}
                              {(
                                Number(
                                  consultationSummary.vitalSigns.weight_kg
                                ) /
                                Math.pow(
                                  Number(
                                    consultationSummary.vitalSigns.height_cm
                                  ) / 100,
                                  2
                                )
                              ).toFixed(1)}{" "}
                              kg/m²
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No vitals recorded
                      </div>
                    )}
                  </div>

                  {/* Physical Examination Summary */}
                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-pink-700 font-semibold text-xs">
                          4
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Physical Examination
                      </span>
                      {Array.isArray(consultationSummary?.examination) &&
                        consultationSummary.examination.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-pink-50 text-pink-700"
                          >
                            {Array.isArray(consultationSummary.examination)
                              ? consultationSummary.examination.length
                              : 0}
                          </Badge>
                        )}
                    </div>
                    {Array.isArray(consultationSummary?.examination) &&
                    consultationSummary.examination.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {consultationSummary.examination
                          .slice(0, 6)
                          .map((exam: any, index: number) => {
                            const systemName =
                              exam.examination_type ||
                              exam.system_examined ||
                              exam.system ||
                              "General Examination";
                            const hasFindings =
                              exam.findings ||
                              exam.abnormal_findings ||
                              exam.normal_findings !== undefined;

                            // Convert to string and skip if empty
                            const systemNameStr =
                              typeof systemName === "string"
                                ? systemName
                                : typeof systemName === "object"
                                ? JSON.stringify(systemName)
                                : String(systemName);

                            if (!systemNameStr || systemNameStr.trim() === "")
                              return null;

                            return (
                              <div
                                key={index}
                                className="text-pink-700 text-sm leading-relaxed"
                              >
                                •{" "}
                                <span className="font-medium">
                                  {systemNameStr}
                                </span>
                                {exam.normal_findings === false && (
                                  <span className="text-red-600 text-xs ml-1">
                                    (Abnormal)
                                  </span>
                                )}
                                {exam.normal_findings === true && (
                                  <span className="text-green-600 text-xs ml-1">
                                    (Normal)
                                  </span>
                                )}
                                {hasFindings &&
                                  exam.normal_findings === undefined && (
                                    <span className="text-gray-600 text-xs ml-1">
                                      (Examined)
                                    </span>
                                  )}
                              </div>
                            );
                          })}
                        {consultationSummary.examination.length > 6 && (
                          <div className="text-pink-600 text-xs font-medium">
                            +{consultationSummary.examination.length - 6} more
                            systems
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No examination recorded
                      </div>
                    )}
                  </div>
                </div>

                {/* Third Row - Clinical findings and treatment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                  {/* Diagnosis Summary */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-700 font-semibold text-xs">
                          5
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Diagnosis
                      </span>
                      {Array.isArray(consultationSummary?.diagnosis) &&
                        consultationSummary.diagnosis.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-purple-50 text-purple-700"
                          >
                            {Array.isArray(consultationSummary.diagnosis)
                              ? consultationSummary.diagnosis.length
                              : 0}
                          </Badge>
                        )}
                    </div>
                    {Array.isArray(consultationSummary?.diagnosis) &&
                    consultationSummary.diagnosis.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {consultationSummary.diagnosis
                          .slice(0, 4)
                          .map((dx: any, index: number) => {
                            const diagnosisName =
                              dx.diagnosis_name || dx.diagnosis || dx.condition;
                            const diagnosisCode = dx.icd_code || dx.code;

                            // Convert to string and skip if empty
                            const diagnosisNameStr =
                              typeof diagnosisName === "string"
                                ? diagnosisName
                                : typeof diagnosisName === "object"
                                ? JSON.stringify(diagnosisName)
                                : String(diagnosisName || "");

                            if (
                              !diagnosisNameStr ||
                              diagnosisNameStr.trim() === ""
                            )
                              return null;

                            return (
                              <div
                                key={index}
                                className="text-purple-700 text-sm leading-relaxed"
                              >
                                •{" "}
                                <span className="font-medium">
                                  {diagnosisNameStr}
                                </span>
                                {diagnosisCode && (
                                  <div className="text-gray-600 text-xs ml-2">
                                    Code:{" "}
                                    {typeof diagnosisCode === "string"
                                      ? diagnosisCode
                                      : String(diagnosisCode)}
                                  </div>
                                )}
                                {dx.primary_diagnosis && (
                                  <span className="text-purple-800 text-xs bg-purple-100 px-1 rounded ml-2">
                                    Primary
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        {consultationSummary.diagnosis.length > 4 && (
                          <div className="text-purple-600 text-xs font-medium">
                            +{consultationSummary.diagnosis.length - 4} more
                            diagnoses
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No diagnosis recorded
                      </div>
                    )}
                  </div>

                  {/* Investigations Summary */}
                  <div className="bg-white rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-semibold text-xs">
                          6
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Investigations
                      </span>
                      {Array.isArray(consultationSummary?.investigations) &&
                        consultationSummary.investigations.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-indigo-50 text-indigo-700"
                          >
                            {consultationSummary.investigations.length}
                          </Badge>
                        )}
                    </div>
                    {Array.isArray(consultationSummary?.investigations) &&
                    consultationSummary.investigations.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {consultationSummary.investigations
                          .slice(0, 5)
                           
                          .map((inv: any, index: number) => (
                            <div
                              key={index}
                              className="text-indigo-700 text-sm leading-relaxed"
                            >
                              •{" "}
                              <span className="font-medium">
                                {typeof (
                                  inv.investigation_name || inv.test_name
                                ) === "string"
                                  ? inv.investigation_name || inv.test_name
                                  : String(
                                      inv.investigation_name ||
                                        inv.test_name ||
                                        "Unknown test"
                                    )}
                              </span>
                              {inv.status && (
                                <span
                                  className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                    inv.status === "completed"
                                      ? "bg-green-100 text-green-700"
                                      : inv.status === "in_progress"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {typeof inv.status === "string"
                                    ? inv.status
                                    : String(inv.status)}
                                </span>
                              )}
                              {inv.urgency && (
                                <div className="text-gray-600 text-xs ml-2">
                                  Priority:{" "}
                                  {typeof inv.urgency === "string"
                                    ? inv.urgency
                                    : String(inv.urgency)}
                                </div>
                              )}
                            </div>
                          ))}
                        {consultationSummary.investigations.length > 5 && (
                          <div className="text-indigo-600 text-xs font-medium">
                            +{consultationSummary.investigations.length - 5}{" "}
                            more tests
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No investigations ordered
                      </div>
                    )}
                  </div>

                  {/* Treatment Plan Summary */}
                  <div className="bg-white rounded-lg p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-700 font-semibold text-xs">
                          7
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">
                        Treatment Plan
                      </span>
                    </div>
                    {consultationSummary?.treatmentPlan ? (
                      <div className="space-y-2">
                        {(() => {
                          console.log(
                            "🔍 UI TREATMENT PLAN DEBUG - Full object:",
                            consultationSummary.treatmentPlan
                          );

                          // Try to get medications from different possible locations
                          let medications = null;
                          let medicationSource = "";

                          // Check multiple possible medication fields
                          const possibleFields = [
                            "medications",
                            "medication",
                            "drugs",
                            "prescriptions",
                            "medicine",
                            "treatment_medications",
                          ];

                          for (const field of possibleFields) {
                            if (consultationSummary.treatmentPlan[field]) {
                              medications =
                                consultationSummary.treatmentPlan[field];
                              medicationSource = `direct.${field}`;
                              break;
                            }
                          }

                          // If no medications found, check plan_details
                          if (
                            !medications &&
                            consultationSummary.treatmentPlan.plan_details
                          ) {
                            for (const field of possibleFields) {
                              if (
                                consultationSummary.treatmentPlan.plan_details[
                                  field
                                ]
                              ) {
                                medications =
                                  consultationSummary.treatmentPlan
                                    .plan_details[field];
                                medicationSource = `plan_details.${field}`;
                                break;
                              }
                            }
                          }

                          console.log("🔍 UI Medications Search Result:", {
                            source: medicationSource,
                            found: medications,
                            type: typeof medications,
                            isArray: Array.isArray(medications),
                            length: Array.isArray(medications)
                              ? medications.length
                              : "N/A",
                          });

                          const medicationCount = Array.isArray(medications)
                            ? medications.length
                            : typeof medications === "string" &&
                              medications.trim()
                            ? 1
                            : 0;

                          if (medicationCount > 0) {
                            return (
                              <div className="space-y-1">
                                <div className="text-orange-700 text-sm font-medium">
                                  💊 {medicationCount} medication
                                  {medicationCount === 1 ? "" : "s"} prescribed
                                </div>
                                {Array.isArray(medications) && (
                                  <div className="ml-4 space-y-0.5">
                                    {medications
                                      .slice(0, 4)
                                       
                                      .map((med: any, idx: number) => {
                                        // Try multiple possible medication name fields
                                        const medName =
                                          med.medication_name ||
                                          med.name ||
                                          med.drug_name ||
                                          med.generic_name ||
                                          med.brand_name ||
                                          med;

                                        let displayName = "";
                                        if (typeof medName === "string") {
                                          displayName = medName;
                                        } else if (
                                          typeof medName === "object" &&
                                          medName.text
                                        ) {
                                          displayName = medName.text;
                                        } else if (
                                          typeof medName === "object"
                                        ) {
                                          displayName =
                                            String(Object.values(medName)[0]) ||
                                            JSON.stringify(medName);
                                        } else {
                                          displayName = String(medName);
                                        }

                                        return (
                                          <div
                                            key={idx}
                                            className="text-orange-600 text-xs leading-relaxed"
                                          >
                                            •{" "}
                                            <span className="font-medium">
                                              {displayName}
                                            </span>
                                            {med.dosage && (
                                              <span className="text-gray-600 ml-1">
                                                ({med.dosage})
                                              </span>
                                            )}
                                            {med.frequency && (
                                              <span className="text-gray-600 ml-1">
                                                {med.frequency}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    {medications.length > 4 && (
                                      <div className="text-orange-600 text-xs ml-2">
                                        +{medications.length - 4} more
                                        medications
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (medications !== undefined) {
                            return (
                              <div className="text-gray-600 text-sm">
                                💊 No medications prescribed
                              </div>
                            );
                          }

                          // Show debug info when no medications found
                          return (
                            <div className="text-gray-500 text-xs space-y-1">
                              <div>💊 No medications found</div>
                              <div className="text-gray-400 text-xs">
                                Debug Info: Searched{" "}
                                {medicationSource || "all fields"} | Type:{" "}
                                {typeof medications} |
                                <button
                                  type="button"
                                  onClick={() =>
                                    console.log(
                                      "Treatment Plan Full Object:",
                                      consultationSummary.treatmentPlan
                                    )
                                  }
                                  className="underline ml-1 hover:text-gray-600"
                                >
                                  Log Full Object
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {consultationSummary?.treatmentPlan &&
                          typeof consultationSummary.treatmentPlan ===
                            "object" &&
                          consultationSummary.treatmentPlan !== null &&
                          (consultationSummary.treatmentPlan as any)
                            .plan_summary && (
                            <div className="text-orange-700 text-sm">
                              📋 Treatment plan documented
                            </div>
                          )}
                        {consultationSummary?.treatmentPlan &&
                          typeof consultationSummary.treatmentPlan ===
                            "object" &&
                          consultationSummary.treatmentPlan !== null &&
                          (consultationSummary.treatmentPlan as any)
                            .follow_up_instructions && (
                            <div className="text-orange-700 text-sm">
                              📅 Follow-up scheduled
                            </div>
                          )}
                        {consultationSummary?.treatmentPlan &&
                          typeof consultationSummary.treatmentPlan ===
                            "object" &&
                          consultationSummary.treatmentPlan !== null &&
                          (consultationSummary.treatmentPlan as any)
                            .lifestyle_modifications &&
                          Array.isArray(
                            (consultationSummary.treatmentPlan as any)
                              .lifestyle_modifications
                          ) &&
                          (consultationSummary.treatmentPlan as any)
                            .lifestyle_modifications.length > 0 && (
                            <div className="text-orange-700 text-sm">
                              🏃 Lifestyle modifications advised
                            </div>
                          )}

                        {(!consultationSummary?.treatmentPlan ||
                          typeof consultationSummary.treatmentPlan !==
                            "object" ||
                          consultationSummary.treatmentPlan === null ||
                          (!(consultationSummary.treatmentPlan as any)
                            .medications &&
                            !(consultationSummary.treatmentPlan as any)
                              .plan_summary &&
                            !(consultationSummary.treatmentPlan as any)
                              .follow_up_instructions)) && (
                          <div className="text-gray-500 text-sm italic">
                            Treatment plan recorded
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No treatment plan recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress/Status Information */}
              {visitWorkflowStarted && !consultationSession?.is_completed && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Consultation in Progress
                    </h4>
                    <span className="text-sm text-blue-600">
                      Duration:{" "}
                      {consultationSession?.started_at
                        ? Math.round(
                            (Date.now() -
                              new Date(
                                String(consultationSession.started_at)
                              ).getTime()) /
                              60000
                          )
                        : 0}{" "}
                      min
                    </span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-3">
                      Patient examination and documentation is in progress.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowFullConsultationWorkflow(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <StethoscopeIcon className="h-4 w-4 mr-2" />
                      Continue Consultation
                    </Button>
                  </div>
                </div>
              )}

              {/* Consultation Summary - Step by Step */}
              {consultationSession?.is_completed && consultationSummary && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Consultation Summary
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 text-xs"
                        >
                          Completed in{" "}
                          {Number(
                            (consultationSummary.session as any)
                              ?.total_duration_minutes
                          ) || 0}{" "}
                          min
                        </Badge>
                      </div>
                    </div>

                    {/* Step-by-Step Consultation Flow */}
                    <div className="space-y-3">
                      {/* Step 1: Chief Complaints */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              1
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Chief Complaints
                          </h5>
                          {consultationSummary.chiefComplaints &&
                          consultationSummary.chiefComplaints.length > 0 ? (
                            <div className="space-y-2">
                              {consultationSummary.chiefComplaints.map(
                                (
                                  complaint: {
                                    complaint:
                                      | string
                                      | { text?: string }
                                      | unknown;
                                    duration?: string;
                                    severity?: number;
                                    associated_symptoms?: string[];
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300"
                                  >
                                    <div className="font-medium text-blue-900 mb-1">
                                      {String(complaint.complaint)}
                                    </div>
                                    <div className="text-sm text-blue-700">
                                      {complaint.duration && (
                                        <span>
                                          Duration: {complaint.duration}
                                        </span>
                                      )}
                                      {complaint.severity && (
                                        <span className="ml-3">
                                          Severity: {complaint.severity}/10
                                        </span>
                                      )}
                                    </div>
                                    {complaint.associated_symptoms &&
                                      complaint.associated_symptoms.length >
                                        0 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          Associated:{" "}
                                          {complaint.associated_symptoms.join(
                                            ", "
                                          )}
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No chief complaints recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Medical History */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-700 font-semibold text-sm">
                              2
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Medical History
                          </h5>
                          {consultationSummary.history &&
                          consultationSummary.history.length > 0 ? (
                            <div className="space-y-2">
                              {consultationSummary.history.slice(0, 3).map(
                                (
                                  hist: {
                                    history_type?: string;
                                    content:
                                      | string
                                      | { text?: string }
                                      | unknown;
                                    summary_text?: string;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-300"
                                  >
                                    <div className="font-medium text-yellow-900 text-sm">
                                      {hist.history_type
                                        ?.replace("_", " ")
                                        .toUpperCase()}
                                    </div>
                                    <div className="text-sm text-yellow-700 mt-1">
                                      {typeof hist.content === "string"
                                        ? hist.content
                                        : hist.content &&
                                          typeof hist.content === "object"
                                        ? (hist.content as any).summary ||
                                          (hist.content as any).description ||
                                          JSON.stringify(hist.content)
                                        : hist.summary_text ||
                                          "History documented"}
                                    </div>
                                  </div>
                                )
                              )}
                              {consultationSummary.history.length > 3 && (
                                <div className="text-xs text-yellow-600 pl-2">
                                  +{consultationSummary.history.length - 3} more
                                  history entries
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No medical history recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Vital Signs */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-700 font-semibold text-sm">
                              3
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Vital Signs
                          </h5>
                          {consultationSummary.vitals ? (
                            <div className="p-3 bg-teal-50 rounded-lg border-l-4 border-teal-300">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                {consultationSummary.vitals.pulse_rate && (
                                  <div className="text-teal-700">
                                    <strong>Pulse:</strong>{" "}
                                    {consultationSummary.vitals.pulse_rate} bpm
                                  </div>
                                )}
                                {consultationSummary.vitals
                                  .blood_pressure_systolic &&
                                  consultationSummary.vitals
                                    .blood_pressure_diastolic && (
                                    <div className="text-teal-700">
                                      <strong>BP:</strong>{" "}
                                      {
                                        consultationSummary.vitals
                                          .blood_pressure_systolic
                                      }
                                      /
                                      {
                                        consultationSummary.vitals
                                          .blood_pressure_diastolic
                                      }{" "}
                                      mmHg
                                    </div>
                                  )}
                                {consultationSummary.vitals.temperature && (
                                  <div className="text-teal-700">
                                    <strong>Temperature:</strong>{" "}
                                    {consultationSummary.vitals.temperature}°F
                                  </div>
                                )}
                                {consultationSummary.vitals
                                  .oxygen_saturation && (
                                  <div className="text-teal-700">
                                    <strong>O2 Sat:</strong>{" "}
                                    {
                                      consultationSummary.vitals
                                        .oxygen_saturation
                                    }
                                    %
                                  </div>
                                )}
                                {consultationSummary.vitals.weight_kg && (
                                  <div className="text-teal-700">
                                    <strong>Weight:</strong>{" "}
                                    {consultationSummary.vitals.weight_kg} kg
                                  </div>
                                )}
                                {consultationSummary.vitals.height_cm && (
                                  <div className="text-teal-700">
                                    <strong>Height:</strong>{" "}
                                    {consultationSummary.vitals.height_cm} cm
                                  </div>
                                )}
                              </div>
                              {consultationSummary.vitals.weight_kg &&
                                consultationSummary.vitals.height_cm && (
                                  <div className="mt-2 text-sm text-teal-700">
                                    <strong>BMI:</strong>{" "}
                                    {(
                                      consultationSummary.vitals.weight_kg /
                                      Math.pow(
                                        consultationSummary.vitals.height_cm /
                                          100,
                                        2
                                      )
                                    ).toFixed(1)}{" "}
                                    kg/m²
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No vital signs recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Physical Examination */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                            <span className="text-pink-700 font-semibold text-sm">
                              4
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Physical Examination
                          </h5>
                          {consultationSummary.examination &&
                          consultationSummary.examination.length > 0 ? (
                            <div className="space-y-2">
                              {consultationSummary.examination.slice(0, 3).map(
                                (
                                  exam: {
                                    examination_type?: string;
                                    findings?: any;
                                    normal_findings?: string[];
                                    abnormal_findings?: string[];
                                    clinical_significance?: string;
                                    system_examined?: string;
                                    examination_findings?: string;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-pink-50 rounded-lg border-l-4 border-pink-300"
                                  >
                                    <div className="font-medium text-pink-900 text-sm">
                                      {exam.examination_type ||
                                        exam.system_examined ||
                                        "General Examination"}
                                    </div>
                                    <div className="text-sm text-pink-700 mt-1">
                                      {typeof exam.findings === "string"
                                        ? exam.findings
                                        : exam.findings &&
                                          typeof exam.findings === "object"
                                        ? exam.findings.summary ||
                                          exam.findings.description ||
                                          JSON.stringify(exam.findings)
                                        : exam.examination_findings
                                        ? exam.examination_findings
                                        : "Examination completed"}
                                    </div>
                                    {exam.abnormal_findings && (
                                      <div className="text-sm text-pink-800 mt-1">
                                        <strong>Abnormal findings:</strong>{" "}
                                        {Array.isArray(exam.abnormal_findings)
                                          ? exam.abnormal_findings.join(", ")
                                          : typeof exam.abnormal_findings ===
                                            "string"
                                          ? exam.abnormal_findings
                                          : JSON.stringify(
                                              exam.abnormal_findings
                                            )}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                              {consultationSummary.examination.length > 3 && (
                                <div className="text-xs text-pink-600 pl-2">
                                  +{consultationSummary.examination.length - 3}{" "}
                                  more systems examined
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No physical examination recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 5: any */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 font-semibold text-sm">
                              5
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Diagnosis
                          </h5>
                          {consultationSummary.diagnosis &&
                          consultationSummary.diagnosis.length > 0 ? (
                            <div className="space-y-2">
                              {consultationSummary.diagnosis.map(
                                (
                                  dx: {
                                    diagnosis_type?: string;
                                    diagnosis_text?: string;
                                    diagnosis_name?: string;
                                    icd10_code?: string;
                                    icd_code?: string;
                                    icd10_description?: string;
                                    confidence_level?: number;
                                    is_primary?: boolean;
                                    severity?: string;
                                    notes?: string;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-300"
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="font-medium text-purple-900">
                                        {dx.diagnosis_name}
                                      </div>
                                      {dx.diagnosis_type && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-purple-100 text-purple-800"
                                        >
                                          {dx.diagnosis_type}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-purple-700">
                                      {dx.icd_code && (
                                        <span>
                                          <strong>ICD Code:</strong>{" "}
                                          {dx.icd_code}
                                        </span>
                                      )}
                                      {dx.severity && (
                                        <span className="ml-3">
                                          <strong>Severity:</strong>{" "}
                                          {dx.severity}
                                        </span>
                                      )}
                                    </div>
                                    {dx.notes && (
                                      <div className="text-sm text-purple-700 mt-1">
                                        <strong>Notes:</strong> {dx.notes}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No diagnosis recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 6: Investigations */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-700 font-semibold text-sm">
                              6
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Investigations Ordered
                          </h5>
                          {consultationSummary.investigations &&
                          consultationSummary.investigations.length > 0 ? (
                            <div className="space-y-2">
                              {consultationSummary.investigations.map(
                                (
                                  inv: {
                                    id?: string;
                                    investigation_type?: string;
                                    investigation_name?: string;
                                    test_name?: string;
                                    investigation_code?: string;
                                    category?: string;
                                    urgency?: string;
                                    clinical_indication?: string;
                                    clinical_reason?: string;
                                    instructions?: string;
                                    expected_date?: string;
                                    cost_estimate?: number;
                                    status?: string;
                                    results?: any;
                                    results_summary?: string;
                                    interpretation?: string;
                                    report_file?: string;
                                  },
                                  index: number
                                ) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-300"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium text-indigo-900 text-sm">
                                        {inv.investigation_name ||
                                          inv.test_name}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {inv.status && (
                                          <Badge
                                            variant={
                                              inv.status === "completed"
                                                ? "default"
                                                : "outline"
                                            }
                                            className={`text-xs ${
                                              inv.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : inv.status === "in_process"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {inv.status}
                                          </Badge>
                                        )}
                                        {/* Report Upload Button */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs px-2 py-1 h-6"
                                          onClick={() =>
                                            handleUploadReport(inv.id)
                                          }
                                          disabled={uploadingReport === inv.id}
                                        >
                                          {uploadingReport === inv.id ? (
                                            <>
                                              <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-gray-300 border-t-gray-600" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3 h-3 mr-1" />
                                              {inv.results?.report_file ||
                                              inv.report_file
                                                ? "Update"
                                                : "Upload"}{" "}
                                              Report
                                            </>
                                          )}
                                        </Button>

                                        {/* Add Results Button */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs px-2 py-1 h-6"
                                          onClick={() =>
                                            handleEditReport(
                                              inv.id,
                                              inv.results_summary,
                                              inv.interpretation
                                            )
                                          }
                                        >
                                          <FileTextIcon className="w-3 h-3 mr-1" />
                                          Add Results
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="text-sm text-indigo-700 mt-1">
                                      {inv.category && (
                                        <span>
                                          <strong>Category:</strong>{" "}
                                          {inv.category}
                                        </span>
                                      )}
                                      {inv.urgency && (
                                        <span className="ml-3">
                                          <strong>Priority:</strong>{" "}
                                          {inv.urgency}
                                        </span>
                                      )}
                                    </div>

                                    {inv.clinical_reason && (
                                      <div className="text-sm text-indigo-700 mt-1">
                                        <strong>Clinical reason:</strong>{" "}
                                        {inv.clinical_reason}
                                      </div>
                                    )}

                                    {/* Inline Text Results Editor */}
                                    {editingReport === inv.id && (
                                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="font-medium text-blue-900 text-sm mb-2">
                                          Add Investigation Results
                                        </div>

                                        <div className="space-y-3">
                                          <div>
                                            <Label
                                              htmlFor={`summary-${inv.id}`}
                                              className="text-xs font-medium text-blue-800"
                                            >
                                              Results Summary
                                            </Label>
                                            <Textarea
                                              id={`summary-${inv.id}`}
                                              placeholder="Enter investigation results summary..."
                                              value={reportData.summary}
                                              onChange={(e) =>
                                                setReportData((prev) => ({
                                                  ...prev,
                                                  summary: e.target.value,
                                                }))
                                              }
                                              className="text-xs mt-1"
                                              rows={3}
                                            />
                                          </div>

                                          <div>
                                            <Label
                                              htmlFor={`interpretation-${inv.id}`}
                                              className="text-xs font-medium text-blue-800"
                                            >
                                              Clinical Interpretation
                                            </Label>
                                            <Textarea
                                              id={`interpretation-${inv.id}`}
                                              placeholder="Enter clinical interpretation..."
                                              value={reportData.interpretation}
                                              onChange={(e) =>
                                                setReportData((prev) => ({
                                                  ...prev,
                                                  interpretation:
                                                    e.target.value,
                                                }))
                                              }
                                              className="text-xs mt-1"
                                              rows={2}
                                            />
                                          </div>

                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleSaveTextResults(inv.id)
                                              }
                                              className="text-xs px-3 py-1 h-7"
                                            >
                                              <SaveIcon className="w-3 h-3 mr-1" />
                                              Save Results
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setEditingReport(null)
                                              }
                                              className="text-xs px-3 py-1 h-7"
                                            >
                                              <XIcon className="w-3 h-3 mr-1" />
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Report Display Section */}
                                    {(inv.results ||
                                      inv.results_summary ||
                                      inv.report_file) && (
                                      <div className="mt-3 p-2 bg-white rounded border border-indigo-200">
                                        <div className="font-medium text-indigo-900 text-xs mb-1">
                                          Investigation Report
                                        </div>

                                        {/* File Attachment */}
                                        {(inv.results?.report_file ||
                                          inv.report_file) && (
                                          <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-indigo-600" />
                                            <a
                                              href={
                                                inv.results?.report_file ||
                                                inv.report_file
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                            >
                                              View Report File
                                            </a>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-xs px-1 py-0 h-5"
                                              onClick={() =>
                                                handleDownloadReport(
                                                  inv.results?.report_file ||
                                                    inv.report_file,
                                                  inv.investigation_name ||
                                                    inv.test_name ||
                                                    "report"
                                                )
                                              }
                                            >
                                              <Download className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}

                                        {/* Results Summary */}
                                        {inv.results_summary && (
                                          <div className="text-sm text-indigo-700 mb-1">
                                            <strong>Summary:</strong>{" "}
                                            {inv.results_summary}
                                          </div>
                                        )}

                                        {/* Detailed Results */}
                                        {inv.results &&
                                          typeof inv.results === "object" && (
                                            <div className="text-sm text-indigo-700">
                                              {inv.results.values && (
                                                <div className="mb-1">
                                                  <strong>Values:</strong>{" "}
                                                  {JSON.stringify(
                                                    inv.results.values
                                                  )}
                                                </div>
                                              )}
                                              {inv.results.notes && (
                                                <div>
                                                  <strong>Notes:</strong>{" "}
                                                  {inv.results.notes}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                        {/* Interpretation */}
                                        {inv.interpretation && (
                                          <div className="text-sm text-indigo-800 mt-1 font-medium">
                                            <strong>Interpretation:</strong>{" "}
                                            {inv.interpretation}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No investigations ordered
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 7: Treatment Plan */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-700 font-semibold text-sm">
                              7
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Treatment Plan
                          </h5>
                          {consultationSummary?.treatmentPlan &&
                          typeof consultationSummary.treatmentPlan ===
                            "object" &&
                          consultationSummary.treatmentPlan !== null ? (
                            <div className="space-y-3">
                              {/* Treatment Summary */}
                              {(consultationSummary.treatmentPlan as any)
                                .plan_summary && (
                                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                                  <div className="font-medium text-orange-900 text-sm mb-1">
                                    Treatment Summary
                                  </div>
                                  <div className="text-sm text-orange-700">
                                    {typeof (
                                      consultationSummary.treatmentPlan as any
                                    ).plan_summary === "string"
                                      ? (
                                          consultationSummary.treatmentPlan as any
                                        ).plan_summary
                                      : typeof (
                                          consultationSummary.treatmentPlan as any
                                        ).plan_summary === "object"
                                      ? JSON.stringify(
                                          (
                                            consultationSummary.treatmentPlan as any
                                          ).plan_summary
                                        )
                                      : String(
                                          (
                                            consultationSummary.treatmentPlan as any
                                          ).plan_summary
                                        )}
                                  </div>
                                </div>
                              )}

                              {/* Medications */}
                              {(consultationSummary.treatmentPlan as any)
                                .medications && (
                                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                                  <div className="font-medium text-orange-900 text-sm mb-2">
                                    Medications Prescribed
                                  </div>
                                  {Array.isArray(
                                    (consultationSummary.treatmentPlan as any)
                                      .medications
                                  ) ? (
                                    <div className="space-y-2">
                                      {(
                                        consultationSummary.treatmentPlan as any
                                      ).medications.map(
                                        (
                                          med: {
                                            name?: string;
                                            medicine_name?: string;
                                            medication_name?: string;
                                            dosage?: string;
                                            frequency?: string;
                                            duration?: string;
                                            instructions?: string;
                                            quantity?: number;
                                          },
                                          index: number
                                        ) => (
                                          <div
                                            key={index}
                                            className="p-2 bg-white rounded border border-orange-200"
                                          >
                                            <div className="font-medium text-gray-800 text-sm">
                                              {typeof med === "string"
                                                ? med
                                                : med.name ||
                                                  med.medication_name}
                                            </div>
                                            {typeof med === "object" && (
                                              <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                {med.dosage && (
                                                  <div>
                                                    <strong>Dosage:</strong>{" "}
                                                    {med.dosage}
                                                  </div>
                                                )}
                                                {med.frequency && (
                                                  <div>
                                                    <strong>Frequency:</strong>{" "}
                                                    {med.frequency}
                                                  </div>
                                                )}
                                                {med.duration && (
                                                  <div>
                                                    <strong>Duration:</strong>{" "}
                                                    {med.duration}
                                                  </div>
                                                )}
                                                {med.instructions && (
                                                  <div>
                                                    <strong>
                                                      Instructions:
                                                    </strong>{" "}
                                                    {med.instructions}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-orange-700">
                                      {
                                        (
                                          consultationSummary.treatmentPlan as any
                                        ).medications
                                      }
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Follow-up Instructions */}
                              {(consultationSummary.treatmentPlan as any)
                                .follow_up_instructions && (
                                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                                  <div className="font-medium text-orange-900 text-sm mb-1">
                                    Follow-up Instructions
                                  </div>
                                  <div className="text-sm text-orange-700">
                                    {
                                      (consultationSummary.treatmentPlan as any)
                                        .follow_up_instructions
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              No treatment plan recorded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 8: Completion */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2Icon className="w-4 h-4 text-green-700" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Consultation Completed
                          </h5>
                          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-300">
                            <div className="text-sm text-green-700">
                              <div>
                                <strong>Completed at:</strong>{" "}
                                {consultationSummary?.session &&
                                typeof consultationSummary.session ===
                                  "object" &&
                                consultationSummary.session !== null &&
                                (consultationSummary.session as any).ended_at
                                  ? new Date(
                                      String(
                                        (consultationSummary.session as any)
                                          .ended_at
                                      )
                                    ).toLocaleString()
                                  : "Unknown"}
                              </div>
                              <div className="mt-1">
                                <strong>Total duration:</strong>{" "}
                                {Number(
                                  (consultationSummary?.session &&
                                    typeof consultationSummary.session ===
                                      "object" &&
                                    consultationSummary.session !== null &&
                                    (consultationSummary.session as any)
                                      .total_duration_minutes) ||
                                    0
                                )}{" "}
                                minutes
                              </div>
                              <div className="mt-1">
                                <strong>Status:</strong> All consultation steps
                                completed successfully
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t mt-6">
                      <Button size="sm" variant="outline" className="flex-1">
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        View Full Report
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <PillIcon className="h-4 w-4 mr-2" />
                        Print Prescription
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Export PDF
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Follow-up Card */}
        {showVisitWorkflow && selectedPatient && followUpRequested && (
          <Card className="border border-gray-200 mt-6">
            <CardContent className="p-6">
              {/* Header with Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {consultationSession?.is_completed ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Follow-up Planning
                        </h3>
                        <p className="text-sm text-green-600">
                          Ready to Schedule
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Follow-up Planning
                        </h3>
                        <p className="text-sm text-gray-600">
                          Complete consultation first
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {consultationSession?.is_completed ? (
                  <Button
                    onClick={handleFollowUpWorkflow}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600 px-3 py-1"
                  >
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Pending Consultation
                  </Badge>
                )}
              </div>

              {/* Follow-up Summary */}
              <div className="mb-6 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Follow-up Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Follow-up Instructions */}
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold text-xs">
                          1
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        Instructions
                      </span>
                    </div>
                    {consultationSummary?.treatmentPlan?.follow_up_instructions ? (
                      <div className="text-green-700 text-sm">
                        {String(consultationSummary.treatmentPlan.follow_up_instructions)}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        No follow-up instructions recorded
                      </div>
                    )}
                  </div>

                  {/* Next Appointment Type */}
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold text-xs">
                          2
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        Appointment Type
                      </span>
                    </div>
                    <div className="text-green-700 text-sm">
                      {consultationSession?.is_completed 
                        ? "Follow-up Consultation" 
                        : "To be determined"}
                    </div>
                  </div>
                </div>

                {/* Action Summary */}
                {consultationSession?.is_completed && (
                  <div className="mt-4 flex items-center justify-between bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        Patient consultation completed - Ready for follow-up scheduling
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleFollowUpWorkflow}
                      className="text-green-700 border-green-200 hover:bg-green-50"
                    >
                      Schedule Now
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Workflow Section */}
        {selectedPatient && (
          <Card className="border border-gray-200 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                Add Workflow
              </CardTitle>
              <CardDescription>
                Add additional workflow items for {selectedPatient.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Consultation Button */}
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => {
                    // TODO: Add consultation workflow functionality
                    console.log("Add Consultation clicked");
                  }}
                >
                  <StethoscopeIcon className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Consultation</span>
                </Button>

                {/* Follow Up Button */}
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                  onClick={handleShowFollowUpOptions}
                >
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Follow Up</span>
                </Button>

                {/* Treatment Button */}
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => {
                    // TODO: Add treatment workflow functionality
                    console.log("Add Treatment clicked");
                  }}
                >
                  <PillIcon className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">Treatment</span>
                </Button>

                {/* Complete Status Button - Only show if consultation exists and is not already completed */}
                {consultationSession && !consultationSession.is_completed && (
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                    onClick={handleMarkAsCompleted}
                  >
                    <CheckCircle2Icon className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium">Mark Completed</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consultation Workflow Popup */}
        {showConsultationWorkflow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-blue-200 bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <StethoscopeIcon className="h-5 w-5" />
                      Consultation Documentation
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Patient: {selectedPatient?.name}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConsultationWorkflow(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="conducted-date" className="text-blue-800">
                      Consultation Date
                    </Label>
                    <Input
                      id="conducted-date"
                      type="date"
                      value={workflowData.conductedDate}
                      onChange={(e) =>
                        setWorkflowData((prev) => ({
                          ...prev,
                          conductedDate: e.target.value,
                        }))
                      }
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="further-suggestions"
                      className="text-blue-800"
                    >
                      Clinical Notes & Recommendations
                    </Label>
                    <Textarea
                      id="further-suggestions"
                      placeholder="Enter examination findings, diagnosis, treatment recommendations..."
                      value={workflowData.furtherSuggestions}
                      onChange={(e) =>
                        setWorkflowData((prev) => ({
                          ...prev,
                          furtherSuggestions: e.target.value,
                        }))
                      }
                      rows={4}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveWorkflow}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Documentation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConsultationWorkflow(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Follow Up Options Popup */}
        {showFollowUpOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-green-200 bg-white max-w-md w-full">
              <CardHeader className="bg-green-50 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CalendarIcon className="h-5 w-5" />
                      Follow-up Options
                    </CardTitle>
                    <CardDescription className="text-green-600 mt-1">
                      Choose how to handle the follow-up for {selectedPatient?.name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowUpOptions(false)}
                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-6">
                    Select the type of follow-up you want to create:
                  </div>
                  
                  {/* Request Follow-up Option */}
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    onClick={handleRequestFollowUp}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileTextIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-blue-800">Request Follow-up</div>
                        <div className="text-xs text-blue-600">Patient requests a follow-up appointment</div>
                      </div>
                    </div>
                  </Button>

                  {/* Schedule Follow-up Option */}
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                    onClick={handleScheduleFollowUp}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-green-800">Schedule Follow-up</div>
                        <div className="text-xs text-green-600">Doctor schedules a follow-up appointment</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Follow Up Workflow Popup */}
        {showFollowUpWorkflow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-green-200 bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-green-50 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CalendarIcon className="h-5 w-5" />
                      Schedule Follow-Up
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Patient: {selectedPatient?.name}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFollowUpWorkflow(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4">
                  {/* Immediate vs Scheduled Toggle */}
                  <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        id="immediate-followup"
                        type="radio"
                        name="followup-timing"
                        checked={followUpData.isImmediate}
                        onChange={() =>
                          setFollowUpData((prev) => ({
                            ...prev,
                            isImmediate: true,
                          }))
                        }
                        className="text-green-600"
                      />
                      <label
                        htmlFor="immediate-followup"
                        className="text-sm font-medium text-gray-700"
                      >
                        Complete Now
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="scheduled-followup"
                        type="radio"
                        name="followup-timing"
                        checked={!followUpData.isImmediate}
                        onChange={() =>
                          setFollowUpData((prev) => ({
                            ...prev,
                            isImmediate: false,
                          }))
                        }
                        className="text-green-600"
                      />
                      <label
                        htmlFor="scheduled-followup"
                        className="text-sm font-medium text-gray-700"
                      >
                        Schedule for Later
                      </label>
                    </div>
                  </div>

                  {!followUpData.isImmediate && (
                    <div>
                      <Label
                        htmlFor="follow-up-date"
                        className="text-green-800"
                      >
                        Follow-up Date
                      </Label>
                      <Input
                        id="follow-up-date"
                        type="date"
                        value={followUpData.scheduledDate}
                        onChange={(e) =>
                          setFollowUpData((prev) => ({
                            ...prev,
                            scheduledDate: e.target.value,
                          }))
                        }
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="follow-up-type" className="text-green-800">
                      Follow-up Type
                    </Label>
                    <select
                      id="follow-up-type"
                      aria-label="Follow-up Type"
                      value={followUpData.followUpType}
                      onChange={(e) =>
                        setFollowUpData((prev) => ({
                          ...prev,
                          followUpType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-green-200 rounded-md focus:border-green-400 focus:outline-none"
                    >
                      <option value="follow_up">Follow-up Consultation</option>
                      <option value="checkup">Routine Check-up</option>
                      <option value="treatment">Treatment Review</option>
                      <option value="consultation">General Consultation</option>
                      <option value="emergency">Urgent Follow-up</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="follow-up-notes" className="text-green-800">
                      Follow-up Notes
                    </Label>
                    <Textarea
                      id="follow-up-notes"
                      placeholder="Enter follow-up instructions or notes..."
                      value={followUpData.notes}
                      onChange={(e) =>
                        setFollowUpData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveFollowUp}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {followUpData.isImmediate
                      ? "Create Follow-Up"
                      : "Schedule Follow-Up"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFollowUpWorkflow(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Treatment Workflow Popup */}
        {showTreatmentWorkflow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-purple-200 bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-purple-50 border-b border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <PillIcon className="h-5 w-5" />
                      Create Treatment Plan
                    </CardTitle>
                    <CardDescription className="text-purple-600">
                      Patient: {selectedPatient?.name}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTreatmentWorkflow(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4">
                  {/* Immediate vs Scheduled Toggle */}
                  <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        id="immediate-treatment"
                        type="radio"
                        name="treatment-timing"
                        checked={treatmentData.isImmediate}
                        onChange={() =>
                          setTreatmentData((prev) => ({
                            ...prev,
                            isImmediate: true,
                          }))
                        }
                        className="text-purple-600"
                      />
                      <label
                        htmlFor="immediate-treatment"
                        className="text-sm font-medium text-gray-700"
                      >
                        Apply Now
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="scheduled-treatment"
                        type="radio"
                        name="treatment-timing"
                        checked={!treatmentData.isImmediate}
                        onChange={() =>
                          setTreatmentData((prev) => ({
                            ...prev,
                            isImmediate: false,
                          }))
                        }
                        className="text-purple-600"
                      />
                      <label
                        htmlFor="scheduled-treatment"
                        className="text-sm font-medium text-gray-700"
                      >
                        Create Plan
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="treatment-type"
                        className="text-purple-800"
                      >
                        Treatment Type
                      </Label>
                      <select
                        id="treatment-type"
                        aria-label="Treatment Type"
                        value={treatmentData.treatmentType}
                        onChange={(e) =>
                          setTreatmentData((prev) => ({
                            ...prev,
                            treatmentType: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-purple-200 rounded-md focus:border-purple-400 focus:outline-none"
                      >
                        <option value="medication">Medication Therapy</option>
                        <option value="physiotherapy">Physiotherapy</option>
                        <option value="surgery">Surgical Intervention</option>
                        <option value="lifestyle">Lifestyle Changes</option>
                        <option value="monitoring">Monitoring Only</option>
                      </select>
                    </div>
                    <div>
                      <Label
                        htmlFor="treatment-duration"
                        className="text-purple-800"
                      >
                        Duration
                      </Label>
                      <Input
                        id="treatment-duration"
                        placeholder="e.g., 7 days, 2 weeks"
                        value={treatmentData.duration}
                        onChange={(e) =>
                          setTreatmentData((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="treatment-instructions"
                      className="text-purple-800"
                    >
                      Treatment Instructions
                    </Label>
                    <Textarea
                      id="treatment-instructions"
                      placeholder="Enter treatment instructions, dosage, frequency, precautions..."
                      value={treatmentData.instructions}
                      onChange={(e) =>
                        setTreatmentData((prev) => ({
                          ...prev,
                          instructions: e.target.value,
                        }))
                      }
                      rows={4}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveTreatment}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {treatmentData.isImmediate
                      ? "Apply Treatment Now"
                      : "Create Treatment Plan"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTreatmentWorkflow(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Consultation Workflow Component */}
        {showFullConsultationWorkflow && visitId && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <ConsultationWorkflow
              visitId={visitId}
              onComplete={handleConsultationComplete}
              onCancel={handleConsultationCancel}
            />
          </div>
        )}
      </div>
    );
  }

  // Default view - list of appointments
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPD Management</h1>
          <p className="text-muted-foreground">
            {userRole === 'doctor' ? 'Your OPD sessions and scheduled consultations' : 'Manage outpatient department consultations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'doctor' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <FileTextIcon className="h-3 w-3" />
              {opdRecords.length} OPD sessions
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <ActivityIcon className="h-3 w-3" />
            {appointments.length} patients waiting
          </Badge>
        </div>
      </div>

      {/* OPD Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            All OPD Sessions
          </CardTitle>
          <CardDescription>Your OPD sessions and records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingOpdRecords ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading OPD records...</p>
              </div>
            ) : opdRecords.map((opd) => (
              <div
                key={opd.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">
                      {opd.patients?.full_name || opd.patient?.full_name || opd.patient?.name || 'Unknown Patient'}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {new Date(opd.created_at).toLocaleDateString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Token #{opd.token_number}
                    </Badge>
                    <Badge
                      variant={
                        opd.opd_status === "completed"
                          ? "default"
                          : opd.opd_status === "consultation"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {opd.opd_status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Status: {opd.opd_status || 'Not specified'}</div>
                    <div>Phone: {opd.patients?.phone || opd.patient?.phone || 'Not specified'}</div>
                    <div>Gender: {opd.patients?.gender || opd.patient?.gender || 'Not specified'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {opd.opd_status !== 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Navigate to individual OPD record
                        window.location.href = `/doctor/opd/${opd.id}`;
                      }}
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // Navigate to view OPD record
                      window.location.href = `/doctor/opd/${opd.id}`;
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {!loadingOpdRecords && opdRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No OPD sessions found.</p>
                <p className="text-sm">
                  OPD sessions will appear here when created.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
