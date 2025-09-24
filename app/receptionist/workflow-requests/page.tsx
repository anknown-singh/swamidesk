"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
  FileTextIcon,
  PillIcon,
  StethoscopeIcon,
  PhoneIcon,
  MailIcon,
} from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useRouter } from "next/navigation";

interface WorkflowRequest {
  id: string;
  type: "follow_up" | "treatment" | "consultation" | "prescription" | "emergency";
  status: "pending" | "approved" | "rejected" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  patient_id: string;
  opd_id?: string;
  doctor_id?: string;
  requested_by: string;
  request_date: string;
  scheduled_date?: string;
  notes: string;
  response_notes?: string;
  request_details?: any;
  patient?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    specialization?: string;
  };
  requester?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export default function WorkflowRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<WorkflowRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WorkflowRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] =
    useState<WorkflowRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseNotes, setResponseNotes] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Fetch workflow requests
  const fetchWorkflowRequests = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch workflow requests from the dedicated workflow_requests table
      const { data: workflowRequests, error } = await supabase
        .from("workflow_requests")
        .select(
          `
          id,
          patient_id,
          opd_id,
          request_type,
          priority,
          status,
          requested_by,
          request_details,
          response_notes,
          created_at,
          updated_at,
          responded_at,
          patients(id, full_name, phone, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workflow requests:", error);
        setRequests([]);
        setFilteredRequests([]);
        return;
      }

      // Transform to WorkflowRequest format
      console.log('=== DEBUG: Raw workflow requests from database ===', workflowRequests);
      
      const transformedRequests: WorkflowRequest[] = (workflowRequests || []).map(
        (request: any) => {
          const transformed = {
            id: request.id,
            type: request.request_type as "follow_up" | "treatment" | "prescription" | "consultation",
            status: request.status as "pending" | "approved" | "rejected" | "completed",
            priority: request.priority as "low" | "medium" | "high" | "urgent",
            patient_id: request.patient_id,
            opd_id: request.opd_id,
            doctor_id: request.requested_by, // For now, use requested_by as doctor_id
            requested_by: request.requested_by,
            request_date: request.created_at,
            scheduled_date: request.request_details?.scheduledDate || null,
            notes: request.request_details?.notes || "",
            response_notes: request.response_notes || "",
            patient: request.patients
              ? {
                  id: request.patients.id,
                  full_name: request.patients.full_name,
                  phone: request.patients.phone,
                  email: request.patients.email,
                }
              : undefined,
            doctor: {
              id: request.requested_by,
              full_name: "Staff Member",
              specialization: "Healthcare Professional",
            },
          };
          
          console.log('=== DEBUG: Transformed request ===', transformed);
          return transformed;
        }
      );

      setRequests(transformedRequests);
      setFilteredRequests(transformedRequests);
    } catch (error) {
      console.error("Error fetching workflow requests:", error);
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter requests based on search and filters
  const applyFilters = useCallback(() => {
    console.log('=== DEBUG: applyFilters called ===');
    console.log('Total requests:', requests.length);
    console.log('Current filters:', { statusFilter, typeFilter, priorityFilter, searchTerm });
    
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.patient?.full_name?.toLowerCase().includes(searchLower) ||
          request.doctor?.full_name?.toLowerCase().includes(searchLower) ||
          request.notes?.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length);
    }

    // Status filter
    if (statusFilter !== "all") {
      console.log('Applying status filter:', statusFilter);
      filtered = filtered.filter((request) => request.status === statusFilter);
      console.log('After status filter:', filtered.length);
    }

    // Type filter
    if (typeFilter !== "all") {
      console.log('Applying type filter:', typeFilter);
      filtered = filtered.filter((request) => request.type === typeFilter);
      console.log('After type filter:', filtered.length);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      console.log('Applying priority filter:', priorityFilter);
      filtered = filtered.filter(
        (request) => request.priority === priorityFilter
      );
      console.log('After priority filter:', filtered.length);
    }

    console.log('Final filtered requests:', filtered.length);
    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchWorkflowRequests();
  }, [fetchWorkflowRequests]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle request response
  // Handle booking appointment - navigate to appointment booking page
  const handleBookAppointment = (request: WorkflowRequest) => {
    if (request.type === "follow_up" && request.patient_id) {
      // Get notes from request_details or fallback
      const notes = request.request_details?.notes || 
                   request.notes || 
                   "Follow-up appointment from workflow request";
      
      // Navigate to appointment booking page with patient ID and request details
      const queryParams = new URLSearchParams({
        patientId: request.patient_id,
        appointmentType: "follow_up",
        workflowRequestId: request.id,
        notes: notes,
        priority: request.priority === "high" ? "true" : "false",
      });
      
      // Add OPD ID if available - now using direct opd_id field
      if (request.opd_id) {
        queryParams.set('opd_id', request.opd_id);
      }
      
      console.log('=== DEBUG: Navigating to appointment booking ===');
      console.log('Query params:', queryParams.toString());
      console.log('Request object:', request);
      console.log('OPD ID (from opd_id field):', request.opd_id);
      
      router.push(`/receptionist/appointments/new?${queryParams.toString()}`);
    }
  };

  const handleRequestResponse = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const supabase = createClient();

      if (action === "approve") {
        // Just approve the request
        const { error: updateError } = await supabase
          .from("workflow_requests")
          .update({
            status: "approved",
            response_notes: responseNotes,
            responded_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) {
          console.error("Error approving request:", updateError);
          console.error("Error approving request");
          return;
        }

        console.log(
          `${selectedRequest?.type
            ?.replace("_", " ")
            .toUpperCase()} request approved successfully!`
        );
      } else if (action === "reject") {
        // Update workflow request status to rejected
        const { error } = await supabase
          .from("workflow_requests")
          .update({
            status: "rejected",
            response_notes: responseNotes,
            responded_at: new Date().toISOString()
          })
          .eq("id", requestId);

        if (error) {
          console.error("Error rejecting request:", error);
          console.error("Error rejecting request");
          return;
        }

        console.log(
          `${selectedRequest?.type
            ?.replace("_", " ")
            .toUpperCase()} request rejected.`
        );
      }

      // Refresh requests
      await fetchWorkflowRequests();
      setShowResponseModal(false);
      setSelectedRequest(null);
      setResponseNotes("");
      setScheduledTime("");
    } catch (error) {
      console.error("Error handling request response:", error);
      console.error("Error processing request");
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return <CalendarIcon className="h-4 w-4" />;
      case "treatment":
        return <PillIcon className="h-4 w-4" />;
      case "consultation":
        return <StethoscopeIcon className="h-4 w-4" />;
      case "emergency":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <FileTextIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "follow_up":
        return "text-green-600 bg-green-50 border-green-200";
      case "treatment":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "consultation":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "emergency":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workflow Requests
          </h1>
          <p className="text-muted-foreground">Loading workflow requests...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workflow Requests
          </h1>
          <p className="text-muted-foreground">
            Manage and respond to workflow requests from doctors and patients
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, doctor, or notes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  aria-label="Filter by type"
                >
                  <option value="all">All Types</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="treatment">Treatment</option>
                  <option value="consultation">Consultation</option>
                  <option value="emergency">Emergency</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  aria-label="Filter by priority"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <ClockIcon className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter((r) => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === "approved").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <ClockIcon className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.priority === "urgent").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Requests</CardTitle>
            <CardDescription>
              Review and manage incoming workflow requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg border ${getTypeColor(
                            request.type
                          )}`}
                        >
                          {getTypeIcon(request.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {request.patient?.full_name}
                            <Badge
                              className={getPriorityColor(request.priority)}
                            >
                              {request.priority.toUpperCase()}
                            </Badge>
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.type.replace("_", " ").toUpperCase()}{" "}
                            Request
                            {request.doctor &&
                              ` • Dr. ${request.doctor.full_name}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span>
                            Requested:{" "}
                            {new Date(
                              request.request_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {request.scheduled_date && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-gray-500" />
                            <span>
                              Scheduled:{" "}
                              {new Date(
                                request.scheduled_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span>ID: {request.id.slice(0, 8)}...</span>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Notes: </span>
                          {request.notes}
                        </div>
                      )}

                      {request.patient && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {request.patient.phone && (
                            <div className="flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {request.patient.phone}
                            </div>
                          )}
                          {request.patient.email && (
                            <div className="flex items-center gap-1">
                              <MailIcon className="h-3 w-3" />
                              {request.patient.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>

                      {request.status === "pending" && (
                        <div className="flex flex-col gap-2">
                          {request.type === "follow_up" && (
                            <Button
                              size="sm"
                              onClick={() => handleBookAppointment(request)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Book Appointment
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowResponseModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  typeFilter !== "all" ||
                  priorityFilter !== "all"
                    ? "No requests found matching your criteria"
                    : "No workflow requests available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(selectedRequest.type)}
                    Review Request
                  </CardTitle>
                  <CardDescription>
                    {selectedRequest.type.replace("_", " ").toUpperCase()} for{" "}
                    {selectedRequest.patient?.full_name}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResponseModal(false)}
                  className="h-6 w-6 p-0"
                >
                  <XCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Patient Information</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {selectedRequest.patient?.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.patient?.phone}
                  </p>
                  {selectedRequest.patient?.email && (
                    <p className="text-sm text-gray-600">
                      {selectedRequest.patient.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Request Details</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedRequest.notes}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested on{" "}
                    {new Date(
                      selectedRequest.request_date
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedRequest.type === "follow_up" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">
                    Scheduled Time (Optional)
                  </Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="response-notes">Response Notes</Label>
                <Textarea
                  id="response-notes"
                  placeholder="Add notes about your decision..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleRequestResponse(selectedRequest.id, "approve")
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2Icon className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() =>
                    handleRequestResponse(selectedRequest.id, "reject")
                  }
                  variant="outline"
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </>
  );
}
