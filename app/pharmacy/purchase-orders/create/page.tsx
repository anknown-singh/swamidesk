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
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Building2,
  Pill,
  Calculator,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
  Package,
  Truck,
} from "lucide-react";

interface Supplier {
  id?: string;
  name: string;
  contact: string;
  address: string;
  gst_number?: string;
}

interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  brand_names: string[] | null;
  category: string | null;
  subcategory: string | null;
  therapeutic_class: string | null;
  dosage_forms: string[] | null;
  strengths: string[] | null;
  standard_dosage_adult: string | null;
  standard_dosage_pediatric: string | null;
  routes: string[] | null;
  indications: string[] | null;
  contraindications: string[] | null;
  side_effects: string[] | null;
  interactions: string[] | null;
  pregnancy_category: string | null;
  controlled_substance: boolean;
  prescription_required: boolean;
  is_active: boolean;
}

interface PurchaseOrderItem {
  medicine_name: string;
  salt_content: string;
  company_name: string;
  quantity: number;
  unit_price: number;
  batch_number: string;
  expiry_date: string;
  scheme_offer: string;
  gst_percentage: number;
  gst_amount: number;
  total_price: number;
}

interface SupplierInfo {
  type: "existing" | "new";
  supplier_id?: string | undefined;
  name: string;
  contact: string;
  address: string;
  gst_number: string;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchMedicine, setSearchMedicine] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [showGstDropdown, setShowGstDropdown] = useState<number | null>(null);
  const [showPaymentTermsDropdown, setShowPaymentTermsDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Supplier Information
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    type: "existing",
    name: "",
    contact: "",
    address: "",
    gst_number: "",
  });

  // Order Items
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);

  // Order Details
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30_days");
  const [supplierDiscount, setSupplierDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch real suppliers from database
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Handle suppliers data with fallback
      let suppliersToUse: Supplier[] = [];
      if (suppliersError) {
        console.warn("Error fetching suppliers, using fallback data:", suppliersError);
        // Fallback to mock data if suppliers table doesn't exist or has issues
        suppliersToUse = [
          {
            id: "sup-1",
            name: "MediCorp Pharmaceuticals",
            contact: "+91 9876543210",
            address: "123 Pharma Complex, Mumbai, Maharashtra 400001",
            gst_number: "27AABCU9603R1ZX",
          },
          {
            id: "sup-2",
            name: "HealthCare Supplies Ltd",
            contact: "+91 8765432109",
            address: "456 Medical Plaza, Delhi, Delhi 110001",
            gst_number: "07AAGFF2194N1Z1",
          },
          {
            id: "sup-3",
            name: "BioMed Distribution",
            contact: "+91 7654321098",
            address: "789 Healthcare Center, Bangalore, Karnataka 560001",
            gst_number: "29AAPFB4943Q1Z0",
          },
        ];
      } else {
        suppliersToUse = suppliersData || [];
        // If no suppliers in database, add some default ones
        if (suppliersToUse.length === 0) {
          console.log("No suppliers found in database, using default suppliers");
          suppliersToUse = [
            {
              id: "sup-1",
              name: "MediCorp Pharmaceuticals",
              contact: "+91 9876543210",
              address: "123 Pharma Complex, Mumbai, Maharashtra 400001",
              gst_number: "27AABCU9603R1ZX",
            },
            {
              id: "sup-2",
              name: "HealthCare Supplies Ltd",
              contact: "+91 8765432109",
              address: "456 Medical Plaza, Delhi, Delhi 110001",
              gst_number: "07AAGFF2194N1Z1",
            },
            {
              id: "sup-3",
              name: "BioMed Distribution",
              contact: "+91 7654321098",
              address: "789 Healthcare Center, Bangalore, Karnataka 560001",
              gst_number: "29AAPFB4943Q1Z0",
            },
          ];
        }
      }

      // Fetch active medicines from medicine_master
      const { data: medicinesData, error: medicinesError } = await supabase
        .from("medicine_master")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (medicinesError) throw medicinesError;

      setSuppliers(suppliersToUse);
      setMedicines(medicinesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const selectSupplier = (supplier: Supplier) => {
    setSupplierInfo({
      type: "existing",
      supplier_id: supplier.id,
      name: supplier.name,
      contact: supplier.contact,
      address: supplier.address,
      gst_number: supplier.gst_number || "",
    });
    setSearchSupplier(supplier.name);
    setShowSupplierDropdown(false);
  };

  const addMedicineItem = () => {
    const newItem: PurchaseOrderItem = {
      medicine_name: "",
      salt_content: "",
      company_name: "",
      quantity: 1,
      unit_price: 0,
      batch_number: "",
      expiry_date: "",
      scheme_offer: "",
      gst_percentage: 18,
      gst_amount: 0,
      total_price: 0,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  const updateOrderItem = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: any
  ) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate totals when quantity, unit_price, or gst_percentage changes
          if (
            field === "quantity" ||
            field === "unit_price" ||
            field === "gst_percentage"
          ) {
            const subtotal = updatedItem.quantity * updatedItem.unit_price;
            const gstAmount = (subtotal * updatedItem.gst_percentage) / 100;
            updatedItem.gst_amount = parseFloat(gstAmount.toFixed(2));
            updatedItem.total_price = parseFloat(
              (subtotal + gstAmount).toFixed(2)
            );
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const selectMedicineForItem = (medicine: Medicine, index: number) => {
    // Use default wholesale price since medicine_master doesn't have unit_price
    const wholesalePrice = 100; // Default wholesale price
    updateOrderItem(index, "medicine_name", medicine.name);
    updateOrderItem(
      index,
      "salt_content",
      medicine.generic_name || medicine.strengths?.[0] || ""
    );
    updateOrderItem(index, "company_name", "Generic Manufacturer"); // medicine_master doesn't have manufacturer
    updateOrderItem(index, "unit_price", parseFloat(wholesalePrice.toFixed(2)));

    setSearchMedicine("");
    setShowMedicineDropdown(false);
  };


  const calculateOrderTotals = () => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const gstAmount = orderItems.reduce(
      (sum, item) => sum + item.gst_amount,
      0
    );
    const discountAmount = (subtotal * supplierDiscount) / 100;
    const grandTotal = subtotal + gstAmount - discountAmount;

    return {
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      (supplier.contact && supplier.contact.includes(searchSupplier))
  );

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.generic_name.toLowerCase().includes(searchMedicine.toLowerCase()) ||
      medicine.name.toLowerCase().includes(searchMedicine.toLowerCase()) ||
      medicine.generic_name
        ?.toLowerCase()
        .includes(searchMedicine.toLowerCase()) ||
      medicine.brand_names?.some((brand) =>
        brand.toLowerCase().includes(searchMedicine.toLowerCase())
      )
  );

  const createPurchaseOrder = async () => {
    if (!supplierInfo.name.trim()) {
      setError("Please select a supplier or enter supplier information");
      return;
    }

    if (orderItems.length === 0) {
      setError("Please add at least one medicine to the purchase order");
      return;
    }

    // Validate all items have required fields
    const invalidItems = orderItems.filter(
      (item) =>
        !item.medicine_name.trim() ||
        !item.company_name.trim() ||
        item.quantity <= 0 ||
        item.unit_price <= 0
    );

    if (invalidItems.length > 0) {
      setError(
        "Please fill in all required fields for all items (medicine name, company, quantity, price)"
      );
      return;
    }

    try {
      setError(null);
      const totals = calculateOrderTotals();

      // Ensure supplier name is not empty (required field)
      if (!supplierInfo.name || !supplierInfo.name.trim()) {
        setError("Supplier name is required");
        return;
      }

      // Generate order number manually if trigger is missing
      let orderNumber;
      try {
        const { data: orderNumberData, error: orderNumberError } = await supabase
          .rpc('generate_purchase_order_number');
        
        if (orderNumberError) {
          console.warn("Order number generation function not available, using fallback");
          // Fallback: Generate order number client-side
          const year = new Date().getFullYear();
          const { data: existingOrders } = await supabase
            .from("purchase_orders")
            .select("order_number")
            .like("order_number", `PO-${year}-%`)
            .order("order_number", { ascending: false })
            .limit(1);
          
          const lastNumber = existingOrders?.[0]?.order_number;
          const nextNumber = lastNumber 
            ? parseInt(lastNumber.split('-')[2]) + 1
            : 1;
          orderNumber = `PO-${year}-${nextNumber.toString().padStart(3, '0')}`;
        } else {
          orderNumber = orderNumberData;
        }
      } catch (error) {
        console.warn("Error generating order number, using timestamp fallback");
        const timestamp = Date.now().toString().slice(-6);
        orderNumber = `PO-${new Date().getFullYear()}-${timestamp}`;
      }

      // Create purchase order header with explicit order number
      const purchaseOrderData = {
        order_number: orderNumber,
        supplier_name: supplierInfo.name.trim(),
        supplier_contact: supplierInfo.contact || null,
        supplier_address: supplierInfo.address || null,
        expected_delivery_date: expectedDeliveryDate || null,
        notes: notes || null,
        subtotal: Number(totals.subtotal) || 0,
        gst_amount: Number(totals.gstAmount) || 0,
        discount_amount: Number(totals.discountAmount) || 0,
        total_amount: Number(totals.grandTotal) || 0,
        status: "pending"
      };

      // Check if table exists by trying to select from it first
      const { error: testError } = await supabase
        .from("purchase_orders")
        .select("id")
        .limit(1);
      
      if (testError) {
        if (testError.message.includes('relation "purchase_orders" does not exist')) {
          setError("Purchase orders table doesn't exist. Please run the database setup script (setup-purchase-orders-table.sql) in your Supabase SQL editor first.");
        } else {
          setError(`Database error: ${testError.message}`);
        }
        return;
      }
      
      const { data: purchaseOrder, error: orderError } = await supabase
        .from("purchase_orders")
        .insert(purchaseOrderData)
        .select()
        .single();

      if (orderError) {
        console.error("Error creating purchase order:", orderError);
        setError(`Failed to create purchase order: ${orderError.message}`);
        return;
      }

      // Create purchase order items
      const orderItemsData = orderItems.map(item => ({
        purchase_order_id: purchaseOrder.id,
        medicine_name: item.medicine_name,
        salt_content: item.salt_content,
        company_name: item.company_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        scheme_offer: item.scheme_offer || null,
        gst_percentage: item.gst_percentage,
        gst_amount: item.gst_amount,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(orderItemsData);

      if (itemsError) {
        console.error("Error creating purchase order items:", itemsError);
        throw new Error(`Failed to create purchase order items: ${itemsError.message}`);
      }

      setSuccess(
        `Purchase order ${purchaseOrder.order_number} created successfully for ${supplierInfo.name}! Total: ₹${totals.grandTotal}`
      );

      // Reset form after successful creation
      setTimeout(() => {
        router.push("/pharmacy/purchase-orders");
      }, 2000);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      setError("Failed to create purchase order: " + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totals = calculateOrderTotals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/pharmacy/purchase-orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Purchase Order
          </h1>
          <p className="text-muted-foreground">
            Add medicines and create a new supplier order
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
        {/* Left Column - Supplier Information & Medicine Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={
                    supplierInfo.type === "existing" ? "default" : "outline"
                  }
                  onClick={() =>
                    setSupplierInfo((prev) => ({ ...prev, type: "existing" }))
                  }
                >
                  Existing Supplier
                </Button>
                <Button
                  variant={supplierInfo.type === "new" ? "default" : "outline"}
                  onClick={() =>
                    setSupplierInfo((prev) => ({ ...prev, type: "new" }))
                  }
                >
                  New Supplier
                </Button>
              </div>

              {supplierInfo.type === "existing" ? (
                <SearchableDropdown
                  options={filteredSuppliers.map(supplier => ({
                    id: supplier.id || '',
                    label: supplier.name,
                    secondaryLabel: `${supplier.contact || ""} • GST: ${supplier.gst_number}`,
                    data: supplier
                  }))}
                  searchValue={searchSupplier}
                  onSearchChange={setSearchSupplier}
                  onSelect={(option) => selectSupplier(option.data)}
                  placeholder="Search existing suppliers..."
                  maxItems={10}
                  isOpen={showSupplierDropdown}
                  onOpenChange={setShowSupplierDropdown}
                  renderOption={(option) => (
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600">
                        {option.secondaryLabel}
                      </div>
                      {option.data.address && (
                        <div className="text-xs text-gray-500 mt-1">
                          {option.data.address}
                        </div>
                      )}
                    </div>
                  )}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      Supplier Name *
                    </label>
                    <Input
                      value={supplierInfo.name}
                      onChange={(e) =>
                        setSupplierInfo((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Contact Number
                    </label>
                    <Input
                      value={supplierInfo.contact}
                      onChange={(e) =>
                        setSupplierInfo((prev) => ({
                          ...prev,
                          contact: e.target.value,
                        }))
                      }
                      placeholder="Supplier contact number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={supplierInfo.address}
                      onChange={(e) =>
                        setSupplierInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Supplier address"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">GST Number</label>
                    <Input
                      value={supplierInfo.gst_number}
                      onChange={(e) =>
                        setSupplierInfo((prev) => ({
                          ...prev,
                          gst_number: e.target.value,
                        }))
                      }
                      placeholder="GST registration number"
                    />
                  </div>
                </div>
              )}

              {supplierInfo.name && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-medium text-blue-800">
                    {supplierInfo.name}
                  </div>
                  <div className="text-sm text-blue-600">
                    {supplierInfo.contact} • GST: {supplierInfo.gst_number}
                  </div>
                  {supplierInfo.address && (
                    <div className="text-xs text-blue-600 mt-1">
                      {supplierInfo.address}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Purchase Items ({orderItems.length})
                </div>
                <Button onClick={addMedicineItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">Item #{index + 1}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Medicine Name *
                        </label>
                        <SearchableDropdown
                          options={filteredMedicines.map(medicine => ({
                            id: medicine.id || '',
                            label: medicine.name,
                            secondaryLabel: `${medicine.generic_name} • ${medicine.category || "Generic"}`,
                            data: medicine
                          }))}
                          searchValue={item.medicine_name}
                          onSearchChange={(value) => {
                            updateOrderItem(index, "medicine_name", value);
                            setSearchMedicine(value);
                          }}
                          onSelect={(option) => selectMedicineForItem(option.data, index)}
                          placeholder="Select or type medicine name"
                          maxItems={5}
                          isOpen={showMedicineDropdown && !!searchMedicine && filteredMedicines.length > 0}
                          onOpenChange={setShowMedicineDropdown}
                          renderOption={(option) => (
                            <div>
                              <div className="font-medium">
                                {option.label}
                              </div>
                              <div className="text-xs text-gray-600">
                                {option.secondaryLabel}
                              </div>
                            </div>
                          )}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Salt/Content
                        </label>
                        <Input
                          value={item.salt_content}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "salt_content",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Paracetamol 500mg"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Company Name *
                        </label>
                        <Input
                          value={item.company_name}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "company_name",
                              e.target.value
                            )
                          }
                          placeholder="Manufacturer company"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Quantity *
                        </label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Unit Price *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "unit_price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">GST %</label>
                        <SearchableDropdown
                          options={[
                            { id: '0', label: '0%', data: 0 },
                            { id: '5', label: '5%', data: 5 },
                            { id: '12', label: '12%', data: 12 },
                            { id: '18', label: '18%', data: 18 },
                            { id: '28', label: '28%', data: 28 },
                          ]}
                          searchValue={`${item.gst_percentage}%`}
                          onSearchChange={() => {}} // Read-only dropdown
                          onSelect={(option) => updateOrderItem(index, "gst_percentage", option.data)}
                          placeholder="Select GST %"
                          isOpen={showGstDropdown === index}
                          onOpenChange={(open) => setShowGstDropdown(open ? index : null)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Batch Number
                        </label>
                        <Input
                          value={item.batch_number}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "batch_number",
                              e.target.value
                            )
                          }
                          placeholder="Batch number"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Expiry Date
                        </label>
                        <Input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "expiry_date",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Scheme Offer
                        </label>
                        <Input
                          value={item.scheme_offer}
                          onChange={(e) =>
                            updateOrderItem(
                              index,
                              "scheme_offer",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Buy 10 Get 1 Free"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">
                          Subtotal: ₹
                          {(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                        <span className="ml-4 text-gray-600">
                          GST: ₹{item.gst_amount}
                        </span>
                      </div>
                      <div className="font-semibold">
                        Total: ₹{item.total_price}
                      </div>
                    </div>
                  </div>
                ))}

                {orderItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Click &quot;Add Item&quot; to start adding medicines to your purchase
                    order
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Expected Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Payment Terms</label>
                  <SearchableDropdown
                    options={[
                      { id: 'immediate', label: 'Immediate Payment', data: 'immediate' },
                      { id: '15_days', label: 'Net 15 Days', data: '15_days' },
                      { id: '30_days', label: 'Net 30 Days', data: '30_days' },
                      { id: '45_days', label: 'Net 45 Days', data: '45_days' },
                      { id: '60_days', label: 'Net 60 Days', data: '60_days' },
                      { id: '90_days', label: 'Net 90 Days', data: '90_days' },
                    ]}
                    searchValue={paymentTerms === 'immediate' ? 'Immediate Payment' : 
                      paymentTerms === '15_days' ? 'Net 15 Days' :
                      paymentTerms === '30_days' ? 'Net 30 Days' :
                      paymentTerms === '45_days' ? 'Net 45 Days' :
                      paymentTerms === '60_days' ? 'Net 60 Days' :
                      paymentTerms === '90_days' ? 'Net 90 Days' : ''}
                    onSearchChange={() => {}} // Read-only dropdown
                    onSelect={(option) => setPaymentTerms(option.data)}
                    placeholder="Select Payment Terms"
                    isOpen={showPaymentTermsDropdown}
                    onOpenChange={setShowPaymentTermsDropdown}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Supplier Discount (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={supplierDiscount}
                    onChange={(e) =>
                      setSupplierDiscount(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Order Notes</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions or notes for the supplier"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Amount:</span>
                    <span>₹{totals.gstAmount}</span>
                  </div>
                  {supplierDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Supplier Discount ({supplierDiscount}%):</span>
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
                    onClick={createPurchaseOrder}
                    disabled={!supplierInfo.name || orderItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create Purchase Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/pharmacy/purchase-orders")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
