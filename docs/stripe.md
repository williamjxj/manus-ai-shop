## Stripe CLI 

### (1) Local STRIPE_WEBHOOK_SECRET

```bash
❯ stripe login

# get webhook signing secret: STRIPE_WEBHOOK_SECRET
stripe listen --forward-to localhost:3000/api/webhooks
```

### (2) Vercel STRIPE_WEBHOOK_SECRET

- https://dashboard.stripe.com/test/workbench/webhooks
- Create webhook endpoint in Stripe Dashboard, copy `Signing Secret` from endpoint details
- Vercel Dashboard → Environment Variables

#### Add webhook endpoint

```text
目的地详情
接收端 ID: 端点 URL:
https://memorable-excellence.ngrok.io/api/webhooks/stripe
描述: API 版本: 2025-02-24.acacia
侦听:  5 events
显示: 签名密钥: whsec_7PrOa8KqQaO3OsJJgTW2JThYDXITwZz7
```

#### Webhook `memorable-excellence` Endpoint (5 events)

```text
- checkout.session.completed
- customer.subscription.updated
- invoice.paid
- payment_intent.succeeded
- charge.failed
```
