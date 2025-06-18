# Webhook Debugging Guide

## Current Issue

- Stripe checkout sessions are created successfully
- Payments are processed by Stripe
- But webhooks are not triggering the database updates
- Points are not being added to user accounts

## Debugging Steps

### 1. Check Stripe Webhook Configuration

Go to your Stripe Dashboard → Webhooks and verify:

1. **Webhook URL**: Should be `https://your-domain.com/api/webhooks/stripe`
2. **Events**: Should include `checkout.session.completed`
3. **Webhook Secret**: Copy this for your environment variables

### 2. Check Environment Variables

Verify these are set correctly in your deployment:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Test Webhook Endpoint

Use the test endpoints I created:

```bash
# Test if webhook endpoint is accessible
curl -X POST https://your-domain.com/api/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Check current user status
curl "https://your-domain.com/api/test/points-purchase?userId=2f0a3034-dda6-4376-b01c-eb26fa690e67"
```

### 4. Manual Test Database Function

```bash
# Test the points purchase function directly
curl -X POST https://your-domain.com/api/test/points-purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "2f0a3034-dda6-4376-b01c-eb26fa690e67",
    "points": 550,
    "packageId": "premium",
    "sessionId": "cs_test_a1RojAMMaRqnWqL8XOrPCxyYYu4YyN2FAGzXvJbzO5L9YipVzbxNJ5TlOx"
  }'
```

## Quick Fix Options

### Option 1: Temporary Manual Processing

Use the test endpoint to manually process the points purchase:

1. Copy the sessionId from your log
2. Call the test endpoint with the user data
3. This will add the points immediately

### Option 2: Check Webhook Logs in Stripe

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check the "Attempts" tab for failed requests
4. Look for error messages

### Option 3: Verify Webhook Secret

The webhook might be failing due to signature verification. Check:

1. The webhook secret in Stripe matches your environment variable
2. The webhook URL is correct and accessible
3. The endpoint is not behind authentication

## Common Issues

1. **Wrong Webhook URL**: Make sure it's the production URL, not localhost
2. **Missing Environment Variables**: Webhook secret not set in production
3. **CORS Issues**: Webhook endpoint blocked by middleware
4. **Authentication**: Webhook endpoint requires auth (it shouldn't)

## Next Steps

1. Check Stripe webhook dashboard for failed attempts
2. Verify environment variables in your deployment
3. Test the webhook endpoint manually
4. Use the test endpoints to verify database functions work
