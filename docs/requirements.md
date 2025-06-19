## 我的最初给manus的提示词，项目从这里开始

please use latest next.js app, to implement a purchase checkout, payment app:

1. Use the latest Next.js with Supabase and Tailwind CSS.
2. Implement Supabase authentication with email/password and social logins (Google, Twitter, Facebook).
3. Display products (mock AI images) for selection and add to shopping cart.
4. Enable shopping cart checkout functionality.
5. Allow logged-in users to purchase points through subscription plans.
6. Support payments via Stripe and user points for purchases.
7. Accept payments through Stripe and digital wallets.

## 云部署所用到的相关资源

### console.cloud.google.com

- https://iilqncqvslmlzuzkaehw.supabase.co/auth/v1/callback

### GitHub （项目托管）

Developers Settings -> OAuth Apps

### Supabase （数据库和storage）

Auth Providers Enable:

- Google
- GitHub

### Vercel （云部署）https://manus-ai-shop.vercel.app/

### Stripe 付费

### Paypal

### Digital Wallets

### Crypto Wallets


### Subscriptions Table

Intended Purpose:
- Recurring subscription plans (basic, premium, pro)
- Monthly/yearly billing through Stripe subscriptions
- Automatic points allocation (e.g., 1000 points/month)
- Subscription management (active, cancelled, past_due, incomplete)

What's Missing:
❌ No subscription plans UI
❌ No Stripe subscription webhook handlers
❌ No subscription management pages
❌ No automatic points allocation
❌ No subscription status checking

❌ Subscription plans (basic, premium, pro)
❌ Recurring billing
❌ Automatic points allocation
❌ Subscription management UI
❌ Subscription webhook handlers


What's Currently Working:
✅ One-time points purchases
✅ One-time product purchases
✅ Cart-based shopping
