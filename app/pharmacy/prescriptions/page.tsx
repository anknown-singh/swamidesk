"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Pill,
  FileTextIcon,
} from "lucide-react";

interface Prescription {
  id: any;
  status: any;
  priority: any;
  created_at: any;
  patients?: any;
  users?: any;
  prescription_items?: any;
}

interface TreatmentPlanPrescription {
  id: any;
  consultation_id: any;
  medications: any;
  created_at: any;
  status: any;
  priority: any;
  consultation_sessions?: any;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlanPrescriptions, setTreatmentPlanPrescriptions] = useState<
    TreatmentPlanPrescription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all', 'traditional', 'treatment_plans'
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set initial filter from URL params
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      setStatusFilter(filter === "pending" ? "pending" : "all");
    }
  }, [searchParams]);

  const fetchTreatmentPlanPrescriptions = useCallback(async () => {
    const supabase = createClient();
    try {
      // Fetch treatment plans with medications
      const { data: treatmentPlans, error } = await supabase
        .from("consultation_treatment_plans")
        .select(
          `
          id,
          consultation_id,
          medications,
          created_at,
          consultation_sessions(
            patient_id,
            doctor_id,
            patients(full_name),
            users(full_name)
          )
        `
        )
        .not("medications", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform treatment plans to prescription format
      const transformedPrescriptions: any = (treatmentPlans || [])
        .filter(
          (plan: any) =>
            plan.medications &&
            Array.isArray(plan.medications) &&
            plan.medications.length > 0
        )
        .map((plan: any) => ({
          id: plan.id,
          consultation_id: plan.consultation_id,
          medications: plan.medications,
          created_at: plan.created_at,
          status: "pending",
          priority: false,
          consultation_sessions: plan.consultation_sessions,
        }));

      setTreatmentPlanPrescriptions(transformedPrescriptions);
    } catch (error) {
      console.error("Error fetching treatment plan prescriptions:", error);
    }
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    const supabase = createClient();
    try {
      setLoading(true);

      // Fetch traditional prescriptions
      let query = supabase
        .from("prescriptions")
        .select(
          `
          id,
          status,
          priority,
          created_at,
          patients(full_name),
          users!prescriptions_prescribed_by_fkey(full_name),
          prescription_items(
            id,
            quantity,
            medicines(name)
          )
        `
        )
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrescriptions(data || []);

      // Also fetch treatment plan prescriptions
      await fetchTreatmentPlanPrescriptions();
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fetchTreatmentPlanPrescriptions]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleDispense = (prescriptionId: string) => {
    router.push(`/pharmacy/prescriptions/${prescriptionId}/dispense`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "dispensed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Combined filtering for both prescription types
  const getFilteredPrescriptions = () => {
    let combinedPrescriptions: any = [];

    // Include traditional prescriptions
    if (sourceFilter === "all" || sourceFilter === "traditional") {
      combinedPrescriptions = [...combinedPrescriptions, ...prescriptions];
    }

    // Include treatment plan prescriptions
    if (sourceFilter === "all" || sourceFilter === "treatment_plans") {
      combinedPrescriptions = [
        ...combinedPrescriptions,
        ...treatmentPlanPrescriptions,
      ];
    }

    // Apply search and status filters
    return combinedPrescriptions.filter((prescription: any) => {
      // Status filter
      if (statusFilter !== "all" && prescription.status !== statusFilter) {
        return false;
      }

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      if (searchTerm) {
        // For traditional prescriptions
        if ("patients" in prescription && prescription.patients) {
          const patientName =
            prescription.patients.full_name?.toLowerCase() || "";
          const doctorName = prescription.users?.full_name?.toLowerCase() || "";
          return (
            patientName.includes(searchLower) ||
            doctorName.includes(searchLower)
          );
        }
        // For treatment plan prescriptions
        else if (
          "consultation_sessions" in prescription &&
          prescription.consultation_sessions
        ) {
          const patientName =
            prescription.consultation_sessions.patients?.full_name?.toLowerCase() ||
            "";
          const doctorName =
            prescription.consultation_sessions.users?.full_name?.toLowerCase() ||
            "";
          return (
            patientName.includes(searchLower) ||
            doctorName.includes(searchLower)
          );
        }
      }

      return true;
    });
  };

  const filteredPrescriptions = getFilteredPrescriptions();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Loading prescriptions...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
        <p className="text-muted-foreground">
          Manage and dispense patient prescriptions from consultations and
          treatment plans
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by patient or doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispensed">Dispensed</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              aria-label="Filter by source"
            >
              <option value="all">All Sources</option>
              <option value="traditional">Traditional Prescriptions</option>
              <option value="treatment_plans">Treatment Plans</option>
            </select>
            <div className="text-sm text-muted-foreground">
              {filteredPrescriptions.length} prescriptions found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prescriptions.length + treatmentPlanPrescriptions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {
                [...prescriptions, ...treatmentPlanPrescriptions].filter(
                  (p) => p.status === "pending"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                [...prescriptions, ...treatmentPlanPrescriptions].filter(
                  (p) => p.status === "dispensed"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                [...prescriptions, ...treatmentPlanPrescriptions].filter(
                  (p) => p.priority
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Treatment Plans
            </CardTitle>
            <FileTextIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {treatmentPlanPrescriptions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Prescription Queue</CardTitle>
          <CardDescription>
            Click on any prescription to begin dispensing process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription: any) => {
              // Determine if this is a traditional prescription or treatment plan prescription
              const isTraditionalPrescription =
                "prescription_items" in prescription;
              const isTreatmentPlan = "medications" in prescription;

              // Extract patient and doctor info based on prescription type
              let patientName: any,
                doctorName: any,
                medicineCount: any,
                medications: any;

              if (isTraditionalPrescription) {
                patientName =
                  prescription.patients?.full_name || "Unknown Patient";
                doctorName = prescription.users?.full_name || "Unknown Doctor";
                medicineCount = prescription.prescription_items?.length || 0;
                medications = prescription.prescription_items;
              } else if (isTreatmentPlan) {
                const tpPrescription = prescription as any;
                patientName =
                  tpPrescription.consultation_sessions?.patients?.full_name ||
                  "Unknown Patient";
                doctorName =
                  tpPrescription.consultation_sessions?.users?.full_name ||
                  "Unknown Doctor";
                medicineCount = Array.isArray(tpPrescription.medications)
                  ? tpPrescription.medications.length
                  : 0;
                medications = tpPrescription.medications;
              }

              return (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleDispense(prescription.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {patientName}
                            {prescription.priority && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                            {/* Source indicator */}
                            <Badge variant="outline" className="text-xs">
                              {isTreatmentPlan
                                ? "Treatment Plan"
                                : "Traditional"}
                            </Badge>
                          </h3>
                          <p className="text-sm text-gray-600">
                            Prescribed by Dr. {doctorName}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusColor(prescription.status)}`}
                        >
                          {prescription.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-gray-500" />
                          <span>{medicineCount} medicines</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            {new Date(
                              prescription.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>ID: {prescription.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      {/* Medicine Display - Different for each type */}
                      {isTraditionalPrescription &&
                        prescription.prescription_items &&
                        prescription.prescription_items.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Medicines: </span>
                            {prescription.prescription_items.map(
                              (item: any, index: any) => (
                                <span key={item.id}>
                                  {item.medicines.name} (x{item.quantity})
                                  {index <
                                  prescription.prescription_items!.length - 1
                                    ? ", "
                                    : ""}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      {isTreatmentPlan &&
                        medications &&
                        Array.isArray(medications) &&
                        medications.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Medicines: </span>
                            {medications.map((med, index) => (
                              <span key={index}>
                                {typeof med === "string"
                                  ? med
                                  : med.name || med.medication_name}
                                {typeof med === "object" &&
                                  med.dosage &&
                                  ` (${med.dosage})`}
                                {index < medications.length - 1 ? ", " : ""}
                              </span>
                            ))}
                            {/* Show detailed medication info for treatment plans */}
                            <div className="mt-2 space-y-1">
                              {medications.slice(0, 3).map((med, index) => {
                                if (typeof med === "object") {
                                  return (
                                    <div
                                      key={index}
                                      className="p-2 bg-blue-50 rounded border text-xs"
                                    >
                                      <div className="font-medium">
                                        {med.name || med.medication_name}
                                      </div>
                                      {med.dosage && (
                                        <div>Dosage: {med.dosage}</div>
                                      )}
                                      {med.frequency && (
                                        <div>Frequency: {med.frequency}</div>
                                      )}
                                      {med.duration && (
                                        <div>Duration: {med.duration}</div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              {medications.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{medications.length - 3} more medications
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDispense(prescription.id);
                        }}
                        disabled={prescription.status === "completed"}
                      >
                        {prescription.status === "pending"
                          ? "Dispense"
                          : "View"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No prescriptions found matching your criteria"
                  : "No prescriptions available"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
