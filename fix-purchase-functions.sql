-- =====================================================
-- DIRECT SQL: Fix Purchase Functions
-- =====================================================
-- Copy and paste this directly into Supabase SQL Editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS process_product_purchase(UUID, JSONB, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS process_points_checkout(UUID, JSONB, INTEGER, INTEGER);

-- Create process_product_purchase function
CREATE OR REPLACE FUNCTION process_product_purchase(
  p_user_id UUID,
  p_cart_items JSONB,
  p_total_cents INTEGER,
  p_payment_intent_id TEXT,
  p_session_id TEXT,
  p_webhook_event_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price_cents INTEGER;
  v_points_price INTEGER;
BEGIN
  -- Create the order
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
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_price_cents := (v_item->>'price_cents')::INTEGER;
    v_points_price := (v_item->>'points_price')::INTEGER;

    -- Create order item
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents,
      points_price
    ) VALUES (
      v_order_id,
      v_product_id,
      v_quantity,
      v_price_cents,
      v_points_price
    );
  END LOOP;

  -- Clear user's cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_cents', p_total_cents
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create process_points_checkout function
CREATE OR REPLACE FUNCTION process_points_checkout(
  p_user_id UUID,
  p_cart_items JSONB,
  p_total_points INTEGER,
  p_total_cents INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price_cents INTEGER;
  v_points_price INTEGER;
  v_current_points INTEGER;
BEGIN
  -- Check user's current points
  SELECT points INTO v_current_points 
  FROM profiles 
  WHERE id = p_user_id;

  IF v_current_points IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF v_current_points < p_total_points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Create the order
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
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_price_cents := (v_item->>'price_cents')::INTEGER;
    v_points_price := (v_item->>'points_price')::INTEGER;

    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_cents,
      points_price
    ) VALUES (
      v_order_id,
      v_product_id,
      v_quantity,
      v_price_cents,
      v_points_price
    );
  END LOOP;

  -- Deduct points and create transaction
  UPDATE profiles SET points = points - p_total_points WHERE id = p_user_id;
  
  INSERT INTO points_transactions (
    user_id, amount, type, description, order_id
  ) VALUES (
    p_user_id, -p_total_points, 'spend', 'Product purchase', v_order_id
  );

  -- Clear user's cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'points_used', p_total_points,
    'remaining_points', v_current_points - p_total_points
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'error_code', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
