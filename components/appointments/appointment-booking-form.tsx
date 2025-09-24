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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  StethoscopeIcon,
  AlertTriangleIcon,
  SearchIcon,
  CheckIcon,
  RefreshCwIcon,
  XCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import type { AppointmentBookingForm, AppointmentType } from "@/lib/types";
import { createAuthenticatedClient } from "@/lib/supabase/authenticated-client";

interface AppointmentBookingFormProps {
  onSubmit: (data: AppointmentBookingForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<AppointmentBookingForm>;
}

const appointmentTypes: {
  value: AppointmentType;
  label: string;
  description: string;
}[] = [
  {
    value: "consultation",
    label: "Consultation",
    description: "Initial or routine consultation",
  },
  {
    value: "follow_up",
    label: "Follow-up",
    description: "Follow-up after treatment",
  },
  {
    value: "procedure",
    label: "Procedure",
    description: "Medical procedure or treatment",
  },
  { value: "checkup", label: "Checkup", description: "Regular health checkup" },
  {
    value: "emergency",
    label: "Emergency",
    description: "Urgent medical attention",
  },
  {
    value: "vaccination",
    label: "Vaccination",
    description: "Immunization appointment",
  },
];

interface Department {
  value: string;
  label: string;
}

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface ApiError {
  message: string;
  type: "network" | "server" | "validation" | "permission" | "unknown";
  code?: string;
  details?: string;
}

interface ErrorState {
  patients: ApiError | null;
  doctors: ApiError | null;
  timeSlots: ApiError | null;
  submit: ApiError | null;
  general: ApiError | null;
}

interface ValidationErrors {
  department: any;
  appointment_type: any;
  patient_id?: string;
  doctor_id?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  title?: string;
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export function AppointmentBookingForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {},
}: AppointmentBookingFormProps) {
  const [formData, setFormData] = useState<AppointmentBookingForm>({
    patient_id: "",
    doctor_id: "",
    department: "",
    appointment_type: "consultation",
    scheduled_date: "",
    scheduled_time: "",
    duration: 30,
    title: "",
    patient_notes: "",
    priority: false,
    services: [],
    notes: "",
    created_by: "",
    ...initialData,
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Error handling state
  const [errors, setErrors] = useState<ErrorState>({
    patients: null,
    doctors: null,
    timeSlots: null,
    submit: null,
    general: null,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    department: null,
    appointment_type: null,
    patient_id: undefined,
    doctor_id: undefined,
    scheduled_date: undefined,
    scheduled_time: undefined,
    title: undefined,
  });
  const [retryCount, setRetryCount] = useState({
    patients: 0,
    doctors: 0,
    timeSlots: 0,
  });

  // Error handling utilities
  const parseError = useCallback(
    (error: unknown, context: string): ApiError => {
      if (!error) {
        return { message: "Unknown error occurred", type: "unknown" };
      }

      // Handle Supabase errors
      if (typeof error === "object" && error !== null) {
        const supabaseError = error as {
          message?: string;
          code?: string;
          details?: string;
        };

        if (supabaseError.code === "PGRST116") {
          return {
            message: "No data found. Please check your connection.",
            type: "server",
            code: supabaseError.code,
            details: supabaseError.details,
          };
        }

        if (supabaseError.code?.startsWith("42")) {
          return {
            message: "Database schema error. Please contact support.",
            type: "server",
            code: supabaseError.code,
            details: `Error in ${context}: ${
              supabaseError.details || supabaseError.message
            }`,
          };
        }

        if (
          supabaseError.message?.includes("network") ||
          supabaseError.message?.includes("fetch")
        ) {
          return {
            message: "Network error. Please check your connection.",
            type: "network",
            details: supabaseError.message,
          };
        }

        return {
          message: supabaseError.message || "An error occurred",
          type: "server",
          code: supabaseError.code,
          details: supabaseError.details,
        };
      }

      // Handle string errors
      if (typeof error === "string") {
        return {
          message: error,
          type: "unknown",
        };
      }

      return {
        message: "An unexpected error occurred",
        type: "unknown",
        details: `Context: ${context}`,
      };
    },
    []
  );

  const clearError = useCallback((errorType: keyof ErrorState) => {
    setErrors((prev) => ({
      ...prev,
      [errorType]: null,
    }));
  }, []);

  const setError = useCallback(
    (errorType: keyof ErrorState, error: ApiError) => {
      setErrors((prev) => ({
        ...prev,
        [errorType]: error,
      }));
    },
    []
  );

  const retryOperation = useCallback(
    async (
      operation: string,
      retryFunction: () => Promise<void>,
      maxRetries = 3
    ) => {
      const currentRetryCount =
        retryCount[operation as keyof typeof retryCount] || 0;

      if (currentRetryCount >= maxRetries) {
        setError(operation as keyof ErrorState, {
          message: `Failed after ${maxRetries} attempts. Please refresh the page or contact support.`,
          type: "network",
        });
        return;
      }

      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, currentRetryCount), 10000);

      setTimeout(async () => {
        setRetryCount((prev) => ({
          ...prev,
          [operation]: prev[operation as keyof typeof prev] + 1,
        }));

        try {
          await retryFunction();
        } catch (error) {
          console.error(
            `Retry ${currentRetryCount + 1} failed for ${operation}:`,
            error
          );
        }
      }, delay);
    },
    [retryCount, setError]
  );

  const validateForm = useCallback((): boolean => {
    const newValidationErrors: ValidationErrors = {
      department: null,
      appointment_type: null,
      patient_id: undefined,
      doctor_id: undefined,
      scheduled_date: undefined,
      scheduled_time: undefined,
      title: undefined,
    };

    if (!formData.patient_id) {
      newValidationErrors.patient_id = "Please select a patient";
    }

    if (!formData.doctor_id) {
      newValidationErrors.doctor_id = "Please select a doctor";
    }

    if (!formData.scheduled_date) {
      newValidationErrors.scheduled_date = "Please select a date";
    } else {
      const selectedDate = new Date(formData.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newValidationErrors.scheduled_date =
          "Cannot schedule appointments in the past";
      }
    }

    if (!formData.scheduled_time) {
      newValidationErrors.scheduled_time = "Please select a time slot";
    }

    if (formData.title && formData.title.length > 100) {
      newValidationErrors.title = "Title must be less than 100 characters";
    }

    setValidationErrors(newValidationErrors);
    // Check if any validation error has a non-null/undefined value
    return !Object.values(newValidationErrors).some(error => error !== null && error !== undefined);
  }, [formData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showPatientDropdown && !target.closest(".patient-search-container")) {
        setShowPatientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPatientDropdown]);

  const fetchData = useCallback(
    async (isRetry = false) => {
      console.log(
        "AppointmentBookingForm: fetchData called, isRetry:",
        isRetry
      );
      const supabase = createAuthenticatedClient();

      try {
        setLoadingData(true);
        clearError("general");
        clearError("patients");
        clearError("doctors");

        // Fetch patients with error handling
        let patientsData: Patient[] = [];
        try {
          console.log("AppointmentBookingForm: Starting patients API call...");
          const { data, error: patientsError } = await supabase
            .from("patients")
            .select("id, full_name, phone, email, date_of_birth, gender")
            .order("full_name");

          console.log("AppointmentBookingForm: Patients API response:", {
            data,
            error: patientsError,
          });

          if (patientsError) throw patientsError;

          patientsData = data || [];
          setPatients(patientsData);
          setFilteredPatients(patientsData);

          if (patientsData.length === 0) {
            setError("patients", {
              message:
                "No patients found in the system. Please add patients first.",
              type: "validation",
            });
          }
        } catch (error) {
          const parsedError = parseError(error, "fetching patients");
          setError("patients", parsedError);

          // Set fallback empty array
          setPatients([]);
          setFilteredPatients([]);
        }

        // Fetch doctors with error handling - need to join users and user_profiles
        let mappedDoctors: Doctor[] = [];
        try {
          const { data: doctorsData, error: doctorsError } = await supabase
            .from("users")
            .select(
              `
            id, 
            full_name, 
            user_profiles!inner(
              department,
              specialization
            )
          `
            )
            .eq("role", "doctor")
            .eq("is_active", true)
            .order("full_name");

          if (doctorsError) throw doctorsError;

          interface DoctorData {
            id: string;
            full_name: string;
            user_profiles: {
              department?: string;
              specialization?: string;
            }[];
          }
          mappedDoctors = (doctorsData as DoctorData[]).map((doc) => ({
            id: doc.id,
            name: doc.full_name,
            department: (doc.user_profiles[0]?.department || "general")
              .toLowerCase()
              .trim(),
            specialization:
              doc.user_profiles[0]?.specialization || "General Practice",
          }));

          console.log("Loaded doctors:", mappedDoctors); // Debug log
          setDoctors(mappedDoctors);

          if (mappedDoctors.length === 0) {
            setError("doctors", {
              message:
                "No active doctors found. Please ensure doctors are properly configured.",
              type: "validation",
            });
          }
        } catch (error) {
          const parsedError = parseError(error, "fetching doctors");
          setError("doctors", parsedError);

          // Set fallback empty array
          setDoctors([]);
          mappedDoctors = [];
        }

        // Fetch comprehensive departments from both doctors and services
        try {
          let departmentsFromDoctors: string[] = [];
          let departmentsFromServices: string[] = [];

          // Get departments from doctors
          if (mappedDoctors.length > 0) {
            departmentsFromDoctors = mappedDoctors
              .map((doc) => doc.department)
              .filter((dept) => dept && dept !== "general");
          }

          // Note: Services table doesn't have department field in current schema
          // We could potentially use service categories as departments, but for now
          // we'll rely on doctor departments and predefined common departments
          departmentsFromServices = [];

          // Combine and deduplicate departments
          const allDepartments = Array.from(
            new Set([
              "general", // Always include general
              ...departmentsFromDoctors,
              ...departmentsFromServices,
              // Add some common departments as fallback
              "cardiology",
              "dermatology",
              "orthopedics",
              "pediatrics",
              "gynecology",
              "neurology",
              "psychiatry",
              "radiology",
              "pathology",
              "surgery",
              "ent",
              "dental",
              "ophthalmology",
            ])
          );

          const formattedDepartments = allDepartments.map((dept) => ({
            value: dept.toLowerCase().trim(),
            label:
              dept.charAt(0).toUpperCase() + dept.slice(1).replace(/_/g, " "),
          }));

          console.log("Formatted departments:", formattedDepartments); // Debug log

          setDepartments(formattedDepartments);
        } catch (error) {
          console.error("Error processing departments:", error);
          // Comprehensive fallback departments
          setDepartments([
            { value: "general", label: "General Medicine" },
            { value: "cardiology", label: "Cardiology" },
            { value: "dermatology", label: "Dermatology" },
            { value: "orthopedics", label: "Orthopedics" },
            { value: "pediatrics", label: "Pediatrics" },
            { value: "gynecology", label: "Gynecology" },
            { value: "neurology", label: "Neurology" },
            { value: "psychiatry", label: "Psychiatry" },
            { value: "radiology", label: "Radiology" },
            { value: "pathology", label: "Pathology" },
            { value: "surgery", label: "Surgery" },
            { value: "ent", label: "ENT" },
            { value: "dental", label: "Dental" },
            { value: "ophthalmology", label: "Ophthalmology" },
          ]);
        }

        // Reset retry count on success
        if (isRetry) {
          setRetryCount((prev) => ({ ...prev, patients: 0, doctors: 0 }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        const parsedError = parseError(error, "fetching initial data");
        setError("general", parsedError);
      } finally {
        setLoadingData(false);
      }
    },
    [parseError, clearError, setError]
  );

  const fetchAvailableTimeSlots = useCallback(
    async (isRetry = false) => {
      if (!formData.doctor_id || !formData.scheduled_date) {
        setAvailableTimeSlots([]);
        clearError("timeSlots");
        return;
      }

      const supabase = createAuthenticatedClient();
      setLoadingTimeSlots(true);
      clearError("timeSlots");

      try {
        // Get existing appointments for the selected doctor and date
        const { data: existingAppointments, error } = await supabase
          .from("appointments")
          .select("scheduled_time, duration")
          .eq("doctor_id", formData.doctor_id)
          .eq("scheduled_date", formData.scheduled_date)
          .in("status", ["scheduled", "confirmed", "arrived", "in_progress"]);

        if (error) throw error;

        // Define all possible time slots
        const allSlots = [
          "08:00",
          "08:30",
          "09:00",
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00",
          "18:30",
        ];

        // Check for past time slots if the selected date is today
        const selectedDate = new Date(formData.scheduled_date);
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        const currentTime = today.toTimeString().slice(0, 5);

        // Create a set of occupied time slots
        const occupiedSlots = new Set<string>();

        // Mark existing appointments as occupied
        existingAppointments.forEach((apt) => {
          const startTime = apt.scheduled_time;
          const duration = apt.duration || 30;

          // Mark the appointment time and next slots based on duration
          const startIndex = allSlots.indexOf(startTime);
          if (startIndex !== -1) {
            const slotsToBlock = Math.ceil(duration / 30);
            for (let i = 0; i < slotsToBlock; i++) {
              if (startIndex + i < allSlots.length) {
                occupiedSlots.add(allSlots[startIndex + i]!);
              }
            }
          }
        });

        // Mark past time slots as unavailable if the date is today
        if (isToday) {
          allSlots.forEach((slot) => {
            if (slot <= currentTime) {
              occupiedSlots.add(slot);
            }
          });
        }

        // Generate available time slots
        const availableSlots = allSlots.map((time) => {
          let reason: string | undefined;
          if (occupiedSlots.has(time)) {
            if (isToday && time <= currentTime) {
              reason = "Past time";
            } else {
              reason = "Already booked";
            }
          }

          return {
            time,
            available: !occupiedSlots.has(time),
            reason,
          };
        });

        setAvailableTimeSlots(availableSlots);

        // Check if there are any available slots
        const hasAvailableSlots = availableSlots.some((slot) => slot.available);
        if (!hasAvailableSlots) {
          setError("timeSlots", {
            message: `No available time slots for the selected doctor on ${formData.scheduled_date}. Please choose a different date.`,
            type: "validation",
          });
        }

        // Reset retry count on success
        if (isRetry) {
          setRetryCount((prev) => ({ ...prev, timeSlots: 0 }));
        }
      } catch (error) {
        console.error("Error fetching available time slots:", error);
        const parsedError = parseError(error, "fetching time slots");
        setError("timeSlots", parsedError);

        // Fallback to limited available slots
        const fallbackSlots = timeSlots.map((time) => ({
          time,
          available: true,
        }));
        setAvailableTimeSlots(fallbackSlots);
      } finally {
        setLoadingTimeSlots(false);
      }
    },
    [
      formData.doctor_id,
      formData.scheduled_date,
      parseError,
      clearError,
      setError,
    ]
  );

  // Patient search functionality
  const handlePatientSearch = useCallback(
    (query: string) => {
      setPatientSearchQuery(query);
      setShowPatientDropdown(true);

      if (!query.trim()) {
        setFilteredPatients(patients);
        return;
      }

      const filtered = patients.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(query.toLowerCase()) ||
          patient.phone?.includes(query) ||
          patient.email?.toLowerCase().includes(query.toLowerCase())
      );

      setFilteredPatients(filtered);
    },
    [patients]
  );

  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatient(patient.full_name);
    setPatientSearchQuery(patient.full_name);
    setShowPatientDropdown(false);
    handleInputChange("patient_id", patient.id);
  }, []);

  useEffect(() => {
    console.log(
      "AppointmentBookingForm: useEffect triggered, calling fetchData..."
    );
    fetchData();
  }, [fetchData]);

  // Debug: Monitor when fetchData changes
  useEffect(() => {
    console.log("AppointmentBookingForm: fetchData function reference changed");
  }, [fetchData]);

  // Fetch available time slots when doctor or date changes
  useEffect(() => {
    if (formData.doctor_id && formData.scheduled_date) {
      fetchAvailableTimeSlots();
    }
  }, [formData.doctor_id, formData.scheduled_date, fetchAvailableTimeSlots]);

  // Set initial patient search if patient_id is provided
  useEffect(() => {
    if (formData.patient_id && patients.length > 0) {
      const patient = patients.find((p) => p.id === formData.patient_id);
      if (patient) {
        setSelectedPatient(patient.full_name);
        setPatientSearchQuery(patient.full_name);
      }
    }
  }, [formData.patient_id, patients]);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

  const handleInputChange = (
    field: keyof AppointmentBookingForm,
    value: unknown
  ) => {
    console.log(`Setting ${field} to:`, value); // Debug log
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Clear previous errors
    clearError("submit");
    setValidationErrors({
      department: null,
      appointment_type: null,
      patient_id: undefined,
      doctor_id: undefined,
      scheduled_date: undefined,
      scheduled_time: undefined,
      title: undefined,
    });

    // Validate form
    if (!validateForm()) {
      setError("submit", {
        message: "Please fix the validation errors above.",
        type: "validation",
      });
      return;
    }

    try {
      // Additional validation
      const supabase = createAuthenticatedClient();

      // Check if the selected time slot is still available
      const { data: conflictingAppointments, error: conflictError } =
        await supabase
          .from("appointments")
          .select("id")
          .eq("doctor_id", formData.doctor_id)
          .eq("scheduled_date", formData.scheduled_date)
          .eq("scheduled_time", formData.scheduled_time)
          .in("status", ["scheduled", "confirmed", "arrived", "in_progress"]);

      if (conflictError) {
        throw new Error(
          `Failed to check time slot availability: ${conflictError.message}`
        );
      }

      if (conflictingAppointments && conflictingAppointments.length > 0) {
        setError("submit", {
          message:
            "The selected time slot is no longer available. Please choose a different time.",
          type: "validation",
        });

        // Refresh time slots
        await fetchAvailableTimeSlots();
        return;
      }

      // If validation passes, submit the form
      onSubmit(formData);
    } catch (error) {
      console.error("Form submission validation error:", error);
      const parsedError = parseError(error, "form submission");
      setError("submit", parsedError);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    console.log("Selected doctor:", doctor); // Debug log
    console.log("Available departments:", departments); // Debug log

    if (doctor) {
      console.log("Auto-populating department:", doctor.department); // Debug log

      // Try direct state update to ensure it works
      setFormData((prev) => ({
        ...prev,
        doctor_id: doctorId,
        department: doctor.department,
      }));
    }
  };

  const handleDepartmentChange = (department: string) => {
    handleInputChange("department", department);
    // Clear doctor selection when department changes to avoid mismatch
    handleInputChange("doctor_id", "");
  };

  // Error display component
  const ErrorDisplay = ({
    error,
    onRetry,
    operation,
  }: {
    error: ApiError | null;
    onRetry: () => void;
    operation: string;
  }) => {
    if (!error) return null;

    const getErrorIcon = (type: ApiError["type"]) => {
      switch (type) {
        case "network":
          return <XCircleIcon className="h-5 w-5 text-red-500" />;
        case "server":
          return <AlertCircleIcon className="h-5 w-5 text-orange-500" />;
        case "validation":
          return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
        case "permission":
          return <XCircleIcon className="h-5 w-5 text-red-500" />;
        default:
          return <AlertCircleIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getErrorColor = (type: ApiError["type"]) => {
      switch (type) {
        case "network":
          return "border-red-200 bg-red-50";
        case "server":
          return "border-orange-200 bg-orange-50";
        case "validation":
          return "border-yellow-200 bg-yellow-50";
        case "permission":
          return "border-red-200 bg-red-50";
        default:
          return "border-gray-200 bg-gray-50";
      }
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${getErrorColor(error.type)}`}>
        <div className="flex items-start gap-3">
          {getErrorIcon(error.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {error.type === "network"
                ? "Connection Error"
                : error.type === "server"
                ? "Server Error"
                : error.type === "validation"
                ? "Validation Error"
                : error.type === "permission"
                ? "Permission Error"
                : "Error"}
            </h4>
            <p className="text-sm text-gray-700">{error.message}</p>
            {error.details && (
              <p className="text-xs text-gray-500 mt-1">{error.details}</p>
            )}
          </div>
          {(error.type === "network" || error.type === "server") && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="shrink-0"
            >
              <RefreshCwIcon className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loadingData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Book Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Loading doctors and departments...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show doctors based on department selection, or all doctors if no department selected
  const filteredDoctors = formData.department
    ? doctors.filter((doc) => doc.department === formData.department)
    : doctors;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book New Appointment
        </CardTitle>
        <CardDescription>
          Schedule a new appointment for a patient
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* General Error Display */}
        {errors.general && (
          <div className="mb-6">
            <ErrorDisplay
              error={errors.general}
              onRetry={() => retryOperation("general", fetchData)}
              operation="general"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="patient_search"
                className="flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                Patient *
              </Label>
              <div className="relative space-y-2 patient-search-container">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patient_search"
                    placeholder="Search patient by name, phone, or email..."
                    value={patientSearchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    onFocus={() => setShowPatientDropdown(true)}
                    disabled={isLoading}
                    className="pl-10"
                  />
                  {selectedPatient && (
                    <CheckIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>

                {/* Patient Dropdown */}
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-50 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <div
                        key={patient.id}
                        className="px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm leading-tight">
                              {patient.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                              {patient.phone && <span>📞 {patient.phone}</span>}
                              {patient.email && <span>📧 {patient.email}</span>}
                            </div>
                            {patient.date_of_birth && (
                              <div className="text-xs text-muted-foreground mt-1">
                                DOB:{" "}
                                {new Date(
                                  patient.date_of_birth
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {patient.gender || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {patientSearchQuery && filteredPatients.length === 0 && (
                      <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                        No patients found matching &quot;{patientSearchQuery}
                        &quot;
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Patient Display */}
                {selectedPatient && formData.patient_id && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Selected: {selectedPatient}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient("");
                          setPatientSearchQuery("");
                          setFormData((prev) => ({ ...prev, patient_id: "" }));
                          setShowPatientDropdown(false);
                        }}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}

                {/* Patient Error Display */}
                {errors.patients && (
                  <ErrorDisplay
                    error={errors.patients}
                    onRetry={() => retryOperation("patients", fetchData)}
                    operation="patients"
                  />
                )}

                {/* Patient Validation Error */}
                {validationErrors.patient_id && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {validationErrors.patient_id}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_type">Appointment Type *</Label>
              <Select
                value={formData.appointment_type}
                onValueChange={(value: AppointmentType) =>
                  handleInputChange("appointment_type", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-auto min-h-[2.75rem] py-3">
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="text-left">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Appointment Type Validation Error */}
              {validationErrors.appointment_type && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {validationErrors.appointment_type}
                </div>
              )}
            </div>
          </div>

          {/* Department & Doctor Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                Department *
                <span className="text-xs text-muted-foreground font-normal">
                  (Optional: filter doctors, or select doctor first)
                </span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={handleDepartmentChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-auto min-h-[2.5rem] py-2">
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept.value}
                      value={dept.value}
                      className="py-2 text-left"
                    >
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Auto-populated department indicator */}
              {formData.department && formData.doctor_id && (
                <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-md p-2 flex items-center gap-1">
                  <CheckIcon className="h-3 w-3" />
                  Department auto-populated from selected doctor
                </div>
              )}

              {/* Department Validation Error */}
              {validationErrors.department && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {validationErrors.department}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor_id" className="flex items-center gap-2">
                <StethoscopeIcon className="h-4 w-4" />
                Doctor *
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (Department will auto-populate)
                </span>
              </Label>
              <Select
                value={formData.doctor_id}
                onValueChange={handleDoctorChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-auto min-h-[3rem] py-3">
                  <SelectValue
                    placeholder={
                      formData.department && filteredDoctors.length === 0
                        ? `No doctors available in ${
                            departments.find(
                              (d) => d.value === formData.department
                            )?.label || "selected department"
                          }`
                        : "Select doctor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <SelectItem
                        key={doctor.id}
                        value={doctor.id}
                        className="py-3"
                      >
                        <div className="text-left w-full">
                          <div className="font-medium leading-tight">
                            {doctor.name}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{doctor.specialization}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {departments.find(
                                (d) => d.value === doctor.department
                              )?.label || doctor.department}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : formData.department ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      <div className="mb-2">
                        No doctors available in{" "}
                        {
                          departments.find(
                            (d) => d.value === formData.department
                          )?.label
                        }
                      </div>
                      <div className="text-xs">
                        Try selecting a different department
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Please select a department first
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Doctor Error Display */}
              {errors.doctors && (
                <ErrorDisplay
                  error={errors.doctors}
                  onRetry={() => retryOperation("doctors", fetchData)}
                  operation="doctors"
                />
              )}

              {/* No doctors available message */}
              {formData.department && filteredDoctors.length === 0 && (
                <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StethoscopeIcon className="h-4 w-4" />
                    <span className="font-medium">No doctors available</span>
                  </div>
                  <p className="text-xs">
                    No doctors are currently assigned to the{" "}
                    {
                      departments.find((d) => d.value === formData.department)
                        ?.label
                    }{" "}
                    department. Please select a different department or contact
                    administration to add doctors to this department.
                  </p>
                </div>
              )}

              {/* Doctor Validation Error */}
              {validationErrors.doctor_id && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {validationErrors.doctor_id}
                </div>
              )}
            </div>
          </div>

          {/* Date & Duration Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  handleInputChange("scheduled_date", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                disabled={isLoading}
                required
              />

              {/* Date Validation Error */}
              {validationErrors.scheduled_date && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {validationErrors.scheduled_date}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={formData.duration?.toString() || "30"}
                onValueChange={(value) =>
                  handleInputChange("duration", parseInt(value))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-auto min-h-[2.5rem] py-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15" className="py-2 text-left">
                    15 minutes
                  </SelectItem>
                  <SelectItem value="30" className="py-2 text-left">
                    30 minutes
                  </SelectItem>
                  <SelectItem value="45" className="py-2 text-left">
                    45 minutes
                  </SelectItem>
                  <SelectItem value="60" className="py-2 text-left">
                    1 hour
                  </SelectItem>
                  <SelectItem value="90" className="py-2 text-left">
                    1.5 hours
                  </SelectItem>
                  <SelectItem value="120" className="py-2 text-left">
                    2 hours
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Slot Selection - Separate Section */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label
                htmlFor="scheduled_time"
                className="flex items-center gap-2 text-base font-medium"
              >
                <ClockIcon className="h-5 w-5" />
                Available Time Slots *
              </Label>

              {/* Loading state for time slots */}
              {loadingTimeSlots && (
                <div className="p-6 text-center bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading available slots...
                  </p>
                </div>
              )}

              {/* No doctor or date selected */}
              {!formData.doctor_id || !formData.scheduled_date ? (
                <div className="p-6 text-center text-sm text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Please select a doctor and date first to see available time
                  slots
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Available time slots grid */}
                  {availableTimeSlots.length > 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto">
                        {availableTimeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available || isLoading}
                            onClick={() =>
                              handleInputChange("scheduled_time", slot.time)
                            }
                            className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                              formData.scheduled_time === slot.time
                                ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                                : slot.available
                                ? "bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 text-gray-700 hover:shadow-sm"
                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <span className="font-semibold">{slot.time}</span>
                              {!slot.available && slot.reason && (
                                <span className="text-xs opacity-75">
                                  Booked
                                </span>
                              )}
                              {slot.available && (
                                <span className="text-xs text-green-600 font-medium">
                                  Available
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !loadingTimeSlots && (
                      <div className="p-6 text-center text-sm text-muted-foreground bg-red-50 border-2 border-red-200 rounded-lg">
                        <ClockIcon className="h-8 w-8 mx-auto mb-2 text-red-400" />
                        No available slots found for selected doctor and date
                      </div>
                    )
                  )}

                  {/* Selected time slot confirmation */}
                  {formData.scheduled_time && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center gap-3">
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                          Selected Time: {formData.scheduled_time}
                        </span>
                        <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          {formData.duration} minutes
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Time Slot Validation Error */}
              {validationErrors.scheduled_time && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {validationErrors.scheduled_time}
                </div>
              )}

              {/* Time Slots Loading Error */}
              {errors.timeSlots && (
                <ErrorDisplay
                  error={errors.timeSlots}
                  onRetry={() => fetchAvailableTimeSlots()}
                  operation="loading time slots"
                />
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Appointment Title</Label>
            <Input
              id="title"
              placeholder="Brief title for the appointment"
              value={formData.title || ""}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={isLoading}
            />

            {/* Title Validation Error */}
            {validationErrors.title && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {validationErrors.title}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="patient_notes" className="flex items-center gap-2">
              <StethoscopeIcon className="h-4 w-4" />
              Appointment Notes
            </Label>
            <Textarea
              id="patient_notes"
              placeholder="Patient's symptoms, concerns, or any relevant information for this appointment..."
              value={formData.patient_notes || ""}
              onChange={(e) =>
                handleInputChange("patient_notes", e.target.value)
              }
              disabled={isLoading}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              Include patient symptoms, reason for visit, or any special
              instructions
            </div>
          </div>

          {/* Priority Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="priority"
              checked={formData.priority}
              onCheckedChange={(checked) =>
                handleInputChange("priority", !!checked)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="priority"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
              Priority Appointment
              <span className="text-muted-foreground font-normal">
                (Requires urgent attention)
              </span>
            </Label>
          </div>

          {/* Submit Error Display */}
          {errors.submit && (
            <ErrorDisplay
              error={errors.submit}
              onRetry={() => {
                clearError("submit");
                // Re-trigger form submission would require state management
                // For now, user can click submit button again
              }}
              operation="submitting appointment"
            />
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
