-- =====================================================
-- Complete Unused Tables Cleanup Script
-- =====================================================
-- This script removes all unused tables from the database
-- WARNING: This will permanently delete these tables and their data!

-- Backup recommendation
SELECT 'IMPORTANT: Backup your database before running this script!' as warning;


-- Drop subscriptions table (unused in current application)
DROP TABLE IF EXISTS subscriptions CASCADE;
SELECT 'Dropped unused table: subscriptions' as status;
-- Drop product_collections table (unused in current application)
DROP TABLE IF EXISTS product_collections CASCADE;
SELECT 'Dropped unused table: product_collections' as status;
-- Drop product_collection_items table (unused in current application)
DROP TABLE IF EXISTS product_collection_items CASCADE;
SELECT 'Dropped unused table: product_collection_items' as status;
-- Drop product_analytics table (unused in current application)
DROP TABLE IF EXISTS product_analytics CASCADE;
SELECT 'Dropped unused table: product_analytics' as status;
-- Drop wishlists table (unused in current application)
DROP TABLE IF EXISTS wishlists CASCADE;
SELECT 'Dropped unused table: wishlists' as status;
-- Drop review_votes table (unused in current application)
DROP TABLE IF EXISTS review_votes CASCADE;
SELECT 'Dropped unused table: review_votes' as status;
-- Drop content_reports table (unused in current application)
DROP TABLE IF EXISTS content_reports CASCADE;
SELECT 'Dropped unused table: content_reports' as status;
-- Drop media_files table (unused in current application)
DROP TABLE IF EXISTS media_files CASCADE;
SELECT 'Dropped unused table: media_files' as status;

-- =====================================================
-- Verification Query
-- =====================================================

-- List remaining tables and their usage status
SELECT
  table_name,
  CASE
    WHEN table_name IN ('profiles', 'products', 'cart_items', 'orders', 'order_items', 'points_transactions', 'product_media', 'webhook_events', 'categories', 'product_tags', 'product_tag_items', 'product_reviews', 'product_variants') THEN '✅ Actively Used'
    ELSE '⚠️  Review Needed'
  END as usage_status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY usage_status DESC, table_name;

-- Final status
SELECT
  'Database cleanup completed! 🎉' as message,
  'All unused tables have been removed.' as status,
  'Only actively used tables remain.' as result;