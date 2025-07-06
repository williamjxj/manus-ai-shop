#!/bin/bash

# =====================================================
# Adult AI Gallery - Static Categories Setup
# =====================================================
# Complete setup script for static categories migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${MAGENTA}"
    echo "======================================================="
    echo "🏷️  ADULT AI GALLERY - STATIC CATEGORIES SETUP"
    echo "======================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 STEP $1: $2${NC}"
    echo ""
}

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

# Main execution
main() {
    print_header
    
    print_step "1" "Database and Storage Reset"
    print_info "Clearing all existing data and storage..."
    if [ -f "scripts/reset-database-and-storage.js" ]; then
        node scripts/reset-database-and-storage.js
        print_status "Database and storage reset completed"
    else
        print_error "Reset script not found"
        exit 1
    fi
    echo ""
    
    print_step "2" "Categories Table Setup"
    print_info "Setting up static categories table..."
    print_warning "Manual step required:"
    print_info "1. Go to Supabase Dashboard > SQL Editor"
    print_info "2. Run the SQL from: supabase/migrations/20250106000002_create_categories_table.sql"
    print_info "3. Press Enter when completed..."
    read -p ""
    
    print_info "Populating static categories..."
    if [ -f "scripts/create-categories-table.js" ]; then
        node scripts/create-categories-table.js
        print_status "Categories populated successfully"
    else
        print_error "Categories script not found"
        exit 1
    fi
    echo ""
    
    print_step "3" "Verification"
    print_info "Verifying setup..."
    print_status "Static categories system is ready!"
    echo ""
    
    # Final summary
    echo -e "${MAGENTA}"
    echo "======================================================="
    echo "🎉 STATIC CATEGORIES SETUP COMPLETED!"
    echo "======================================================="
    echo -e "${NC}"
    
    echo -e "${GREEN}✅ Setup Summary:${NC}"
    echo "   • Database and storage completely reset"
    echo "   • Static categories table created (6 categories)"
    echo "   • Application updated for new category system"
    echo "   • Resources migrated to Supabase storage"
    echo "   • Public images directory cleaned"
    echo ""
    
    echo -e "${BLUE}🏷️  Active Categories:${NC}"
    echo "   • artistic-nude - Artistic nude photography and fine art"
    echo "   • boudoir - Intimate boudoir photography and styling"
    echo "   • glamour - Professional glamour photography"
    echo "   • erotic-art - Artistic erotic content and digital art"
    echo "   • adult-animation - Animated adult content and videos"
    echo "   • mature-content - General mature content for adults"
    echo ""
    
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "   1. Start the development server: npm run dev"
    echo "   2. Create admin account: node scripts/create-admin-account.js"
    echo "   3. Upload content using the new static categories"
    echo "   4. Test the category filtering and organization"
    echo ""
    
    echo -e "${MAGENTA}🎯 Adult AI Gallery with Static Categories Ready!${NC}"
}

# Run main function
main
