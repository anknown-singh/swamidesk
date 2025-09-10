# SwamIDesk Database Reset Commands

This document contains all manual commands to reset and populate your local Supabase database.

## Prerequisites

- Local Supabase running (`supabase start`)
- Docker container `supabase_db_swamidesk` should be active

## 🔧 Option 1: Complete Database Setup (Recommended)

### Copy files to container and execute them

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

# Copy all SQL files to container
docker cp supabase/database-reset/create-all-tables.sql supabase_db_swamidesk:/tmp/
docker cp supabase/database-reset/insert-users-only.sql supabase_db_swamidesk:/tmp/
docker cp supabase/database-reset/insert-suppliers.sql supabase_db_swamidesk:/tmp/
docker cp supabase/database-reset/medicine_master_corrected.sql supabase_db_swamidesk:/tmp/

# Execute them in order
docker exec supabase_db_swamidesk psql -U postgres -d postgres -f /tmp/create-all-tables.sql
docker exec supabase_db_swamidesk psql -U postgres -d postgres -f /tmp/insert-users-only.sql
docker exec supabase_db_swamidesk psql -U postgres -d postgres -f /tmp/insert-suppliers.sql
docker exec supabase_db_swamidesk psql -U postgres -d postgres -f /tmp/medicine_master_corrected.sql
```

### Alternative single-line commands

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

# Execute directly with cat
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/create-all-tables.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/insert-users-only.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/insert-suppliers.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/medicine_master_corrected.sql)"
```

### Or run them all at once

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

for file in create-all-tables.sql insert-users-only.sql insert-suppliers.sql medicine_master_corrected.sql; do
  echo "Executing $file..."
  docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/$file)"
done
```

**This complete setup will:**

1. **create-all-tables.sql** - Create all 42 tables with proper schema
2. **insert-users-only.sql** - Add sample users and profiles
3. **insert-suppliers.sql** - Add 25+ suppliers
4. **medicine_master_corrected.sql** - Add essential medicines

## 🚀 Option 2: Simple Database Reset (Minimal)

### Single command to run SIMPLE_DATABASE_RESET.sql

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

# Copy and execute the simple reset
docker cp supabase/database-reset/SIMPLE_DATABASE_RESET.sql supabase_db_swamidesk:/tmp/
docker exec supabase_db_swamidesk psql -U postgres -d postgres -f /tmp/SIMPLE_DATABASE_RESET.sql
```

### Alternative single-line command

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

# Execute directly with cat
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/SIMPLE_DATABASE_RESET.sql)"
```

### To run SIMPLE reset + essential data

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"

# 1. Run simple reset first
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/SIMPLE_DATABASE_RESET.sql)"

# 2. Then add essential data
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/create-all-tables.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/insert-suppliers.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/insert-users-only.sql)"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/medicine_master_corrected.sql)"
```

**The SIMPLE_DATABASE_RESET.sql will:**

- ✅ Drop all existing tables cleanly
- ✅ Create essential tables (users, patients, medicines, suppliers, purchase_orders)
- ✅ Set up the purchase order number generation function with proper DEFAULT
- ✅ Fix the 409 Conflict error you were experiencing

## 🎯 Specific Issue Fix: Purchase Order 409 Error

If you're specifically facing the **409 Conflict error** when creating purchase orders, run:

```bash
cd "/Users/anknown/development/swamidesk/swamidesk"
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "$(cat supabase/database-reset/SIMPLE_DATABASE_RESET.sql)"
```

This minimal reset includes the proper `generate_purchase_order_number()` function with DEFAULT constraint that resolves the order number conflict.

## 📊 Verification Commands

After running any reset, verify your setup:

```bash
# Check if tables were created
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"

# Check users count
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "SELECT 'Users:' as type, COUNT(*) as count FROM users;"

# Check suppliers count  
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "SELECT 'Suppliers:' as type, COUNT(*) as count FROM suppliers;"

# Check medicines count
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "SELECT 'Medicines:' as type, COUNT(*) as count FROM medicine_master;"

# Test purchase order number generation
docker exec supabase_db_swamidesk psql -U postgres -d postgres -c "SELECT generate_purchase_order_number() as test_order_number;"
```

## 🔍 Troubleshooting

### If container name is different

```bash
# Find your container name
docker ps | grep postgres

# Use the correct container name
docker exec [YOUR_CONTAINER_NAME] psql -U postgres -d postgres -c "$(cat supabase/database-reset/SIMPLE_DATABASE_RESET.sql)"
```

### If you get permission errors

```bash
# Check container is running
docker ps

# Restart Supabase if needed
supabase stop
supabase start
```

### If files don't exist

```bash
# Verify files are in the right location
ls -la supabase/database-reset/
```

## 📁 File Descriptions

- **create-all-tables.sql** - Complete schema with all 42 tables, functions, triggers
- **SIMPLE_DATABASE_RESET.sql** - Minimal schema with essential tables only  
- **insert-users-only.sql** - Sample users and user profiles
- **insert-suppliers.sql** - 25+ pharmaceutical suppliers with contact details
- **medicine_master_corrected.sql** - Essential medicines database
- **README.md** - Documentation about the database setup process

Choose **Option 1** for complete development setup or **Option 2** for minimal pharmacy functionality.
