#!/bin/bash

# =====================================================
# Environment Setup Helper
# =====================================================
# This script helps you set up the .env.local file
# with the correct environment variables for deployment
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Environment Setup Helper${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env.local exists
check_env_file() {
    if [ -f ".env.local" ]; then
        print_warning ".env.local already exists"
        echo "Current contents:"
        echo "----------------------------------------"
        cat .env.local
        echo "----------------------------------------"
        echo
        read -p "Do you want to update it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Keeping existing .env.local file"
            exit 0
        fi
    fi
}

# Collect Supabase information
collect_supabase_info() {
    echo -e "${BLUE}📊 Supabase Configuration${NC}"
    echo "You can find these values in your Supabase Dashboard:"
    echo "https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    echo

    read -p "Enter your Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
    
    echo
}

# Collect Stripe information
collect_stripe_info() {
    echo -e "${BLUE}💳 Stripe Configuration${NC}"
    echo "You can find these values in your Stripe Dashboard:"
    echo "https://dashboard.stripe.com/apikeys"
    echo

    read -p "Enter your Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
    read -p "Enter your Stripe Publishable Key (pk_test_...): " STRIPE_PUBLISHABLE_KEY
    read -p "Enter your Stripe Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
    
    echo
}

# Collect App information
collect_app_info() {
    echo -e "${BLUE}🌐 Application Configuration${NC}"
    echo "For local development, use http://localhost:3000"
    echo "For production, use your Vercel app URL"
    echo

    read -p "Enter your App URL (http://localhost:3000 or https://your-app.vercel.app): " APP_URL
    
    echo
}

# Generate .env.local file
generate_env_file() {
    echo -e "${BLUE}📝 Generating .env.local file...${NC}"
    
    cat > .env.local << EOF
# =====================================================
# Environment Variables for AI Shop
# =====================================================
# Generated on $(date)
# =====================================================

# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Stripe Configuration
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Application Configuration
NEXT_PUBLIC_APP_URL=$APP_URL

# =====================================================
# Additional Notes:
# =====================================================
# 
# For Vercel Deployment:
# 1. Copy these variables to your Vercel project settings
# 2. Update NEXT_PUBLIC_APP_URL to your Vercel domain
# 3. Update Stripe webhook endpoint to your Vercel domain
#
# For Local Development:
# 1. Make sure Supabase is running: supabase start
# 2. Make sure these values match your local setup
#
# Security:
# - Never commit this file to version control
# - Keep your service role key and webhook secret secure
# - Use test keys for development, live keys for production
# =====================================================
EOF

    print_status ".env.local file created successfully!"
}

# Validate configuration
validate_config() {
    echo -e "${BLUE}🔍 Validating configuration...${NC}"
    
    # Check Supabase URL format
    if [[ $SUPABASE_URL =~ ^https://[a-z0-9]+\.supabase\.co$ ]]; then
        print_status "Supabase URL format is valid"
    else
        print_warning "Supabase URL format may be incorrect"
    fi
    
    # Check Stripe key formats
    if [[ $STRIPE_SECRET_KEY =~ ^sk_(test_|live_) ]]; then
        print_status "Stripe secret key format is valid"
    else
        print_warning "Stripe secret key format may be incorrect"
    fi
    
    if [[ $STRIPE_PUBLISHABLE_KEY =~ ^pk_(test_|live_) ]]; then
        print_status "Stripe publishable key format is valid"
    else
        print_warning "Stripe publishable key format may be incorrect"
    fi
    
    if [[ $STRIPE_WEBHOOK_SECRET =~ ^whsec_ ]]; then
        print_status "Stripe webhook secret format is valid"
    else
        print_warning "Stripe webhook secret format may be incorrect"
    fi
}

# Show next steps
show_next_steps() {
    echo
    echo -e "${GREEN}🎉 Environment setup complete!${NC}"
    echo
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Test your local development setup:"
    echo "   npm run dev"
    echo
    echo "2. Sync your database to remote Supabase:"
    echo "   ./scripts/sync-to-remote.sh"
    echo
    echo "3. Deploy to Vercel:"
    echo "   - Push your code to GitHub"
    echo "   - Connect your repo to Vercel"
    echo "   - Copy environment variables to Vercel project settings"
    echo
    echo "4. Update Stripe webhook endpoint:"
    echo "   - Go to Stripe Dashboard > Webhooks"
    echo "   - Update endpoint URL to: https://your-app.vercel.app/api/webhooks/stripe"
    echo
    echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
    echo "- Never commit .env.local to version control"
    echo "- Use test keys for development"
    echo "- Use live keys only for production"
    echo "- Keep your service role key secure"
}

# Main execution
main() {
    check_env_file
    echo
    
    collect_supabase_info
    collect_stripe_info
    collect_app_info
    
    generate_env_file
    echo
    
    validate_config
    echo
    
    show_next_steps
}

# Run main function
main "$@"
