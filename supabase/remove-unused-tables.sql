-- =====================================================
-- Remove Unused Tables Script
-- =====================================================
-- This script removes tables that are not used in the application code
-- WARNING: This will permanently delete these tables and their data!


-- Drop subscriptions table
DROP TABLE IF EXISTS subscriptions CASCADE;
SELECT 'Dropped subscriptions table' as status;
-- Drop product_collections table
DROP TABLE IF EXISTS product_collections CASCADE;
SELECT 'Dropped product_collections table' as status;
-- Drop product_collection_items table
DROP TABLE IF EXISTS product_collection_items CASCADE;
SELECT 'Dropped product_collection_items table' as status;
-- Drop product_analytics table
DROP TABLE IF EXISTS product_analytics CASCADE;
SELECT 'Dropped product_analytics table' as status;
-- Drop wishlists table
DROP TABLE IF EXISTS wishlists CASCADE;
SELECT 'Dropped wishlists table' as status;
-- Drop review_votes table
DROP TABLE IF EXISTS review_votes CASCADE;
SELECT 'Dropped review_votes table' as status;
-- Drop content_reports table
DROP TABLE IF EXISTS content_reports CASCADE;
SELECT 'Dropped content_reports table' as status;

-- =====================================================
-- Verification
-- =====================================================

-- Check remaining tables
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'products', 'cart_items', 'orders', 'order_items', 'points_transactions', 'product_media', 'media_files', 'webhook_events', 'categories', 'product_tags', 'product_tag_items', 'product_reviews', 'product_variants') THEN '✅ Used'
    ELSE '⚠️  Check if needed'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'Unused tables cleanup completed! 🎉' as message;