# 💳 Stripe Configuration

## 🔧 Local Development

### Stripe CLI Setup

```bash
# Install and login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Get Webhook Secret

The CLI will display the webhook signing secret:

```bash
whsec_1234567890abcdef...
```

Add this to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## 🚀 Production Setup

### 1. Webhook Endpoint

- **URL**: `https://your-domain.com/api/webhooks/stripe`
- **Events**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 2. Environment Variables

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🧪 Testing

### Local Testing

```bash
# Test webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

### Debug Endpoints

- `GET /api/debug/webhook-status` - Check configuration
- `POST /api/test/webhook` - Test webhook processing

### For Local Development

If testing locally with npm run dev, your webhook URL would be something like:

- https://your-ngrok-url.ngrok.io/api/webhooks/stripe (if using ngrok)
- Or use Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe

### For Production (Vercel)

- Your webhook URL should be: https://your-app.vercel.app/api/webhooks/stripe
- Make sure to add the STRIPE_WEBHOOK_SECRET to your Vercel environment variables too

### Stripe CLI

- `stripe logs tail`
- `checkout.session.completed`,
  `payment_intent.succeeded`
- admin@adultaigallery.com / 123456
