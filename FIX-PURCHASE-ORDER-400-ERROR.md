# Fix Purchase Order 400 Error - Complete Guide

## 🚨 Problem
Purchase order creation fails with 400 error despite valid payload:
```json
{
    "supplier_name": "Animal Healthcare Ltd",
    "supplier_contact": null,
    "supplier_address": "852 Veterinary Complex, Residency Road, Bangalore, Karnataka 560025",
    "expected_delivery_date": "2025-08-30",
    "notes": null,
    "subtotal": 10000,
    "gst_amount": 1800,
    "discount_amount": 0,
    "total_amount": 11800,
    "status": "pending"
}
```

## 🔍 Root Cause
The `purchase_orders` table doesn't exist in your Supabase database.

## ✅ Solution

### Step 1: Run Database Setup Script

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Execute Setup Script**
   - Copy the contents of `setup-purchase-orders-table.sql`
   - Paste into Supabase SQL Editor
   - Click "Run" button

3. **Verify Success**
   You should see: `Purchase orders tables created successfully!`

### Step 2: Verify Tables Exist

Run this verification query in Supabase:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_orders', 'purchase_order_items');
```

Expected output:
```
purchase_orders
purchase_order_items
```

### Step 3: Test Purchase Order Creation

1. Go to `/pharmacy/purchase-orders/create`
2. Fill out the form using the SearchableDropdown components:
   - **Supplier**: Select "Animal Healthcare Ltd" (or any supplier)
   - **Medicine**: Add medicines using the dropdown with arrow key navigation
   - **GST**: Use dropdown to select GST percentage
   - **Payment Terms**: Select from dropdown

3. Click "Create Purchase Order"
4. Should now work without 400 error!

## 🎯 What Gets Created

### Tables:
- **`purchase_orders`**: Main purchase order records
- **`purchase_order_items`**: Individual medicine items per order

### Features:
- **Auto Order Numbers**: PO-2025-001, PO-2025-002, etc.
- **RLS Security**: Enabled with permissive policies
- **Proper Indexes**: For performance optimization
- **Triggers**: Auto-update timestamps and order numbers

### Sample Order Number Generation:
```sql
-- First order of 2025: PO-2025-001
-- Second order of 2025: PO-2025-002
-- First order of 2026: PO-2026-001
```

## 🚀 SearchableDropdown Features

After database setup, you'll have full functionality:

✅ **Arrow Key Navigation** (↑↓ keys)  
✅ **Auto-scrolling** to keep selected items visible  
✅ **Search filtering** for suppliers and medicines  
✅ **Enter to select**, Escape to close  
✅ **Custom rendering** with contact info and addresses  

## 🔧 Alternative: Use Complete Database Reset

If you want the full database with all tables and sample data:

```bash
# Run the complete database reset
cat supabase/database-reset/COMPLETE_DATABASE_RESET_FULL.sql
```

This includes:
- All SwamIDesk tables
- Sample users, suppliers, medicines
- Purchase orders functionality
- Complete system setup

## 📝 Troubleshooting

### If still getting 400 error:
1. Check Supabase logs for detailed error message
2. Verify RLS policies are created
3. Ensure anon key has necessary permissions
4. Check browser console for detailed error logs

### Common Issues:
- **"relation does not exist"**: Table wasn't created properly
- **RLS policy violation**: Permissions issue
- **Unique constraint**: Order number collision (shouldn't happen with auto-generation)

## 🎉 Success Indicators

When working properly:
1. No 400 errors in network tab
2. Success message appears: "Purchase order created successfully!"
3. Order gets assigned number like PO-2025-001
4. Can navigate between dropdowns with arrow keys
5. Medicine and supplier search works properly

---

**File locations:**
- Setup script: `/setup-purchase-orders-table.sql`
- Frontend page: `/app/pharmacy/purchase-orders/create/page.tsx`
- SearchableDropdown: `/components/ui/SearchableDropdown.tsx`