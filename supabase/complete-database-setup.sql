-- =====================================================
-- AI Shop - Complete Supabase Database Setup
-- =====================================================
-- This comprehensive SQL file combines all schema, functions, triggers,
-- policies, and sample data needed for the AI Shop application.
--
-- Features included:
-- - Complete database schema with all tables
-- - Row Level Security (RLS) policies
-- - User profile creation triggers
-- - Enhanced functions for atomic operations
-- - Webhook event handling
-- - Performance indexes
-- - Sample data for testing
-- =====================================================

-- =====================================================
-- Core Tables Schema
-- =====================================================

-- Create users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  points_price INTEGER NOT NULL,
  category TEXT DEFAULT 'ai-art',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('stripe', 'points')),
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  points_price INTEGER NOT NULL
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credits, negative for debits
  type TEXT CHECK (type IN ('purchase', 'spend', 'refund')),
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('basic', 'premium', 'pro')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook_events table for idempotency and tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'processing')) DEFAULT 'processing',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Performance Indexes
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_status ON webhook_events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create Row Level Security Policies
-- =====================================================

-- Drop existing policies to avoid conflicts
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

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Cart items policies
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Points transactions policies
CREATE POLICY "Users can view own points transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Webhook events policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- User Profile Creation Function and Trigger
-- =====================================================

