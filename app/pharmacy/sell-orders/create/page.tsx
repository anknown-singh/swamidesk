"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { inventoryManager } from "@/lib/pharmacy/inventory-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompactPharmacyInvoice } from "@/components/pharmacy/CompactPharmacyInvoice";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  User,
  Pill,
  Calculator,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string;
  address: string | null;
}

interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit_category?: string;
  sale_unit?: string;
  unit_price: number;
  mrp: number;
  stock_quantity: number;
  minimum_stock: number;
  manufacturer: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  is_active: boolean;
}

interface OrderItem {
  medicine: Medicine;
  quantity: number;
  mrp: number;
  subtotal: number;
  total: number;
}

interface CustomerInfo {
  type: "registered" | "new";
  patient_id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export default function CreateSellOrderPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchMedicine, setSearchMedicine] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Customer Information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    type: "registered",
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Order Items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Order Details
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);

  // Invoice State
  const [showInvoice, setShowInvoice] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, date_of_birth, address")
        .order("full_name");

      if (patientsError) throw patientsError;

      // Fetch active medicines with stock
      const { data: medicinesData, error: medicinesError } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("name");

      if (medicinesError) throw medicinesError;

      setPatients(patientsData || []);
      setMedicines(medicinesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setCustomerInfo({
      type: "registered",
      patient_id: patient.id,
      name: patient.full_name,
      phone: patient.phone,
      email: patient.email || "",
      address: patient.address || "",
    });
    setSearchPatient(patient.full_name);
    setShowPatientDropdown(false);
  };

  const selectMedicine = (medicine: Medicine) => {
    // Check if medicine already exists in order
    const existingItemIndex = orderItems.findIndex(
      (item) => item.medicine.id === medicine.id
    );

    if (existingItemIndex >= 0) {
      // Increase quantity if already exists
      updateQuantity(
        existingItemIndex,
        orderItems[existingItemIndex].quantity + 1
      );
    } else {
      // Add new medicine with quantity 1
      const subtotal = medicine.mrp * 1;
      const total = subtotal; // No GST, simple total

      const newItem: OrderItem = {
        medicine,
        quantity: 1,
        mrp: medicine.mrp,
        subtotal,
        total,
      };

      setOrderItems((prev) => [...prev, newItem]);
    }

    setSearchMedicine("");
    setShowMedicineDropdown(false);
    setError(null);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const subtotal = item.mrp * newQuantity;
          const total = subtotal; // No GST, simple total

          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            total,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = (subtotal * discount) / 100;
    const grandTotal = subtotal - discountAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      patient.phone.includes(searchPatient)
  );

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchMedicine.toLowerCase()) ||
      medicine.generic_name
        ?.toLowerCase()
        .includes(searchMedicine.toLowerCase()) ||
      medicine.brand_name?.toLowerCase().includes(searchMedicine.toLowerCase())
  );

  const handlePrint = () => {
    if (!createdOrderData) return;

    // Create new window for printing
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice - ${createdOrderData.orderNumber}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }

            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .invoice-page {
              width: 210mm;
              min-height: 297mm;
              padding: 10mm;
              margin: 0 auto;
              background: white;
              position: relative;
              page-break-after: always;
            }

            .invoice-page:last-child {
              page-break-after: auto;
            }

            .corner-indicator {
              position: absolute;
              top: 0;
              right: 0;
              background: #1f2937;
              color: white;
              padding: 8px 16px;
              font-size: 10px;
              font-weight: 500;
              letter-spacing: 1px;
              border-bottom-left-radius: 8px;
            }

            .gradient-header {
              background: linear-gradient(to right, #f9fafb, #f3f4f6);
              padding: 24px;
              border-bottom: 1px solid #e5e7eb;
              border-radius: 8px 8px 0 0;
            }

            .invoice-box {
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .modern-table {
              border-collapse: collapse;
              width: 100%;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }

            .modern-table thead {
              background: #f9fafb;
            }

            .modern-table th {
              padding: 12px;
              font-size: 10px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
            }

            .modern-table td {
              padding: 12px;
              border-bottom: 1px solid #f3f4f6;
              font-size: 12px;
            }

            .totals-box {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              min-width: 220px;
            }

            .license-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
            }

            @media print {
              body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .invoice-page {
                width: 100%;
                min-height: auto;
                padding: 8mm;
                margin: 0;
                page-break-after: always;
              }

              .invoice-page:last-child {
                page-break-after: auto;
              }

              .gradient-header {
                background: #f3f4f6 !important;
              }

              .corner-indicator {
                background: #1f2937 !important;
                color: white !important;
              }
            }
          </style>
        </head>
        <body>
          <!-- Pharmacy Copy -->
          <div class="invoice-page">
            <div id="pharmacy-copy"></div>
          </div>

          <!-- Customer Copy -->
          <div class="invoice-page">
            <div id="customer-copy"></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for the window to load, then inject the invoice components
    printWindow.onload = () => {
      // Create temporary containers for the invoices
      const tempPharmacyDiv = document.createElement("div");
      const tempCustomerDiv = document.createElement("div");

      // Render pharmacy copy
      tempPharmacyDiv.innerHTML = generateInvoiceHTML("pharmacy");
      // Render customer copy
      tempCustomerDiv.innerHTML = generateInvoiceHTML("customer");

      // Inject into print window
      const pharmacyCopyContainer =
        printWindow.document.getElementById("pharmacy-copy");
      const customerCopyContainer =
        printWindow.document.getElementById("customer-copy");

      if (pharmacyCopyContainer && customerCopyContainer) {
        pharmacyCopyContainer.innerHTML = tempPharmacyDiv.innerHTML;
        customerCopyContainer.innerHTML = tempCustomerDiv.innerHTML;

        // Auto print after short delay
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    };
  };

  const generateInvoiceHTML = (copyType: "pharmacy" | "customer") => {
    const items = createdOrderData.items
      .map(
        (item: any, index: number) => `
      <tr>
        <td style="color: #6b7280;">${index + 1}</td>
        <td style="font-weight: 500; color: #111827;">${item.medicine_name}</td>
        <td style="text-align: center; color: #374151;">${item.quantity}</td>
        <td style="text-align: center; color: #6b7280;">${
          item.expiry_date
            ? new Date(item.expiry_date).toLocaleDateString("en-GB")
            : "N/A"
        }</td>
        <td style="text-align: right; color: #374151;">₹${item.mrp.toFixed(
          2
        )}</td>
        <td style="text-align: right; font-weight: 500; color: #111827;">₹${(
          item.quantity * item.mrp
        ).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const subtotal = createdOrderData.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.mrp,
      0
    );
    const discount = parseFloat(createdOrderData.totals.discountAmount);
    const total = subtotal - discount;

    return `
      <div style="max-width: 93%; margin: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; position: relative;">

        <!-- Corner Copy Indicator -->
        <div class="corner-indicator">
          ${copyType === "pharmacy" ? "PHARMACY" : "CUSTOMER"} COPY
        </div>

        <!-- Header -->
        <div class="gradient-header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <h1 style="font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #111827; margin: 0;">SWAMI MEDICO</h1>
              <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">Your Health, Our Priority</p>
              <div style="margin-top: 12px; font-size: 11px; color: #6b7280; line-height: 1.4;">
                <p style="margin: 2px 0; display: flex; align-items: center;">
                  <i class="fas fa-map-marker-alt" style="width: 12px; margin-right: 8px;"></i>
                  123 Health Street, Medical District
                </p>
                <p style="margin: 2px 0; display: flex; align-items: center;">
                  <i class="fas fa-phone" style="width: 12px; margin-right: 8px;"></i>
                  City - 123456 | +91 98765 43210
                </p>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-box">
                <p style="font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Invoice</p>
                <p style="font-weight: bold; color: #111827; margin: 4px 0 0 0;">${
                  createdOrderData.orderNumber
                }</p>
              </div>
              <p style="font-size: 11px; color: #6b7280; margin: 8px 0 0 0;">${new Date().toLocaleDateString(
                "en-IN",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</p>
            </div>
          </div>

          <div class="license-grid">
            <div style="font-size: 11px;">
              <p style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">DL Number</p>
              <p style="font-weight: 500; color: #374151; margin: 2px 0 0 0;">DL-MH-20-12345</p>
            </div>
            <div style="font-size: 11px;">
              <p style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">GST Number</p>
              <p style="font-weight: 500; color: #374151; margin: 2px 0 0 0;">27ABCDE1234F1Z5</p>
            </div>
            <div style="font-size: 11px;">
              <p style="color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">FSSAI</p>
              <p style="font-weight: 500; color: #374151; margin: 2px 0 0 0;">12345678901234</p>
            </div>
          </div>
        </div>

        <!-- Customer Details -->
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
            <div>
              <p style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 0 0 8px 0;">Bill To</p>
              <div>
                <p style="font-weight: 500; color: #111827; margin: 4px 0;">${
                  createdOrderData.customer.name
                }</p>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.4; margin: 4px 0;">${
                  createdOrderData.customer.address || "Address not provided"
                }</p>
              </div>
            </div>
            <div>
              <p style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 0 0 8px 0;">Contact</p>
              <div>
                <p style="font-size: 14px; color: #374151; margin: 4px 0; display: flex; align-items: center;">
                  <i class="fas fa-phone" style="width: 16px; margin-right: 8px;"></i>
                  ${createdOrderData.customer.phone || "Not provided"}
                </p>
                ${
                  createdOrderData.customer.email
                    ? `
                  <p style="font-size: 14px; color: #6b7280; margin: 4px 0; display: flex; align-items: center;">
                    <i class="fas fa-envelope" style="width: 16px; margin-right: 8px;"></i>
                    ${createdOrderData.customer.email}
                  </p>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Items Section -->
        <div style="padding: 16px 24px;">
          <div style="margin-bottom: 12px; display: flex; align-items: center;">
            <i class="fas fa-pills" style="width: 16px; color: #374151; margin-right: 8px;"></i>
            <h3 style="font-size: 14px; font-weight: 500; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Medical Items</h3>
          </div>

          <table class="modern-table">
            <thead>
              <tr>
                <th style="text-align: left;">#</th>
                <th style="text-align: left;">Item Name</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: center;">Exp Date</th>
                <th style="text-align: right;">MRP</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody style="background: white;">
              ${items}
            </tbody>
          </table>
        </div>

        <!-- Totals Section -->
        <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="font-size: 11px; color: #6b7280; max-width: 300px;">
              <p style="display: flex; align-items: center; margin: 0 0 4px 0;">
                <i class="fas fa-heart" style="width: 12px; margin-right: 8px;"></i>
                Thank you for choosing MediCare Pharmacy!
              </p>
              <p style="color: #6b7280; margin: 0;">
                Terms: Medicines are not returnable. Please check expiry dates before use.
              </p>
            </div>

            <div class="totals-box">
              <div style="font-size: 14px; line-height: 1.5;">
                <div style="display: flex; justify-content: space-between; color: #6b7280; margin-bottom: 8px;">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                ${
                  discount > 0
                    ? `
                  <div style="display: flex; justify-content: space-between; color: #059669; margin-bottom: 8px;">
                    <span>Discount:</span>
                    <span>-₹${discount.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  <div style="display: flex; justify-content: space-between; font-weight: bold; color: #111827;">
                    <span>TOTAL:</span>
                    <span>₹${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 12px 24px; background: #f3f4f6; text-align: center;">
          <p style="font-size: 11px; color: #6b7280; margin: 0; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-laptop" style="width: 12px; margin-right: 4px;"></i>
            Computer generated invoice. No signature required.
            <span style="margin: 0 8px;">•</span>
            <i class="fas fa-phone" style="width: 12px; margin: 0 4px;"></i>
            For queries: +91 98765 43210
          </p>
        </div>
      </div>
    `;
  };

  const createOrder = async () => {
    if (!customerInfo.name.trim()) {
      setError("Please select a patient or enter customer information");
      return;
    }

    if (orderItems.length === 0) {
      setError("Please add at least one medicine to the order");
      return;
    }

    try {
      setError(null);
      const totals = calculateTotals();

      // Get current user info for created_by field
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Generate order number
      const orderNumber = `SO-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 999) + 1
      ).padStart(3, "0")}`;

      // Create sell order
      const sellOrder = {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_contact: customerInfo.phone || "N/A",
        customer_address: customerInfo.address || "N/A",
        customer_email: customerInfo.email || null,
        patient_id:
          customerInfo.type === "registered" ? customerInfo.patient_id : null,
        sale_date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
        subtotal: parseFloat(totals.subtotal),
        discount_amount: parseFloat(totals.discountAmount),
        total_amount: parseFloat(totals.grandTotal),
        payment_method: paymentMethod,
        payment_status: "pending", // Explicit payment status
        notes: notes || null,
        status: "pending",
        created_by: user?.id || null, // Current user for tracking
      };

      console.log("Creating sell order:", sellOrder);

      const { data: createdOrder, error: orderError } = await supabase
        .from("sell_orders")
        .insert([sellOrder])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating sell order:", orderError);
        throw orderError;
      }

      console.log("Sell order created successfully:", createdOrder);

      // Create sell order items
      const sellOrderItems = orderItems.map((item) => ({
        sell_order_id: createdOrder.id,
        medicine_name: item.medicine.name,
        salt_content:
          item.medicine.generic_name || item.medicine.strength || "N/A",
        company_name: item.medicine.manufacturer || "Unknown",
        unit_category: item.medicine.unit_category || "SINGLE_UNIT", // Required field
        sale_unit: item.medicine.sale_unit || "piece", // Required field
        quantity: item.quantity,
        mrp: item.mrp,
        batch_number: item.medicine.batch_number || null,
        expiry_date: item.medicine.expiry_date || null,
        scheme_offer: "No offer",
        total_price: parseFloat(item.total.toFixed(2)),
        prescription_id: null, // Optional field for prescription tracking
      }));

      console.log("Creating sell order items:", sellOrderItems.length, "items");

      const { error: itemsError } = await supabase
        .from("sell_order_items")
        .insert(sellOrderItems);

      if (itemsError) {
        console.error("Error creating sell order items:", itemsError);
        throw itemsError;
      }

      console.log("Sell order items created successfully");

      setSuccess(
        `Sell order ${orderNumber} created successfully for ${customerInfo.name}! Total: ₹${totals.grandTotal}`
      );

      // Store order data for invoice
      setCreatedOrderData({
        order: createdOrder,
        items: sellOrderItems,
        customer: customerInfo,
        totals: totals,
        orderNumber: orderNumber,
      });

      // Show invoice dialog
      setShowInvoice(true);
    } catch (error) {
      console.error("Error creating sell order:", error);
      setError("Failed to create sell order: " + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/pharmacy/sell-orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Sell Order
          </h1>
          <p className="text-muted-foreground">
            Add medicines and create a new customer order
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Information & Medicine Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={
                    customerInfo.type === "registered" ? "default" : "outline"
                  }
                  onClick={() =>
                    setCustomerInfo((prev) => ({ ...prev, type: "registered" }))
                  }
                >
                  Registered Patient
                </Button>
                <Button
                  variant={customerInfo.type === "new" ? "default" : "outline"}
                  onClick={() =>
                    setCustomerInfo((prev) => ({ ...prev, type: "new" }))
                  }
                >
                  New Customer
                </Button>
              </div>

              {customerInfo.type === "registered" ? (
                <div className="relative">
                  <Input
                    placeholder="Search registered patients..."
                    value={searchPatient}
                    onChange={(e) => {
                      setSearchPatient(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                  />
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredPatients.slice(0, 10).map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                          onClick={() => selectPatient(patient)}
                        >
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-gray-600">
                            {patient.phone} • {patient.email || "No email"}
                          </div>
                          {patient.address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {patient.address}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Customer Name *
                    </label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Customer phone number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Customer email (optional)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Customer address"
                    />
                  </div>
                </div>
              )}

              {customerInfo.name && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-medium text-green-800">
                    {customerInfo.name}
                  </div>
                  <div className="text-sm text-green-600">
                    {customerInfo.phone} • {customerInfo.email}
                  </div>
                  {customerInfo.address && (
                    <div className="text-xs text-green-600 mt-1">
                      {customerInfo.address}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicine Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Add Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search medicines by name, generic name, or brand..."
                  value={searchMedicine}
                  onChange={(e) => {
                    setSearchMedicine(e.target.value);
                    setShowMedicineDropdown(true);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                  className="pl-10"
                />
                {showMedicineDropdown && filteredMedicines.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredMedicines.slice(0, 10).map((medicine) => (
                      <div
                        key={medicine.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => selectMedicine(medicine)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-gray-600">
                              {medicine.generic_name &&
                                `${medicine.generic_name} • `}
                              {medicine.strength && `${medicine.strength} • `}
                              {medicine.dosage_form}
                            </div>
                            <div className="text-xs text-gray-500">
                              {medicine.manufacturer} • Stock:{" "}
                              {medicine.stock_quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ₹{medicine.mrp.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              MRP per unit
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div
                      key={item.medicine.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {item.medicine.name}
                            </h4>
                            <Badge variant="outline">
                              {item.medicine.manufacturer}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.medicine.generic_name &&
                              `${item.medicine.generic_name} • `}
                            {item.medicine.strength &&
                              `${item.medicine.strength} • `}
                            {item.medicine.dosage_form}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Stock Available: {item.medicine.stock_quantity}{" "}
                            units
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(index, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(index, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >= item.medicine.stock_quantity
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Price Info */}
                          <div className="text-right min-w-[100px]">
                            <div className="font-medium">
                              ₹{item.total.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} × ₹{item.mrp.toFixed(2)}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Billing Summary */}
        <div className="lg:col-span-1">
          {orderItems.length > 0 && (
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="online">Online Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Discount (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Order notes or special instructions"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>-₹{totals.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Grand Total:</span>
                      <span>₹{totals.grandTotal}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={createOrder}
                      disabled={!customerInfo.name || orderItems.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Create Sell Order
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/pharmacy/sell-orders")}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Preview
            </DialogTitle>
          </DialogHeader>

          {createdOrderData && (
            <div className="space-y-4">
              {/* Invoice Actions */}
              <div className="flex justify-between items-center print:hidden">
                <div className="text-sm text-gray-600">
                  Order #{createdOrderData.orderNumber} created successfully
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Both Copies
                  </Button>
                  <Button
                    onClick={() => {
                      setShowInvoice(false);
                      router.push("/pharmacy/sell-orders");
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>

              {/* Print-only Invoice - Single Copy */}
              <div className="print:block hidden">
                <CompactPharmacyInvoice
                  invoiceNumber={createdOrderData.orderNumber}
                  date={new Date().toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  customerDetails={{
                    name: createdOrderData.customer.name,
                    address:
                      createdOrderData.customer.address || "Not provided",
                    phone: createdOrderData.customer.phone || "Not provided",
                    email: createdOrderData.customer.email || undefined,
                  }}
                  items={createdOrderData.items.map((item: any) => ({
                    id: item.sell_order_id + "-" + item.medicine_name,
                    name: item.medicine_name,
                    quantity: item.quantity,
                    expiryDate: item.expiry_date
                      ? new Date(item.expiry_date).toLocaleDateString("en-GB")
                      : "N/A",
                    mrp: item.mrp,
                  }))}
                  copyType="pharmacy"
                  discount={parseFloat(createdOrderData.totals.discountAmount)}
                />
              </div>

              {/* Screen-only Preview - Both Copies */}
              <div className="print:hidden space-y-6">
                {/* Pharmacy Copy */}
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">
                      Pharmacy Copy
                    </h3>
                  </div>
                  <CompactPharmacyInvoice
                    invoiceNumber={createdOrderData.orderNumber}
                    date={new Date().toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    customerDetails={{
                      name: createdOrderData.customer.name,
                      address:
                        createdOrderData.customer.address || "Not provided",
                      phone: createdOrderData.customer.phone || "Not provided",
                      email: createdOrderData.customer.email || undefined,
                    }}
                    items={createdOrderData.items.map((item: any) => ({
                      id: item.sell_order_id + "-" + item.medicine_name,
                      name: item.medicine_name,
                      quantity: item.quantity,
                      expiryDate: item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString("en-GB")
                        : "N/A",
                      mrp: item.mrp,
                    }))}
                    copyType="pharmacy"
                    discount={parseFloat(
                      createdOrderData.totals.discountAmount
                    )}
                  />
                </div>

                {/* Customer Copy */}
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">
                      Customer Copy
                    </h3>
                  </div>
                  <CompactPharmacyInvoice
                    invoiceNumber={createdOrderData.orderNumber}
                    date={new Date().toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    customerDetails={{
                      name: createdOrderData.customer.name,
                      address:
                        createdOrderData.customer.address || "Not provided",
                      phone: createdOrderData.customer.phone || "Not provided",
                      email: createdOrderData.customer.email || undefined,
                    }}
                    items={createdOrderData.items.map((item: any) => ({
                      id: item.sell_order_id + "-" + item.medicine_name,
                      name: item.medicine_name,
                      quantity: item.quantity,
                      expiryDate: item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString("en-GB")
                        : "N/A",
                      mrp: item.mrp,
                    }))}
                    copyType="customer"
                    discount={parseFloat(
                      createdOrderData.totals.discountAmount
                    )}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
