# Manual Points Processing Fix

## Quick Solution

Since your database functions work but webhooks aren't firing, you can manually process the points:

### Option 1: Use the Debug Endpoint

```bash
curl -X POST https://your-domain.com/api/debug/webhook-status \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_a1RojAMMaRqnWqL8XOrPCxyYYu4YyN2FAGzXvJbzO5L9YipVzbxNJ5TlOx",
    "userId": "2f0a3034-dda6-4376-b01c-eb26fa690e67",
    "points": 550,
    "packageId": "premium"
  }'
```

### Option 2: Direct Database Query

Run this in your Supabase SQL editor:

```sql
SELECT process_points_purchase(
  '2f0a3034-dda6-4376-b01c-eb26fa690e67',  -- user_id
  550,                                      -- points
  'premium',                               -- package_id
  'manual-payment-intent',                 -- payment_intent_id
  'cs_test_a1RojAMMaRqnWqL8XOrPCxyYYu4YyN2FAGzXvJbzO5L9YipVzbxNJ5TlOx', -- session_id
  'manual-webhook-event'                   -- webhook_event_id
);
```

## Root Cause Analysis

The issue is that Stripe webhooks are not reaching your application. Common causes:

1. **Webhook URL Configuration**: 
   - Check Stripe Dashboard → Webhooks
   - Ensure URL is correct: `https://your-domain.com/api/webhooks/stripe`
   - Ensure `checkout.session.completed` event is selected

2. **Environment Variables**:
   - `STRIPE_WEBHOOK_SECRET` might be missing or incorrect
   - Check your deployment environment variables

3. **Network Issues**:
   - Webhook endpoint might not be publicly accessible
   - Firewall or security settings blocking Stripe

## Permanent Fix Steps

1. **Check Stripe Webhook Dashboard**:
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook
   - Check "Attempts" tab for failed requests
   - Look for error messages

2. **Verify Environment Variables**:
   ```bash
   # Check these are set in your deployment
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

3. **Test Webhook Endpoint**:
   ```bash
   # Test if endpoint is accessible
   curl -X POST https://your-domain.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

4. **Check Webhook Logs**:
   - Look at your application logs for webhook errors
   - Check if webhook signature verification is failing

## Immediate Action

For now, use the manual processing to add points to users who have made successful payments. Then fix the webhook configuration for future purchases.

## Prevention

Once webhooks are working, you should see:
1. Webhook events in the `webhook_events` table
2. Points transactions in the `points_transactions` table
3. Updated points balances in the `profiles` table
4. Console logs showing webhook processing
