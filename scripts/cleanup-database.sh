#!/bin/bash

# =====================================================
# Adult AI Gallery - Database Cleanup Script
# =====================================================
# This script clears all product-related data while preserving
# user accounts and authentication data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Database connection settings
DB_HOST="localhost"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

echo -e "${BLUE}🧹 Starting Adult AI Gallery Database Cleanup...${NC}"
echo ""

# Function to execute SQL and show results
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo -e "${BLUE}📝 $description${NC}"
    
    PGPASSWORD=$DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -c "$sql"
    
    if [ $? -eq 0 ]; then
        print_status "$description completed"
    else
        print_error "$description failed"
        exit 1
    fi
    echo ""
}

# Step 1: Clear product-related data
echo -e "${YELLOW}🗑️  Clearing product-related data...${NC}"

execute_sql "DELETE FROM order_items;" "Clearing order items"
execute_sql "DELETE FROM orders;" "Clearing orders"
execute_sql "DELETE FROM cart_items;" "Clearing cart items"
execute_sql "DELETE FROM points_transactions;" "Clearing points transactions"
execute_sql "DELETE FROM webhook_events;" "Clearing webhook events"
execute_sql "DELETE FROM products;" "Clearing products"

# Step 2: Verification
echo -e "${YELLOW}🔍 Verifying cleanup...${NC}"

execute_sql "
SELECT 
  'products' as table_name,
  COUNT(*) as remaining_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Cleaned'
    ELSE '❌ Still has data'
  END as status
FROM products
UNION ALL
SELECT 
  'cart_items' as table_name,
  COUNT(*) as remaining_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Cleaned'
    ELSE '❌ Still has data'
  END as status
FROM cart_items
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as remaining_records,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Cleaned'
    ELSE '❌ Still has data'
  END as status
FROM orders;
" "Verifying data cleanup"

# Step 3: Show preserved data
execute_sql "
SELECT 
  'auth.users' as table_name,
  COUNT(*) as preserved_records,
  '✅ Preserved' as status
FROM auth.users
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as preserved_records,
  '✅ Preserved' as status
FROM profiles;
" "Verifying preserved user data"

echo -e "${GREEN}🎉 Database cleanup completed successfully!${NC}"
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "   • Product data: Cleared"
echo -e "   • User accounts: Preserved"
echo -e "   • Authentication: Preserved"
echo -e "   • Ready for adult content setup"
echo ""
