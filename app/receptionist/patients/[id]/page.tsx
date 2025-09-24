"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  CreditCard,
  FileText,
  History,
} from "lucide-react";
interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_group: string;
  allergies: string[];
  medical_history: string;
  insurance_provider: string;
  insurance_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OpdRecord {
  id: string;
  patient_id: string;
  visit_date: string;
  token_number: number;
  opd_status: string;
  chief_complaint: string;
  examination_findings: string;
  diagnosis: string;
  treatment_plan: string;
  created_at: string;
  updated_at: string;
  appointments?: Array<{
    id: string;
    appointment_type: string;
    status: string;
    scheduled_date: string;
    scheduled_time: string;
    users?: {
      full_name: string;
      specialization?: string;
    };
  }>;
}

interface PatientWithDetails extends Patient {
  appointments?: Array<{
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    appointment_type: string;
    estimated_cost?: number;
    opd_id?: string;
    users?: {
      full_name: string;
      specialization?: string;
    };
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    amount_paid: number;
    balance_amount: number;
    payment_status: string;
    created_at: string;
  }>;
  opd_records?: OpdRecord[];
}

export default function ReceptionistPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const patientId = params.id as string;

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        // Fetch patient basic info
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single();

        if (patientError) {
          setError("Patient not found");
          return;
        }

        // Fetch receptionist-specific related data
        const [appointmentsRes, invoicesRes, opdRecordsRes] = await Promise.all(
          [
            supabase
              .from("appointments")
              .select(
                `
              id,
              scheduled_date,
              scheduled_time,
              status,
              appointment_type,
              estimated_cost,
              opd_id,
              users(full_name, specialization)
            `
              )
              .eq("patient_id", patientId)
              .order("scheduled_date", { ascending: false })
              .limit(10),

            supabase
              .from("invoices")
              .select("*")
              .eq("patient_id", patientId)
              .order("created_at", { ascending: false })
              .limit(10),

            supabase
              .from("opd_records")
              .select(
                `
              id,
              patient_id,
              visit_date,
              token_number,
              opd_status,
              chief_complaint,
              examination_findings,
              diagnosis,
              treatment_plan,
              created_at,
              updated_at
            `
              )
              .eq("patient_id", patientId)
              .order("visit_date", { ascending: false })
              .limit(10),
          ]
        );

        // Fetch appointments for each OPD record
        const opdRecordsWithAppointments = await Promise.all(
          (opdRecordsRes.data || []).map(async (opd) => {
            const { data: opdAppointments } = await supabase
              .from("appointments")
              .select(`
                id,
                appointment_type,
                status,
                scheduled_date,
                scheduled_time,
                users(full_name, specialization)
              `)
              .eq("opd_id", opd.id)
              .order("scheduled_date", { ascending: false });

            return {
              ...opd,
              appointments: opdAppointments || [],
            };
          })
        );

        setPatient({
          ...patientData,
          appointments: appointmentsRes.data || [],
          invoices: invoicesRes.data || [],
          opd_records: opdRecordsWithAppointments,
        });
      } catch (err) {
        setError("Failed to load patient details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const getTotalOutstanding = () => {
    return (
      patient?.invoices?.reduce(
        (sum, invoice) => sum + (invoice.balance_amount || 0),
        0
      ) || 0
    );
  };

  const getOpdCurrentStage = (opd: OpdRecord) => {
    if (!opd.appointments || opd.appointments.length === 0) {
      return { stage: "No Appointments", status: "pending", color: "gray" };
    }

    const latestAppointment = opd.appointments[0];
    const appointmentType =
      latestAppointment.appointment_type || "consultation";
    const appointmentStatus = latestAppointment.status || "scheduled";

    // Determine stage based on appointment type and status
    if (appointmentStatus === "completed") {
      if (appointmentType === "consultation") {
        return {
          stage: "Consultation Complete",
          status: "completed",
          color: "green",
        };
      } else if (appointmentType === "followup") {
        return {
          stage: "Follow-up Complete",
          status: "completed",
          color: "green",
        };
      } else if (appointmentType === "treatment") {
        return {
          stage: "Treatment Complete",
          status: "completed",
          color: "green",
        };
      }
    } else if (appointmentStatus === "scheduled") {
      if (appointmentType === "consultation") {
        return {
          stage: "Consultation Scheduled",
          status: "ongoing",
          color: "blue",
        };
      } else if (appointmentType === "followup") {
        return {
          stage: "Follow-up Scheduled",
          status: "ongoing",
          color: "blue",
        };
      } else if (appointmentType === "treatment") {
        return {
          stage: "Treatment Scheduled",
          status: "ongoing",
          color: "blue",
        };
      }
    } else if (appointmentStatus === "cancelled") {
      return {
        stage: "Appointment Cancelled",
        status: "cancelled",
        color: "red",
      };
    }

    return { stage: "In Progress", status: "ongoing", color: "yellow" };
  };

  const getOpdStats = () => {
    const opds = patient?.opd_records || [];
    const total = opds.length;
    const ongoing = opds.filter(
      (opd) => getOpdCurrentStage(opd).status === "ongoing"
    ).length;
    const completed = opds.filter(
      (opd) => getOpdCurrentStage(opd).status === "completed"
    ).length;
    const pending = opds.filter(
      (opd) => getOpdCurrentStage(opd).status === "pending"
    ).length;

    return { total, ongoing, completed, pending };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || "Patient not found"}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Patient Profile</h1>
        </div>
        <div className="flex space-x-2">
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/admin/patients/${patient.id}/consultations-history`)
            }
          >
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{patient.full_name}</CardTitle>
              <CardDescription>Patient ID: {patient.id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  Born: {new Date(patient.date_of_birth).toLocaleDateString()}
                </span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center space-x-3">
                <Heart className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{patient.gender}</span>
              </div>
            )}
          </div>

          {patient.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <span>{patient.address}</span>
            </div>
          )}

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">
                Emergency Contact
              </h4>
              <p className="text-red-600">{patient.emergency_contact_name}</p>
              {patient.emergency_contact_phone && (
                <p className="text-red-600 text-sm">
                  {patient.emergency_contact_phone}
                </p>
              )}
            </div>
          )}

          {/* Medical Information */}
          {(patient.allergies?.length > 0 ||
            patient.medical_history ||
            patient.blood_group) && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Medical Information</h4>

              {patient.blood_group && (
                <div className="flex items-center space-x-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>
                    Blood Group: <strong>{patient.blood_group}</strong>
                  </span>
                </div>
              )}

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="p-3 bg-red-50 border-l-2 border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800">Allergies:</p>
                  <p className="text-sm text-red-700">
                    {patient.allergies.join(", ")}
                  </p>
                </div>
              )}

              {patient.medical_history && (
                <div className="p-3 bg-orange-50 border-l-2 border-orange-200 rounded">
                  <p className="text-sm font-medium text-orange-800">
                    Medical History:
                  </p>
                  <p className="text-sm text-orange-700">
                    {patient.medical_history}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Insurance Information */}
          {(patient.insurance_provider || patient.insurance_number) && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Insurance Information
              </h4>
              {patient.insurance_provider && (
                <p className="text-blue-600">
                  Provider: {patient.insurance_provider}
                </p>
              )}
              {patient.insurance_number && (
                <p className="text-blue-600 text-sm">
                  Number: {patient.insurance_number}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPD Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getOpdStats().total}
            </div>
            <p className="text-sm text-gray-600">Total OPDs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {getOpdStats().ongoing}
            </div>
            <p className="text-sm text-gray-600">Ongoing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {getOpdStats().completed}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {getOpdStats().pending}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* OPD Records */}
      {patient.opd_records && patient.opd_records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>OPD Records</CardTitle>
            <CardDescription>
              Patient&apos;s OPD sessions with current stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.opd_records.slice(0, 5).map((opd) => {
                const stageInfo = getOpdCurrentStage(opd);
                const latestAppointment = opd.appointments?.[0];

                return (
                  <div
                    key={opd.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-medium">Token #{opd.token_number}</p>
                        <Badge
                          variant={
                            stageInfo.color === "green"
                              ? "default"
                              : stageInfo.color === "blue"
                              ? "secondary"
                              : stageInfo.color === "red"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {stageInfo.stage}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Visit Date:{" "}
                        {new Date(opd.visit_date).toLocaleDateString()}
                      </p>
                      {opd.chief_complaint && (
                        <p className="text-sm text-gray-500 mb-1">
                          Chief Complaint: {opd.chief_complaint}
                        </p>
                      )}
                      {latestAppointment && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>
                            Last Appointment:{" "}
                            {latestAppointment.appointment_type} on{" "}
                            {new Date(
                              latestAppointment.scheduled_date
                            ).toLocaleDateString()}
                          </span>
                          {latestAppointment.users?.full_name && (
                            <span>
                              • Dr. {latestAppointment.users.full_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">
                        {opd.opd_status}
                      </p>
                      {opd.diagnosis && (
                        <p className="text-xs text-gray-500 max-w-[200px] truncate">
                          {opd.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Appointments */}
      {patient.appointments && patient.appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.appointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">
                        {appointment.users?.full_name || "Unknown Doctor"}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {appointment.appointment_type || "consultation"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        appointment.scheduled_date
                      ).toLocaleDateString()}{" "}
                      at {appointment.scheduled_time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.users?.specialization}
                    </p>
                    {appointment.opd_id && (
                      <p className="text-xs text-blue-500">OPD Linked</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        appointment.status === "completed"
                          ? "default"
                          : appointment.status === "scheduled"
                          ? "secondary"
                          : appointment.status === "cancelled"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {appointment.status}
                    </Badge>
                    {appointment.estimated_cost && (
                      <Badge variant="outline">
                        ₹{appointment.estimated_cost}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {patient.invoices && patient.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patient.invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Invoice #{invoice.invoice_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Total: ₹{invoice.total_amount}</span>
                      <span>Paid: ₹{invoice.amount_paid}</span>
                      <span>Balance: ₹{invoice.balance_amount}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        invoice.payment_status === "completed"
                          ? "default"
                          : invoice.payment_status === "partial"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {invoice.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
