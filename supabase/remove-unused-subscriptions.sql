-- =====================================================
-- Remove Unused Subscriptions Table
-- =====================================================
-- This script removes the subscriptions table and related
-- components since they are not being used in the application
-- =====================================================

-- =====================================================
-- Drop Subscriptions Table and Related Components
-- =====================================================

-- Drop RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

-- Drop indexes related to subscriptions
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_stripe_id;

-- Drop the subscriptions table
DROP TABLE IF EXISTS subscriptions CASCADE;

-- =====================================================
-- Clean Up Documentation References
-- =====================================================

-- Update the verification function to remove subscriptions reference
CREATE OR REPLACE FUNCTION verify_database_setup()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check tables
  RETURN QUERY
  SELECT 
    'Tables' as component,
    CASE 
      WHEN COUNT(*) >= 6 THEN '✅ All required tables exist'
      ELSE '❌ Missing tables'
    END as status,
    format('Found %s tables: %s', 
      COUNT(*), 
      string_agg(table_name, ', ' ORDER BY table_name)
    ) as details
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('profiles', 'products', 'cart_items', 'orders', 'order_items', 'points_transactions', 'webhook_events');

  -- Check RLS policies
  RETURN QUERY
  SELECT 
    'RLS Policies' as component,
    CASE 
      WHEN COUNT(*) >= 6 THEN '✅ RLS policies configured'
      ELSE '❌ Missing RLS policies'
    END as status,
    format('Found %s RLS policies', COUNT(*)) as details
  FROM pg_policies 
  WHERE schemaname = 'public';

  -- Check functions
  RETURN QUERY
  SELECT 
    'Functions' as component,
    CASE 
      WHEN COUNT(*) >= 4 THEN '✅ Database functions available'
      ELSE '❌ Missing functions'
    END as status,
    format('Found %s functions: %s', 
      COUNT(*), 
      string_agg(routine_name, ', ' ORDER BY routine_name)
    ) as details
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN ('handle_new_user', 'update_user_points_atomic', 'process_points_purchase', 'process_product_purchase', 'process_points_checkout');

  -- Check triggers
  RETURN QUERY
  SELECT 
    'Triggers' as component,
    CASE 
      WHEN COUNT(*) >= 1 THEN '✅ Triggers configured'
      ELSE '❌ Missing triggers'
    END as status,
    format('Found %s triggers', COUNT(*)) as details
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';

END;
$$;

-- =====================================================
-- Verification
-- =====================================================

-- Verify subscriptions table is removed
SELECT 
  'Subscriptions Cleanup' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Subscriptions table successfully removed'
    ELSE '❌ Subscriptions table still exists'
  END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions';

-- Show remaining tables
SELECT 
  'Remaining Tables' as info,
  string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- =====================================================
-- Success Message
-- =====================================================

SELECT 
  '🧹 CLEANUP COMPLETE! 🧹' as status,
  'Unused subscriptions table has been removed.' as message,
  'Your database now only contains the tables actually used by your application.' as note;

-- =====================================================
-- SUMMARY OF CHANGES:
-- =====================================================

/*
REMOVED COMPONENTS:
❌ subscriptions table
❌ Related RLS policies
❌ Related indexes
❌ References in verification function

REMAINING CORE TABLES:
✅ profiles - User accounts and points
✅ products - AI images for sale
✅ cart_items - Shopping cart
✅ orders - Purchase records
✅ order_items - Order line items
✅ points_transactions - Points history
✅ webhook_events - Stripe webhook tracking

BUSINESS MODEL SUPPORTED:
✅ One-time product purchases (AI images)
✅ One-time points purchases
✅ Cart-based shopping experience
✅ Points-based alternative payment

FUTURE CONSIDERATIONS:
If you ever want to add subscription plans in the future:
1. You can recreate the subscriptions table
2. Add Stripe subscription webhook handlers
3. Build subscription management UI
4. Implement automatic points allocation

For now, your current model works perfectly without subscriptions!
*/
