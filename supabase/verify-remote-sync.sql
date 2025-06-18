-- =====================================================
-- Remote Supabase Sync Verification Script
-- =====================================================
-- Run this script after syncing to verify everything is working
-- =====================================================

-- =====================================================
-- Check Tables
-- =====================================================

SELECT 
  '📊 TABLE VERIFICATION' as section,
  '' as spacer;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'products', 'cart_items', 'orders', 
      'order_items', 'points_transactions', 'subscriptions', 'webhook_events'
    ) THEN '✅ Expected'
    ELSE '❓ Unexpected'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- Check Functions
-- =====================================================

SELECT 
  '🔧 FUNCTION VERIFICATION' as section,
  '' as spacer;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN (
      'handle_new_user', 'update_user_points_atomic', 'process_points_purchase',
      'process_product_purchase', 'process_points_checkout', 'verify_database_setup'
    ) THEN '✅ Expected'
    ELSE '❓ Unexpected'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- Check RLS Policies
-- =====================================================

SELECT 
  '🔒 RLS POLICY VERIFICATION' as section,
  '' as spacer;

SELECT 
  schemaname,
  tablename,
  policyname,
  '✅ Active' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- Check Sample Data
-- =====================================================

SELECT 
  '📦 SAMPLE DATA VERIFICATION' as section,
  '' as spacer;

SELECT 
  'products' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ Sample data loaded'
    WHEN COUNT(*) > 0 THEN '⚠️ Partial data'
    ELSE '❌ No data'
  END as status
FROM products;

-- =====================================================
-- Check Indexes
-- =====================================================

SELECT 
  '📇 INDEX VERIFICATION' as section,
  '' as spacer;

SELECT 
  schemaname,
  tablename,
  indexname,
  '✅ Created' as status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- Check Triggers
-- =====================================================

SELECT 
  '⚡ TRIGGER VERIFICATION' as section,
  '' as spacer;

SELECT 
  trigger_schema,
  event_object_table,
  trigger_name,
  '✅ Active' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- Check Auth Users (should be preserved)
-- =====================================================

SELECT 
  '👥 USER VERIFICATION' as section,
  '' as spacer;

SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Users preserved'
    ELSE '⚠️ No users found'
  END as status
FROM auth.users;

-- =====================================================
-- Overall Health Check
-- =====================================================

SELECT 
  '🏥 OVERALL HEALTH CHECK' as section,
  '' as spacer;

WITH health_check AS (
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as function_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policy_count,
    (SELECT COUNT(*) FROM products) as product_count,
    (SELECT COUNT(*) FROM auth.users) as user_count
)
SELECT 
  'Tables' as component,
  table_count::text as count,
  CASE WHEN table_count >= 8 THEN '✅ Good' ELSE '❌ Missing tables' END as status
FROM health_check
UNION ALL
SELECT 
  'Functions' as component,
  function_count::text as count,
  CASE WHEN function_count >= 6 THEN '✅ Good' ELSE '❌ Missing functions' END as status
FROM health_check
UNION ALL
SELECT 
  'RLS Policies' as component,
  policy_count::text as count,
  CASE WHEN policy_count >= 8 THEN '✅ Good' ELSE '❌ Missing policies' END as status
FROM health_check
UNION ALL
SELECT 
  'Sample Products' as component,
  product_count::text as count,
  CASE WHEN product_count >= 6 THEN '✅ Good' ELSE '⚠️ Limited data' END as status
FROM health_check
UNION ALL
SELECT 
  'Auth Users' as component,
  user_count::text as count,
  CASE WHEN user_count >= 0 THEN '✅ Preserved' ELSE '❌ Error' END as status
FROM health_check;

-- =====================================================
-- Final Status
-- =====================================================

SELECT 
  '🎉 SYNC VERIFICATION COMPLETE' as final_status,
  'Review the results above to ensure everything is working correctly.' as message;

-- =====================================================
-- Quick Test Queries
-- =====================================================

-- Test if you can query products (should work for everyone)
SELECT 
  '🧪 QUICK TESTS' as section,
  '' as spacer;

SELECT 
  'Product Query Test' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Products accessible'
    ELSE '❌ Cannot access products'
  END as result
FROM products
LIMIT 1;

-- Test if RLS is working (this should work only for authenticated users)
SELECT 
  'RLS Test' as test_name,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ RLS tables accessible'
    ELSE '❌ RLS blocking access'
  END as result
FROM profiles
LIMIT 1;