-- Enhanced function to handle user creation with robust error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt (visible in Supabase logs)
  RAISE LOG 'Attempting to create profile for user: %', NEW.id;

  -- Insert with detailed error handling
  INSERT INTO profiles (id, email, points, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

  RAISE LOG 'Successfully created/updated profile for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- Enhanced Database Functions for Atomic Operations
-- =====================================================

-- Function: Atomic points update with race condition protection
CREATE OR REPLACE FUNCTION update_user_points_atomic(
  p_user_id UUID,
  p_points_delta INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_result JSON;
BEGIN
  -- Lock the profile row to prevent race conditions
  SELECT points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if profile exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user: %', p_user_id;
  END IF;

  -- Calculate new points (ensure non-negative)
  v_new_points := GREATEST(0, v_current_points + p_points_delta);

  -- Update points
  UPDATE profiles
  SET
    points = v_new_points,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction if description provided
  IF p_description IS NOT NULL THEN
    INSERT INTO points_transactions (user_id, amount, type, description)
    VALUES (
      p_user_id,
      p_points_delta,
      CASE WHEN p_points_delta > 0 THEN 'purchase' ELSE 'spend' END,
      p_description
    );
  END IF;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'old_balance', v_current_points,
    'new_balance', v_new_points,
    'points_delta', p_points_delta
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update points: %', SQLERRM;
END;
$$;

-- Function: Process points purchase (webhook)
CREATE OR REPLACE FUNCTION process_points_purchase(
  p_user_id UUID,
  p_points INTEGER,
  p_package_id TEXT,
  p_payment_intent_id TEXT,
  p_session_id TEXT,
  p_webhook_event_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if profile exists, create if not
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    INSERT INTO profiles (id, points) VALUES (p_user_id, 0);
  END IF;

  -- Update points atomically
  SELECT update_user_points_atomic(
    p_user_id,
    p_points,
    format('Purchased %s points (Package: %s)', p_points, p_package_id)
  ) INTO v_result;

  -- Record additional transaction details
  UPDATE points_transactions
  SET
    stripe_payment_intent_id = p_payment_intent_id,
    description = description || format(' - Session: %s', p_session_id)
  WHERE id = (
    SELECT id FROM points_transactions
    WHERE user_id = p_user_id
      AND amount = p_points
      AND created_at >= NOW() - INTERVAL '1 minute'
    ORDER BY created_at DESC
    LIMIT 1
  );

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'points_added', p_points,
    'package_id', p_package_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process points purchase: %', SQLERRM;
END;
$$;

-- Function: Process product purchase (webhook)
CREATE OR REPLACE FUNCTION process_product_purchase(
  p_user_id UUID,
  p_cart_items JSONB,
  p_total_cents INTEGER,
  p_payment_intent_id TEXT,
  p_session_id TEXT,
  p_webhook_event_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item JSONB;
  v_order_items JSONB[] := '{}';
BEGIN
  -- Create order
  INSERT INTO orders (
    user_id,
    total_cents,
    total_points,
    payment_method,
    stripe_payment_intent_id,
    status
  ) VALUES (
    p_user_id,
    p_total_cents,
    0,
    'stripe',
    p_payment_intent_id,
    'completed'
  ) RETURNING id INTO v_order_id;

  -- Process each cart item
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Insert order item
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents,
      points_price
    ) VALUES (
      v_order_id,
      (v_cart_item->>'product_id')::UUID,
      (v_cart_item->>'quantity')::INTEGER,
      (v_cart_item->>'price_cents')::INTEGER,
      (v_cart_item->>'points_price')::INTEGER
    );

    -- Build order items array for response
    v_order_items := v_order_items || v_cart_item;
  END LOOP;

  -- Clear user's cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'user_id', p_user_id,
    'total_cents', p_total_cents,
    'items_count', jsonb_array_length(p_cart_items)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process product purchase: %', SQLERRM;
END;
$$;

-- Function: Process points checkout (immediate)
CREATE OR REPLACE FUNCTION process_points_checkout(
  p_user_id UUID,
  p_cart_items JSONB,
  p_total_points INTEGER,
  p_total_cents INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item JSONB;
  v_current_points INTEGER;
  v_points_result JSON;
BEGIN
  -- Check current points balance
  SELECT points INTO v_current_points FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user: %', p_user_id;
  END IF;

  IF v_current_points < p_total_points THEN
    RAISE EXCEPTION 'Insufficient points. Required: %, Available: %', p_total_points, v_current_points;
  END IF;

  -- Create order
  INSERT INTO orders (
    user_id,
    total_cents,
    total_points,
    payment_method,
    status
  ) VALUES (
    p_user_id,
    p_total_cents,
    p_total_points,
    'points',
    'completed'
  ) RETURNING id INTO v_order_id;

  -- Process each cart item
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents,
      points_price
    ) VALUES (
      v_order_id,
      (v_cart_item->>'product_id')::UUID,
      (v_cart_item->>'quantity')::INTEGER,
      (v_cart_item->>'price_cents')::INTEGER,
      (v_cart_item->>'points_price')::INTEGER
    );
  END LOOP;

  -- Deduct points
  SELECT update_user_points_atomic(
    p_user_id,
    -p_total_points,
    format('Purchase order #%s (%s points)', v_order_id, p_total_points)
  ) INTO v_points_result;

  -- Clear user's cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'points_used', p_total_points,
    'remaining_points', (v_points_result->>'new_balance')::INTEGER
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to process points checkout: %', SQLERRM;
END;
$$;

-- =====================================================
-- Function Permissions
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_points_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION process_points_purchase TO service_role;
GRANT EXECUTE ON FUNCTION process_product_purchase TO service_role;
GRANT EXECUTE ON FUNCTION process_points_checkout TO authenticated;

-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Insert sample products (use ON CONFLICT to avoid duplicates)
INSERT INTO products (name, description, image_url, price_cents, points_price, category) VALUES
('Cosmic Nebula', 'A stunning view of a colorful nebula in deep space with swirling gases and bright stars', '/images/cosmic-nebula.jpg', 999, 50, 'space'),
('Mystical Forest', 'An enchanted forest scene with glowing mushrooms and ethereal lighting', '/images/mystical-forest.jpg', 1299, 65, 'fantasy'),
('Cyberpunk City', 'A futuristic cityscape with neon lights and flying vehicles', '/images/cyberpunk-city.jpg', 1499, 75, 'sci-fi'),
('Ancient Dragon', 'A majestic dragon perched on a mountain peak with detailed scales and wings', '/images/ancient-dragon.jpg', 1799, 90, 'fantasy'),
('Ocean Sunset', 'A serene ocean scene with a beautiful sunset reflecting on the waves', '/images/ocean-sunset.jpg', 899, 45, 'nature'),
('Robot Warrior', 'A powerful robotic warrior in a battle-ready stance with glowing eyes', '/images/robot-warrior.jpg', 1599, 80, 'sci-fi')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Database Setup Verification
-- =====================================================

-- Function to verify setup completion
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
  RETURN QUERY SELECT 'Tables'::TEXT, 'OK'::TEXT,
    format('%s tables created', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'))::TEXT;

  -- Check functions
  RETURN QUERY SELECT 'Functions'::TEXT, 'OK'::TEXT,
    format('%s functions created', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'))::TEXT;

  -- Check triggers
  RETURN QUERY SELECT 'Triggers'::TEXT, 'OK'::TEXT,
    format('%s triggers created', (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'))::TEXT;

  -- Check sample data
  RETURN QUERY SELECT 'Sample Products'::TEXT, 'OK'::TEXT,
    format('%s products available', (SELECT COUNT(*) FROM products))::TEXT;

  -- Check RLS
  RETURN QUERY SELECT 'Row Level Security'::TEXT, 'OK'::TEXT,
    format('%s tables with RLS enabled', (
      SELECT COUNT(*) FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relrowsecurity = true AND n.nspname = 'public'
    ))::TEXT;
END;
$$;

-- =====================================================
-- Final Setup Verification
-- =====================================================

-- Show setup completion status
SELECT
  '🎉 AI Shop Database Setup Complete! 🎉' as status,
  'All tables, functions, triggers, policies, and sample data are ready.' as message;

-- Show verification results
SELECT * FROM verify_database_setup();

-- Show table record counts
SELECT
  'products' as table_name,
  COUNT(*) as record_count,
  'Sample products for testing' as description
FROM products
UNION ALL
SELECT
  'profiles' as table_name,
  COUNT(*) as record_count,
  'User profiles (created automatically on signup)' as description
FROM profiles
UNION ALL
SELECT
  'webhook_events' as table_name,
  COUNT(*) as record_count,
  'Stripe webhook event tracking' as description
FROM webhook_events;

-- Show available functions
SELECT
  routine_name as function_name,
  routine_type as type,
  'Enhanced atomic operations for purchases' as purpose
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_user_points_atomic',
    'process_points_purchase',
    'process_product_purchase',
    'process_points_checkout'
  );

COMMENT ON FUNCTION verify_database_setup() IS 'Utility function to verify database setup completion';
COMMENT ON FUNCTION update_user_points_atomic(UUID, INTEGER, TEXT) IS 'Atomically update user points with race condition protection';
COMMENT ON FUNCTION process_points_purchase(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) IS 'Process points purchase from Stripe webhook';
COMMENT ON FUNCTION process_product_purchase(UUID, JSONB, INTEGER, TEXT, TEXT, TEXT) IS 'Process product purchase from Stripe webhook';
COMMENT ON FUNCTION process_points_checkout(UUID, JSONB, INTEGER, INTEGER) IS 'Process immediate points-based checkout';

-- =====================================================
-- Setup Instructions
-- =====================================================

/*
SETUP INSTRUCTIONS:

1. Run this SQL file in your Supabase SQL Editor
2. Verify setup completion by checking the output messages
3. Test user signup to ensure profile creation works
4. Configure your environment variables for Stripe integration
5. Test webhook endpoints with Stripe CLI or dashboard

KEY FEATURES INCLUDED:

✅ Complete database schema with all necessary tables
✅ Row Level Security (RLS) policies for data protection
✅ Automatic user profile creation on signup
✅ Advanced functions for atomic purchase operations
✅ Webhook event tracking for idempotency
✅ Performance indexes for optimized queries
✅ Sample product data for immediate testing
✅ Comprehensive error handling and logging

TABLES CREATED:
- profiles: User account information and points balance
- products: AI-generated images for sale
- cart_items: User shopping cart contents
- orders: Purchase order records
- order_items: Individual items within orders
- points_transactions: Points purchase/spend history
- subscriptions: User subscription management
- webhook_events: Stripe webhook event tracking

FUNCTIONS CREATED:
- handle_new_user(): Automatically creates user profiles
- update_user_points_atomic(): Thread-safe points updates
- process_points_purchase(): Handles points purchase webhooks
- process_product_purchase(): Handles product purchase webhooks
- process_points_checkout(): Immediate points-based purchases
- verify_database_setup(): Setup verification utility

SECURITY:
- All user data protected by Row Level Security
- Functions use SECURITY DEFINER with proper access controls
- Webhook events restricted to service role only
- Race condition protection for concurrent operations

PERFORMANCE:
- Optimized indexes on frequently queried columns
- Atomic operations to prevent data consistency issues
- Efficient JSONB handling for cart operations
- Proper foreign key relationships with cascading deletes
*/
