# 🔍 Stripe Webhook Debug Checklist

## Step 1: Verify Database Functions

Run this in Supabase SQL Editor:

```sql
-- Check if functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('process_product_purchase', 'process_points_checkout');

-- Test function manually
SELECT process_product_purchase(
  'your-user-id'::UUID,
  '[{"product_id": "test-id", "quantity": 1, "price_cents": 999, "points_price": 50}]'::JSONB,
  999,
  'test-payment-intent',
  'test-session',
  'test-webhook-event'
);
```

## Step 2: Check Environment Variables

Visit: `http://localhost:3000/api/webhooks/stripe/test`
Should show:

```json
{
  "hasWebhookSecret": true,
  "secretLength": 64
}
```

## Step 3: Test Webhook Endpoint

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Step 4: Stripe CLI Setup

```bash
# Make sure you're logged in
stripe auth

# Listen with specific events
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/webhooks/stripe

# Should show:
# > Ready! Your webhook signing secret is whsec_...
```

## Step 5: Test Purchase Flow

1. Add product to cart
2. Go to checkout
3. Use Stripe test card: 4242 4242 4242 4242
4. Complete payment
5. Check logs in both terminals:
   - Next.js terminal (webhook logs)
   - Stripe CLI terminal (event forwarding)

## Expected Log Sequence:

### Stripe CLI Terminal:

```
2024-01-07 10:30:15 --> checkout.session.completed [evt_1234...]
2024-01-07 10:30:15 <-- [200] POST http://localhost:3000/api/webhooks/stripe
```

### Next.js Terminal:

```
🔍 Webhook Debug Info: { hasWebhookSecret: true, ... }
✅ Webhook signature verified successfully: { eventType: 'checkout.session.completed', ... }
🎯 PROCESSING EVENT: { eventType: 'checkout.session.completed', ... }
💳 CHECKOUT SESSION COMPLETED: { sessionId: 'cs_...', hasCartItemsMetadata: true, ... }
🛒 HANDLING PRODUCT PURCHASE
🛒 STARTING PRODUCT PURCHASE HANDLER
📋 PRODUCT PURCHASE DATA: { userId: '...', cartItemsRaw: '[...]', ... }
✅ PARSED CART ITEMS: [{ product_id: '...', quantity: 1, ... }]
💰 CALCULATED TOTAL: { totalCents: 999, ... }
🔄 CALLING PROCESS_PRODUCT_PURCHASE FUNCTION
📊 FUNCTION RESULT: { functionResult: { success: true, order_id: '...' }, hasError: false }
```

## Common Issues & Solutions:

### Issue 1: No webhook events received

- Check Stripe CLI is running
- Verify webhook URL is correct
- Check firewall/network issues

### Issue 2: Signature verification failed

- Wrong webhook secret
- Check .env.local file
- Restart Next.js server after changing env

### Issue 3: Function not found error

- Database functions not created
- Run fix-purchase-functions.sql in Supabase

### Issue 4: Metadata missing

- Check checkout flow
- Verify cart items are being passed correctly

### Issue 5: Database transaction fails

- Check user permissions
- Verify table schemas match
- Check Supabase logs

## Debug Commands:

### Check webhook secret:

```bash
echo $STRIPE_WEBHOOK_SECRET
# Should start with whsec_
```

### Test database connection:

```sql
SELECT current_user, current_database();
```

### Check cart items table:

```sql
SELECT * FROM cart_items LIMIT 5;
```

### Check orders table:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
```
