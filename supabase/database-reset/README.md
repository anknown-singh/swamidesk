# SwamIDesk Database Reset Scripts

This folder contains all the necessary SQL scripts to completely reset and re-establish the SwamIDesk database from scratch.

## 📁 **Files Overview**

### 🎯 **Main Reset Script**
- **`COMPLETE_DATABASE_RESET_FULL.sql`** - The primary script that completely resets the database
  - Drops all existing tables, types, and functions
  - Creates all necessary database structures
  - Populates with essential sample data
  - **Usage**: Run this single file for complete database reset

### 🔧 **Component Scripts** (Run after main reset for complete data)
- **`insert-suppliers.sql`** - Comprehensive supplier database (25+ suppliers)
- **`insert-users-only.sql`** - Complete user and user profile data  
- **`medicine_master_1000plus.sql`** - Comprehensive medicine database (85+ medicines)
- **`create-all-tables.sql`** - Complete table structure definitions

## 🚀 **Quick Start Guide**

### **Option 1: Complete Reset (Recommended)**
```bash
# Run the main reset script
psql -d your_database -f COMPLETE_DATABASE_RESET_FULL.sql

# Then optionally add comprehensive data
psql -d your_database -f insert-suppliers.sql
psql -d your_database -f medicine_master_1000plus.sql
```

### **Option 2: Step by Step**
```bash
# 1. Create all tables
psql -d your_database -f create-all-tables.sql

# 2. Add users and profiles
psql -d your_database -f insert-users-only.sql

# 3. Add suppliers
psql -d your_database -f insert-suppliers.sql

# 4. Add medicines
psql -d your_database -f medicine_master_1000plus.sql
```

## 📊 **What Gets Installed**

### **Database Structure**
- ✅ All 29+ tables with proper relationships
- ✅ Custom types and enums
- ✅ Essential functions and triggers
- ✅ Performance indexes
- ✅ Proper constraints and validations

### **Sample Data**
- ✅ **Users**: Admin, 7 Doctors, 2 Receptionists, 2 Pharmacists, 2 Nurses
- ✅ **User Profiles**: Complete doctor profiles with specializations
- ✅ **Suppliers**: 5 basic suppliers (25+ with insert-suppliers.sql)
- ✅ **Medicines**: 10 sample medicines (85+ with medicine_master_1000plus.sql)

## ⚠️ **Important Notes**

- **These scripts will DROP all existing data** - Use with caution
- **Run on empty/truncated databases** for best results  
- **Backup existing data** before running reset scripts
- **Scripts are idempotent** - Safe to run multiple times

## 🎯 **Use Cases**

- **Development Setup**: Fresh database for development
- **Testing Environment**: Clean state for testing
- **Demo Environment**: Full featured demo with sample data
- **Production Recovery**: Restore after major issues (with proper backups)

## 📋 **Prerequisites**

- PostgreSQL database with proper permissions
- `psql` command line tool available
- Database user with CREATE/DROP permissions

## 🔍 **Troubleshooting**

If you encounter issues:

1. **Check permissions**: Ensure database user has CREATE/DROP rights
2. **Check connections**: Verify database connection settings
3. **Check logs**: Review PostgreSQL logs for detailed error messages
4. **Run individually**: Try running component scripts separately

## 📞 **Support**

For issues with these scripts:
- Check the main SwamIDesk documentation
- Review error messages carefully
- Test on development database first