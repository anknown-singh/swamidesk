#!/bin/bash

# =====================================================
# SwamIDesk Database Reset Script
# =====================================================
# Executes all SQL scripts in the correct chronological order
# Run this from the supabase/database-reset directory
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}SwamIDesk Database Reset - Starting...${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check if we're in a Supabase project
if [ ! -f "../config.toml" ]; then
    echo -e "${RED}Error: Not in a Supabase project directory${NC}"
    echo -e "${RED}Please run this script from the supabase/database-reset directory${NC}"
    exit 1
fi

# Check if Supabase is running and database container exists
if ! docker ps | grep -q "supabase_db_swamidesk"; then
    echo -e "${RED}Error: Supabase database container is not running${NC}"
    echo -e "${YELLOW}Please start Supabase first with: npm run supabase:local${NC}"
    exit 1
fi

# Reset database to clean state first
echo -e "${BLUE}Resetting database to clean state...${NC}"
cd ..  # Go back to project root for npm command
if npm run supabase:db:reset >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database reset completed${NC}"
else
    echo -e "${RED}❌ Database reset failed${NC}"
    exit 1
fi
cd database-reset  # Return to database-reset directory
echo ""

# Define scripts in execution order
SCRIPTS=(
    "create-all-tables.sql"
    "insert-users-only.sql" 
    "insert-suppliers.sql"
    "insert-patients.sql"
    "medicine_master_corrected.sql"
    "pharmacy_notification_triggers.sql"
    "enable_realtime_all_tables.sql"
    "disable_rls_all_tables.sql"
)

# Function to execute SQL script
execute_sql() {
    local script=$1
    local step=$2
    
    # echo -e "${YELLOW}[$step/${#SCRIPTS[@]}] Executing: $script${NC}"
    echo -e "${YELLOW}[$step/${#SCRIPTS[@]}] Executing: $script${NC}"
    
    if [ ! -f "$script" ]; then
        echo -e "${RED}Error: Script $script not found${NC}"
        exit 1
    fi
    
    # Get absolute path for the script
    local script_path="$(pwd)/$script"
    
    # Execute the script using Docker exec into Supabase database container
    echo -e "${BLUE}📋 Output from $script:${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    if docker exec -i supabase_db_swamidesk psql -U postgres -d postgres < "$script_path"; then
        echo -e "${BLUE}----------------------------------------${NC}"
        echo -e "${GREEN}✅ $script completed successfully${NC}"
    else
        echo -e "${BLUE}----------------------------------------${NC}"
        echo -e "${RED}❌ Error executing $script${NC}"
        echo -e "${RED}Please check the script for errors and ensure Supabase is running${NC}"
        exit 1
    fi
    
    echo ""
}

# Start execution
echo -e "${BLUE}Starting database reset with ${#SCRIPTS[@]} scripts...${NC}"
echo ""

# Execute each script in order
step=1
for script in "${SCRIPTS[@]}"; do
    execute_sql "$script" "$step"
    ((step++))
done

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}✅ Database reset completed successfully!${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo -e "${GREEN}All ${#SCRIPTS[@]} scripts executed in order:${NC}"
for i in "${!SCRIPTS[@]}"; do
    echo -e "  $((i+1)). ${SCRIPTS[i]}"
done
echo ""
echo -e "${BLUE}Your SwamIDesk database is now ready to use!${NC}"