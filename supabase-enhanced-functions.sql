-- =====================================================
-- Enhanced Database Functions for AI Shop
-- =====================================================
-- These functions provide atomic operations for purchasing workflows
-- with proper error handling and transaction safety

-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'processing')) DEFAULT 'processing',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_status ON webhook_events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_points_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION process_points_purchase TO service_role;
GRANT EXECUTE ON FUNCTION process_product_purchase TO service_role;
GRANT EXECUTE ON FUNCTION process_points_checkout TO authenticated;

-- Enable RLS on webhook_events table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for webhook_events (service role only)
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');
