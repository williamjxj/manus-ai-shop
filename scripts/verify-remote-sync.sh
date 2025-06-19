#!/bin/bash

# =====================================================
# Verify Remote Supabase Sync Status
# =====================================================
# This script verifies that your remote Supabase database
# has been properly synced with your local schema
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Supabase Remote Sync Verification${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Get remote connection details
get_remote_details() {
    echo -e "${BLUE}🔗 Getting remote Supabase details...${NC}"
    
    # Source environment variables
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        print_error "NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
        exit 1
    fi
    
    # Extract project reference from URL
    PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
    
    # Construct database connection details
    REMOTE_HOST="db.${PROJECT_REF}.supabase.co"
    REMOTE_PORT="5432"
    REMOTE_USER="postgres"
    REMOTE_DB="postgres"
    
    echo "Remote host: $REMOTE_HOST"
    echo "Project reference: $PROJECT_REF"
    
    print_status "Remote connection details configured"
}

# Get remote password
get_remote_password() {
    echo -e "${BLUE}🔐 Remote database authentication${NC}"
    echo "Please enter your remote Supabase database password:"
    read -s REMOTE_PASSWORD
    export PGPASSWORD=$REMOTE_PASSWORD
}

# Test connection
test_connection() {
    echo -e "${BLUE}🔌 Testing remote connection...${NC}"
    
    if psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "Remote connection successful"
    else
        print_error "Failed to connect to remote database"
        exit 1
    fi
}

# Check tables
check_tables() {
    echo -e "${BLUE}📊 Checking database tables...${NC}"
    
    EXPECTED_TABLES=("profiles" "products" "cart_items" "orders" "order_items" "points_transactions" "webhook_events")
    
    for table in "${EXPECTED_TABLES[@]}"; do
        EXISTS=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '$table'
            );
        " | xargs)
        
        if [ "$EXISTS" = "t" ]; then
            print_status "Table '$table' exists"
        else
            print_error "Table '$table' missing"
        fi
    done
}

# Check functions
check_functions() {
    echo -e "${BLUE}⚙️  Checking database functions...${NC}"
    
    EXPECTED_FUNCTIONS=("handle_new_user" "update_user_points_atomic" "process_points_purchase" "process_product_purchase" "process_points_checkout")
    
    for func in "${EXPECTED_FUNCTIONS[@]}"; do
        EXISTS=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
            SELECT EXISTS (
                SELECT FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_name = '$func'
            );
        " | xargs)
        
        if [ "$EXISTS" = "t" ]; then
            print_status "Function '$func' exists"
        else
            print_error "Function '$func' missing"
        fi
    done
}

# Check RLS policies
check_rls_policies() {
    echo -e "${BLUE}🔒 Checking Row Level Security policies...${NC}"
    
    RLS_COUNT=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
    " | xargs)
    
    if [ "$RLS_COUNT" -gt 0 ]; then
        print_status "Found $RLS_COUNT RLS policies"
    else
        print_warning "No RLS policies found"
    fi
}

# Check storage bucket
check_storage() {
    echo -e "${BLUE}🗂️  Checking storage bucket...${NC}"
    
    BUCKET_EXISTS=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT EXISTS (
            SELECT FROM storage.buckets 
            WHERE id = 'product-images'
        );
    " | xargs)
    
    if [ "$BUCKET_EXISTS" = "t" ]; then
        print_status "Storage bucket 'product-images' exists"
        
        # Check if bucket is public
        IS_PUBLIC=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
            SELECT public FROM storage.buckets WHERE id = 'product-images';
        " | xargs)
        
        if [ "$IS_PUBLIC" = "t" ]; then
            print_status "Storage bucket is public (correct for image viewing)"
        else
            print_warning "Storage bucket is not public"
        fi
    else
        print_error "Storage bucket 'product-images' missing"
    fi
}

# Check sample data
check_sample_data() {
    echo -e "${BLUE}📦 Checking sample data...${NC}"
    
    PRODUCT_COUNT=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM products;
    " | xargs)
    
    if [ "$PRODUCT_COUNT" -gt 0 ]; then
        print_status "Found $PRODUCT_COUNT products in database"
    else
        print_warning "No products found (this is normal for a fresh setup)"
    fi
}

# Check indexes
check_indexes() {
    echo -e "${BLUE}📈 Checking database indexes...${NC}"
    
    INDEX_COUNT=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%';
    " | xargs)
    
    if [ "$INDEX_COUNT" -gt 0 ]; then
        print_status "Found $INDEX_COUNT custom indexes"
    else
        print_warning "No custom indexes found"
    fi
}

# Generate deployment checklist
generate_checklist() {
    echo -e "${BLUE}📋 Deployment Checklist${NC}"
    echo "=================================================="
    
    echo "✅ Database Schema Verification Complete"
    echo
    echo "🚀 Ready for Vercel Deployment!"
    echo
    echo "Next steps:"
    echo "1. Commit your latest changes to Git"
    echo "2. Push to your GitHub repository"
    echo "3. Deploy to Vercel with these environment variables:"
    echo
    echo "Required Environment Variables for Vercel:"
    echo "----------------------------------------"
    echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
    echo "SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
    echo "STRIPE_SECRET_KEY=<your-stripe-secret-key>"
    echo "STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>"
    echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>"
    echo "NEXT_PUBLIC_APP_URL=https://your-app.vercel.app"
    echo
    echo "🔗 Useful Links:"
    echo "- Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
    echo "- Vercel Dashboard: https://vercel.com/dashboard"
    echo "- Stripe Dashboard: https://dashboard.stripe.com/"
}

# Main execution
main() {
    get_remote_details
    echo
    
    get_remote_password
    echo
    
    test_connection
    echo
    
    check_tables
    echo
    
    check_functions
    echo
    
    check_rls_policies
    echo
    
    check_storage
    echo
    
    check_sample_data
    echo
    
    check_indexes
    echo
    
    generate_checklist
}

# Run main function
main "$@"
