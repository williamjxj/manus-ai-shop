#!/bin/bash

# =====================================================
# Sync Local Docker Supabase to Remote Cloud
# =====================================================
# This script syncs your local Docker Supabase database
# schema to your remote Supabase cloud instance for
# Vercel deployment compatibility.
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_HOST="localhost"
LOCAL_PORT="54322"
LOCAL_USER="postgres"
LOCAL_DB="postgres"
SCHEMA_FILE="supabase/current-local-schema.sql"
SETUP_FILE="supabase/complete-database-setup.sql"
STORAGE_FILE="supabase/setup-storage-bucket.sql"

echo -e "${BLUE}🚀 Supabase Local to Remote Sync Script${NC}"
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

# Check if required files exist
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    if [ ! -f ".env.local" ]; then
        print_error ".env.local file not found!"
        echo "Please create .env.local with your remote Supabase credentials:"
        echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
        echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found!"
        echo "Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Some features may be limited."
    fi
    
    print_status "Prerequisites check completed"
}

# Extract current local schema
extract_local_schema() {
    echo -e "${BLUE}📤 Extracting local schema...${NC}"
    
    pg_dump \
        --host=$LOCAL_HOST \
        --port=$LOCAL_PORT \
        --username=$LOCAL_USER \
        --schema-only \
        --no-owner \
        --no-privileges \
        --exclude-schema=information_schema \
        --exclude-schema=pg_catalog \
        --exclude-schema=pg_toast \
        --exclude-schema=auth \
        --exclude-schema=storage \
        --exclude-schema=realtime \
        --exclude-schema=supabase_functions \
        --exclude-schema=extensions \
        --exclude-schema=graphql \
        --exclude-schema=graphql_public \
        --exclude-schema=pgsodium \
        --exclude-schema=pgsodium_masks \
        --exclude-schema=vault \
        --exclude-schema=net \
        --exclude-schema=supabase_migrations \
        --dbname=$LOCAL_DB > $SCHEMA_FILE
    
    if [ $? -eq 0 ]; then
        print_status "Local schema extracted to $SCHEMA_FILE"
    else
        print_error "Failed to extract local schema"
        exit 1
    fi
}

# Get remote Supabase connection details
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

# Prompt for remote database password
get_remote_password() {
    echo -e "${BLUE}🔐 Remote database authentication${NC}"
    echo "Please enter your remote Supabase database password:"
    echo "(This is the password you set when creating your Supabase project)"
    read -s REMOTE_PASSWORD
    export PGPASSWORD=$REMOTE_PASSWORD
}

# Test remote connection
test_remote_connection() {
    echo -e "${BLUE}🔌 Testing remote connection...${NC}"
    
    if psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "Remote connection successful"
    else
        print_error "Failed to connect to remote database"
        echo "Please check your credentials and network connection."
        exit 1
    fi
}

# Backup remote database (optional)
backup_remote() {
    echo -e "${BLUE}💾 Creating remote backup...${NC}"
    read -p "Do you want to create a backup of the remote database? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        BACKUP_FILE="supabase/remote-backup-$(date +%Y%m%d-%H%M%S).sql"
        
        pg_dump \
            -h $REMOTE_HOST \
            -p $REMOTE_PORT \
            -U $REMOTE_USER \
            -d $REMOTE_DB \
            --schema-only \
            --no-owner \
            --no-privileges > $BACKUP_FILE
        
        if [ $? -eq 0 ]; then
            print_status "Remote backup saved to $BACKUP_FILE"
        else
            print_warning "Backup failed, but continuing..."
        fi
    fi
}

# Apply schema to remote database
apply_schema_to_remote() {
    echo -e "${BLUE}📥 Applying schema to remote database...${NC}"
    
    # Use the complete setup file which includes all necessary components
    if [ -f "$SETUP_FILE" ]; then
        echo "Applying complete database setup..."
        psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -f $SETUP_FILE
        
        if [ $? -eq 0 ]; then
            print_status "Database schema applied successfully"
        else
            print_error "Failed to apply database schema"
            exit 1
        fi
    else
        print_error "Setup file $SETUP_FILE not found"
        exit 1
    fi
}

# Setup storage bucket
setup_storage() {
    echo -e "${BLUE}🗂️  Setting up storage bucket...${NC}"
    
    if [ -f "$STORAGE_FILE" ]; then
        echo "Creating storage bucket and policies..."
        psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -f $STORAGE_FILE
        
        if [ $? -eq 0 ]; then
            print_status "Storage bucket setup completed"
        else
            print_warning "Storage setup failed, but continuing..."
        fi
    else
        print_warning "Storage setup file not found: $STORAGE_FILE"
    fi
}

# Verify sync
verify_sync() {
    echo -e "${BLUE}🔍 Verifying sync...${NC}"
    
    # Check if main tables exist
    TABLES_CHECK=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'products', 'cart_items', 'orders', 'order_items', 'points_transactions', 'webhook_events');
    ")
    
    if [ "$TABLES_CHECK" -ge 7 ]; then
        print_status "All main tables found in remote database"
    else
        print_warning "Some tables may be missing (found: $TABLES_CHECK/7)"
    fi
    
    # Check if functions exist
    FUNCTIONS_CHECK=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('handle_new_user', 'update_user_points_atomic', 'process_points_purchase', 'process_product_purchase');
    ")
    
    if [ "$FUNCTIONS_CHECK" -ge 4 ]; then
        print_status "All database functions found"
    else
        print_warning "Some functions may be missing (found: $FUNCTIONS_CHECK/4)"
    fi
    
    # Check storage bucket
    BUCKET_CHECK=$(psql -h $REMOTE_HOST -p $REMOTE_PORT -U $REMOTE_USER -d $REMOTE_DB -t -c "
        SELECT COUNT(*) FROM storage.buckets WHERE id = 'product-images';
    ")
    
    if [ "$BUCKET_CHECK" -ge 1 ]; then
        print_status "Storage bucket 'product-images' found"
    else
        print_warning "Storage bucket may be missing"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting sync process...${NC}"
    echo
    
    check_prerequisites
    echo
    
    extract_local_schema
    echo
    
    get_remote_details
    echo
    
    get_remote_password
    echo
    
    test_remote_connection
    echo
    
    backup_remote
    echo
    
    apply_schema_to_remote
    echo
    
    setup_storage
    echo
    
    verify_sync
    echo
    
    echo -e "${GREEN}🎉 Sync completed successfully!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update your Vercel environment variables"
    echo "2. Deploy your application to Vercel"
    echo "3. Test the deployed application"
    echo
    echo -e "${YELLOW}Environment variables needed for Vercel:${NC}"
    echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "STRIPE_SECRET_KEY=your-stripe-secret-key"
    echo "STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret"
    echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key"
    echo "NEXT_PUBLIC_APP_URL=https://your-app.vercel.app"
}

# Run main function
main "$@"
