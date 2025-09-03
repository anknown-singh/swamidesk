# SwamIDesk Database Tables - Complete List

This document contains the comprehensive list of all database tables for the SwamIDesk clinic management system.

## Overview
- **Total Tables**: 29
- **Database Type**: PostgreSQL with Supabase
- **Primary Keys**: UUID (gen_random_uuid())
- **Security**: Row Level Security (RLS) enabled
- **Timestamps**: All tables include created_at/updated_at

---

## Core System Tables (9 tables)

### 1. **users**
- User accounts and authentication
- Roles: admin, doctor, receptionist, pharmacist, nurse
- Authentication via Supabase Auth

### 2. **user_profiles** 
- Extended user profile information
- Professional details, specializations, contact info

### 3. **patients**
- Patient demographic and contact information
- Medical history, emergency contacts
- Links to all patient-related records

### 4. **visits**
- Patient visits and consultations
- Chief complaints, diagnoses, visit status
- Links patients to doctors and services

### 5. **services**
- Medical services and procedures catalog
- Pricing, categories, duration estimates
- Used across appointments and billing

### 6. **invoices**
- Billing and payment records
- Financial transactions, payment status
- Links to visits and services

### 7. **prescriptions**
- Medicine prescriptions from doctors
- Dosage, duration, instructions
- Links to visits and medicines

### 8. **treatment_plans**
- Long-term treatment planning
- Progress tracking, session management
- Multi-visit treatment protocols

### 9. **migration_log**
- Database migration tracking
- Applied migrations, timestamps
- System maintenance history

---

## Medicine & Pharmacy Tables (8 tables)

### 10. **medicines**
- **Purpose**: Pharmacy inventory (stock management)
- Current stock levels, pricing, suppliers
- Real-time inventory tracking

### 11. **medicine_master**
- **Purpose**: Comprehensive medicine information database
- Generic names, brand names, therapeutic classes
- Drug interactions, contraindications, dosage forms
- **Note**: Separate from inventory - reference data only

### 12. **pharmacy_issues**
- Medicine dispensing queue
- Prescription fulfillment tracking
- Batch numbers, expiry dates

### 13. **purchase_orders**
- Supplier purchase orders
- Order status, delivery tracking
- Financial totals with GST calculations

### 14. **purchase_order_items**
- Individual items in purchase orders
- Medicine details, quantities, pricing
- Batch tracking, scheme offers

### 15. **sell_orders**
- Customer sales orders
- Patient prescriptions, over-counter sales
- Payment methods, delivery status

### 16. **sell_order_items**
- Individual items in sell orders
- Medicine dispensed, quantities, pricing
- Prescription linkage

### 17. **inventory**
- General inventory management
- Stock movements, adjustments
- Low stock alerts

---

## Appointment System Tables (6 tables)

### 18. **appointments**
- **Main appointment records**
- Patient-doctor scheduling
- Status workflow: scheduled → confirmed → completed
- Appointment numbers: APT+YYYYMMDD+0001

### 19. **doctor_availability**
- **Weekly availability patterns**
- Working hours, break times
- Maximum appointments per slot
- Recurring schedule management

### 20. **appointment_slots**
- **Specific time slot overrides**
- Custom availability changes
- Holiday schedules, emergency slots
- Capacity management

### 21. **appointment_services**
- **Services linked to appointments**
- Procedures planned for visits
- Duration estimates, pricing
- Service assignment tracking

### 22. **appointment_reminders**
- **Automated reminder system**
- SMS, email, WhatsApp notifications
- Scheduled delivery, retry logic
- Reminder status tracking

### 23. **appointment_waitlist**
- **Patient waiting list**
- Preference-based matching
- Priority queue management
- Automatic slot notifications

---

## Clinical Management Tables (3 tables)

### 24. **visit_services**
- Services provided during visits
- Actual procedures performed
- Service completion status
- Links visits to services catalog

### 25. **opd_records**
- OPD (Outpatient Department) records
- Clinical notes, examination findings
- Procedure quotes, admin review status
- Workflow: consultation → procedures → pharmacy

### 26. **notifications**
- System notifications
- User alerts, status updates
- Real-time messaging system
- Role-based notifications

---

## Supporting Tables (3 tables)

### 27. **suppliers**
- Medicine supplier information
- Contact details, terms
- Purchase order relationships

### 28. **billing_items**
- Detailed billing line items
- Service breakdowns, tax calculations
- Invoice component tracking

### 29. **payments**
- Payment transaction records
- Multiple payment methods
- Transaction status, reconciliation

---

## Migration Files Reference

| Migration File | Tables Created | Purpose |
|---|---|---|
| `20250804000001_initial_schema.sql` | 9 tables | Core system foundation |
| `20250806000001_appointments_schema.sql` | 6 tables | Complete appointment system |
| `20250809000001_create_purchase_orders_table.sql` | 2 tables | Purchase order management |
| `20250809000002_create_sell_orders_table.sql` | 2 tables | Sales order management |
| `20250807000003_final_database_fixes.sql` | 0 tables | RLS and permission fixes |
| `create-medicine-master-table.sql` | 1 table | Medicine information database |

---

## Key Features by Table Category

### **Patient Management**
- Complete patient lifecycle tracking
- Visit history and medical records
- Treatment plan progression

### **Appointment System**
- Complex scheduling with availability patterns
- Conflict detection and resolution
- Automated reminders and waitlist management

### **Pharmacy Operations**
- Dual medicine tables: inventory vs. information
- Complete purchase-to-sale workflow
- GST calculations and batch tracking

### **Clinical Workflow**
- Visit-based service delivery
- Prescription to pharmacy integration
- Multi-stage approval processes

### **Financial Management**
- Comprehensive billing and invoicing
- Multiple payment method support
- Detailed financial reporting capability

---

## Database Relationships

### **Core Relationships**
- `patients` → `visits` → `prescriptions` → `medicines`
- `users` → `appointments` → `patients`
- `visits` → `visit_services` → `services`

### **Pharmacy Workflow**
- `medicines` (inventory) ← `purchase_orders` ← `suppliers`
- `prescriptions` → `pharmacy_issues` → `sell_orders`
- `medicine_master` (reference) ← used by → `medicines` (inventory)

### **Appointment Flow**
- `doctor_availability` → `appointment_slots` → `appointments`
- `appointments` → `appointment_services` → `services`
- `appointment_waitlist` → `appointments` (when available)

---

*Generated on: 2025-08-30*
*SwamIDesk Clinic Management System*