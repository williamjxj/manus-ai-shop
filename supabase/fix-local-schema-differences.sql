-- =====================================================
-- Fix Local Schema Differences
-- =====================================================
-- This script adds the missing elements to your local 
-- Docker Supabase to match complete-database-setup.sql
-- =====================================================

-- =====================================================
-- Add Missing Trigger (CRITICAL)
-- =====================================================

-- This trigger is essential for automatic profile creation
-- when new users sign up via OAuth or email
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Add Missing Indexes (PERFORMANCE)
-- =====================================================

-- Index for faster product category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Index for faster profile email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- Add Missing Verification Function (UTILITY)
-- =====================================================

CREATE OR REPLACE FUNCTION verify_database_setup()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check tables
  RETURN QUERY
  SELECT 
    'Tables' as component,
    CASE 
      WHEN COUNT(*) >= 8 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' tables found' as details
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'products', 'cart_items', 'orders', 'order_items', 'points_transactions', 'subscriptions', 'webhook_events');

  -- Check functions
  RETURN QUERY
  SELECT 
    'Functions' as component,
    CASE 
      WHEN COUNT(*) >= 6 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' functions found' as details
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
    AND routine_name IN ('handle_new_user', 'update_user_points_atomic', 'process_points_purchase', 'process_product_purchase', 'process_points_checkout', 'verify_database_setup');

  -- Check policies
  RETURN QUERY
  SELECT 
    'RLS Policies' as component,
    CASE 
      WHEN COUNT(*) >= 10 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' policies found' as details
  FROM pg_policies 
  WHERE schemaname = 'public';

  -- Check triggers
  RETURN QUERY
  SELECT 
    'Triggers' as component,
    CASE 
      WHEN COUNT(*) >= 1 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' triggers found' as details
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
    AND trigger_name = 'on_auth_user_created';

  -- Check indexes
  RETURN QUERY
  SELECT 
    'Indexes' as component,
    CASE 
      WHEN COUNT(*) >= 9 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' custom indexes found' as details
  FROM pg_indexes 
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

  -- Check sample data
  RETURN QUERY
  SELECT 
    'Sample Data' as component,
    CASE 
      WHEN COUNT(*) >= 6 THEN 'OK'
      ELSE 'MISSING'
    END as status,
    COUNT(*)::TEXT || ' products found' as details
  FROM products;

END;
$$;

-- =====================================================
-- Verification
-- =====================================================

-- Test the trigger exists
SELECT 
  'Trigger Check' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ on_auth_user_created trigger exists'
    ELSE '❌ Trigger missing'
  END as result
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'on_auth_user_created';

-- Test the indexes exist
SELECT 
  'Index Check' as test,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Missing indexes added'
    ELSE '❌ Indexes still missing'
  END as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN ('idx_products_category', 'idx_profiles_email');

-- Test the verification function
SELECT 
  'Function Check' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ verify_database_setup function exists'
    ELSE '❌ Function missing'
  END as result
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'verify_database_setup';

-- Run full verification
SELECT * FROM verify_database_setup();

-- =====================================================
-- Success Message
-- =====================================================

SELECT 
  '🎉 LOCAL SCHEMA FIXES APPLIED! 🎉' as status,
  'Your local schema now matches complete-database-setup.sql' as message,
  'You can now safely sync with remote Supabase' as next_step;

-- =====================================================
-- NOTES:
-- =====================================================

/*
WHAT THIS SCRIPT DOES:
✅ Adds the critical on_auth_user_created trigger
✅ Adds performance indexes for products and profiles
✅ Adds the verification utility function
✅ Verifies all changes were applied correctly

AFTER RUNNING THIS SCRIPT:
✅ New user signups will automatically create profiles
✅ Product category queries will be faster
✅ Profile email lookups will be faster
✅ You can verify setup with: SELECT * FROM verify_database_setup();
✅ Your local schema will match complete-database-setup.sql
✅ You can safely sync with remote Supabase

CRITICAL IMPORTANCE:
The on_auth_user_created trigger is essential for user authentication.
Without it, new users won't get profiles and may experience login issues.
*/
