-- =====================================================
-- Complete Products & Media Cleanup Script
-- =====================================================
-- This script will completely reset all product-related data
-- WARNING: This will permanently delete all products and related data!

-- Disable foreign key checks temporarily (if needed)
-- SET session_replication_role = replica;

-- =====================================================
-- Step 1: Clean up related tables (in dependency order)
-- =====================================================

-- Clean up cart items first
DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned cart_items table' as status;

-- Clean up order items
DELETE FROM order_items WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned order_items table' as status;

-- Clean up product reviews
DELETE FROM product_reviews WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned product_reviews table' as status;

-- Clean up product media
DELETE FROM product_media WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned product_media table' as status;

-- Clean up product variants
DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned product_variants table' as status;

-- Clean up product collection items
DELETE FROM product_collection_items WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned product_collection_items table' as status;

-- Clean up product tag items
DELETE FROM product_tag_items WHERE product_id IN (SELECT id FROM products);
SELECT 'Cleaned product_tag_items table' as status;

-- Clean up media files (orphaned files)
DELETE FROM media_files WHERE id NOT IN (
  SELECT DISTINCT media_id FROM product_media WHERE media_id IS NOT NULL
);
SELECT 'Cleaned orphaned media_files' as status;

-- =====================================================
-- Step 2: Clean up main products table
-- =====================================================

-- Get count before deletion
SELECT COUNT(*) as products_before_deletion FROM products;

-- Delete all products
DELETE FROM products;

-- Verify deletion
SELECT COUNT(*) as products_after_deletion FROM products;
SELECT 'All products deleted successfully!' as status;

-- =====================================================
-- Step 3: Clean up collections and tags (optional)
-- =====================================================

-- Clean up empty product collections
DELETE FROM product_collections WHERE id NOT IN (
  SELECT DISTINCT collection_id FROM product_collection_items WHERE collection_id IS NOT NULL
);
SELECT 'Cleaned empty product_collections' as status;

-- Clean up unused product tags
DELETE FROM product_tags WHERE id NOT IN (
  SELECT DISTINCT tag_id FROM product_tag_items WHERE tag_id IS NOT NULL
);
SELECT 'Cleaned unused product_tags' as status;

-- =====================================================
-- Step 4: Reset any sequences (if applicable)
-- =====================================================

-- Note: Since we're using UUIDs, there are no sequences to reset
-- But if you had any auto-incrementing columns, you would reset them here:
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

SELECT 'Sequences reset (UUID-based tables don''t need this)' as status;

-- =====================================================
-- Step 5: Verification
-- =====================================================

-- Count remaining records in all product-related tables
SELECT 
  'products' as table_name,
  COUNT(*) as record_count
FROM products

UNION ALL

SELECT 
  'product_media' as table_name,
  COUNT(*) as record_count
FROM product_media

UNION ALL

SELECT 
  'cart_items' as table_name,
  COUNT(*) as record_count
FROM cart_items

UNION ALL

SELECT 
  'order_items' as table_name,
  COUNT(*) as record_count
FROM order_items

UNION ALL

SELECT 
  'product_reviews' as table_name,
  COUNT(*) as record_count
FROM product_reviews

UNION ALL

SELECT 
  'media_files' as table_name,
  COUNT(*) as record_count
FROM media_files

ORDER BY table_name;

-- =====================================================
-- Step 6: Re-enable foreign key checks
-- =====================================================

-- SET session_replication_role = DEFAULT;

-- =====================================================
-- Completion Message
-- =====================================================

SELECT 
  '🎉 Complete products cleanup finished!' as status,
  'All products and related data have been permanently deleted.' as message,
  'Storage files need to be cleaned separately via the cleanup script.' as note;
