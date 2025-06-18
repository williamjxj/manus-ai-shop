-- =====================================================
-- Remote Supabase Database Cleanup Script
-- =====================================================
-- This script safely cleans the remote Supabase database
-- while preserving auth.users and essential system tables
-- =====================================================

-- =====================================================
-- STEP 1: Drop All Custom Functions
-- =====================================================

DROP FUNCTION IF EXISTS verify_database_setup() CASCADE;
DROP FUNCTION IF EXISTS update_user_points_atomic(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_points_purchase(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_product_purchase(UUID, JSONB, INTEGER, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS process_points_checkout(UUID, JSONB, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- =====================================================
-- STEP 2: Drop All Triggers
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- STEP 3: Drop All Policies (to avoid conflicts)
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own points transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage webhook events" ON webhook_events;

-- =====================================================
-- STEP 4: Drop All Custom Tables (in correct order)
-- =====================================================

-- Drop tables in reverse dependency order to avoid foreign key conflicts
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- STEP 5: Drop All Custom Indexes
-- =====================================================

-- Note: Indexes are automatically dropped when tables are dropped
-- This section is for reference only

-- =====================================================
-- STEP 6: Clean Up Any Remaining Objects
-- =====================================================

-- Drop any custom types if they exist
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- =====================================================
-- STEP 7: Verification
-- =====================================================

-- Show remaining custom tables (should be empty)
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show remaining custom functions (should be empty)
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Show auth.users table (should be preserved)
SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count,
  'Preserved - users not deleted' as status
FROM auth.users;

-- =====================================================
-- Cleanup Complete Message
-- =====================================================

SELECT 
  '🧹 Remote Database Cleanup Complete! 🧹' as status,
  'All custom tables, functions, triggers, and policies have been removed.' as message,
  'auth.users and system tables are preserved.' as note;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================

/*
WHAT THIS SCRIPT DOES:
✅ Removes all custom application tables
✅ Removes all custom functions and triggers  
✅ Removes all RLS policies
✅ Preserves auth.users and all user accounts
✅ Preserves all Supabase system tables
✅ Cleans up in the correct order to avoid conflicts

WHAT THIS SCRIPT DOES NOT DO:
❌ Does not delete user accounts (auth.users preserved)
❌ Does not affect Supabase system tables
❌ Does not affect authentication settings
❌ Does not affect storage buckets
❌ Does not affect edge functions

AFTER RUNNING THIS SCRIPT:
1. Run the complete-database-setup.sql script
2. Test user authentication (existing users preserved)
3. Verify all tables and functions are recreated
4. Test application functionality

SAFETY NOTES:
- This script is designed to be safe for production use
- User accounts and authentication are preserved
- All application data will be lost (products, orders, etc.)
- Make sure you have backups if needed
*/
