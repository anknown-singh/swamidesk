# SwamIDesk Database Reset Scripts

This folder contains all the necessary SQL scripts to completely reset and re-establish the SwamIDesk database from scratch.

## 📁 **Files Overview**

### 🎯 **Main Database Setup**
- **`create-all-tables.sql`** - Complete table structure definitions (42 tables)
  - Creates all necessary database tables with proper relationships
  - Includes consultation system, pharmacy, appointments, and audit tables
  - Includes essential functions and triggers
  - **Usage**: Primary script for setting up complete database structure

### 👥 **User Data**
- **`insert-users-only.sql`** - Complete user and user profile data  
  - Admin, doctors, receptionists, pharmacists, nurses
  - Complete user profiles with specializations
  - Essential for system authentication and role management

### 🏢 **Supplier Data**
- **`insert-suppliers.sql`** - Comprehensive supplier database (25+ suppliers)
  - Medical supply companies with contact information
  - Essential for purchase order management
  - Includes GST numbers and addresses

### 🏥 **Medicine Database**
- **`medicine_master_corrected.sql`** - Essential medicine database (20 medicines)
  - Properly formatted for current medicine_master table schema
  - Contains essential medicines across all therapeutic categories
  - Ready-to-use with correct column structure and array formats

### 🔧 **Alternative Options**
- **`SIMPLE_DATABASE_RESET.sql`** - Minimal pharmacy-focused setup
  - Creates only core tables needed for pharmacy functionality
  - Includes aggressive cleanup and robust error handling
  - Use if full reset causes issues

## 🚀 **Quick Start Guide**

### **Option 1: Complete Setup (Recommended)**
```sql
-- In Supabase SQL Editor or psql:
-- 1. Create all database tables
\i create-all-tables.sql

-- 2. Add users and profiles
\i insert-users-only.sql

-- 3. Add suppliers
\i insert-suppliers.sql

-- 4. Populate with essential medicines
\i medicine_master_corrected.sql
```

### **Option 2: Minimal Pharmacy Setup**
```sql
-- If you encounter issues with the full setup:
\i SIMPLE_DATABASE_RESET.sql
\i medicine_master_corrected.sql
```

### **Option 3: Supabase Dashboard**
1. Go to your Supabase project → SQL Editor
2. Copy and paste the content of `create-all-tables.sql` and run
3. Copy and paste `insert-users-only.sql` and run
4. Copy and paste `insert-suppliers.sql` and run  
5. Copy and paste `medicine_master_corrected.sql` and run

## 📊 **What Gets Installed**

### **Database Structure**
- ✅ All 42 tables with proper relationships
- ✅ Custom types and enums (appointment_status, user_role, etc.)
- ✅ Essential functions and triggers (order number generation, timestamps)
- ✅ Performance indexes and constraints
- ✅ Complete consultation workflow system
- ✅ Pharmacy management system
- ✅ Audit logging and workflow management

### **Sample Data**
- ✅ **Users**: Admin, 7 Doctors, 2 Receptionists, 2 Pharmacists, 2 Nurses
- ✅ **User Profiles**: Complete doctor profiles with specializations
- ✅ **Suppliers**: 25+ comprehensive supplier database with contact details
- ✅ **Medicines**: 20 essential medicines across therapeutic categories

## ⚠️ **Important Notes**

- **create-all-tables.sql is safe** - Only creates tables, doesn't drop existing data
- **Use Supabase SQL Editor** for best compatibility
- **Run scripts in order** - Users → Suppliers → Medicines
- **Scripts are tested** - All schema mismatches resolved

## 🎯 **Use Cases**

- **Development Setup**: Fresh database for development
- **Testing Environment**: Clean state for testing  
- **Demo Environment**: Full featured demo with sample data
- **New Project Setup**: Complete database setup from scratch

## 📋 **Prerequisites**

- Supabase project or PostgreSQL database
- Database access with CREATE permissions
- No special extensions required (uuid-ossp auto-created)

## 🔍 **Troubleshooting**

If you encounter issues:

1. **Schema errors**: Use create-all-tables.sql first to ensure proper table structure
2. **Column not found**: Check if you're using the correct file versions
3. **Permission errors**: Ensure your user has CREATE/INSERT permissions
4. **Array syntax errors**: Make sure you're using PostgreSQL-compatible database

## 📞 **Current Status**

✅ **Ready for production use**
- All schema mismatches resolved
- Pharmacy system fully functional
- Purchase orders working correctly
- Medicine management operational