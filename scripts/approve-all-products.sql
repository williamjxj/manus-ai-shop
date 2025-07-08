-- =====================================================
-- Approve All Products Script
-- =====================================================
-- This script approves all pending products for testing purposes
-- Run this in your Supabase SQL editor to make products visible

UPDATE products 
SET 
  moderation_status = 'approved',
  moderated_at = NOW()
WHERE moderation_status = 'pending';

-- Show results
SELECT 
  id,
  name,
  moderation_status,
  moderated_at,
  created_at
FROM products 
ORDER BY created_at DESC;
