
# 🛒 Next.js AI Image Store – Supabase + Stripe + Points + Social Auth

## ✅ Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: TailwindCSS
- **Backend/DB/Auth**: Supabase
- **Payments**: Stripe (cards, wallets), Points system
- **Auth Providers**: Credentials, Google, Twitter, Facebook

---

## 📦 Project Setup

```bash
npx create-next-app@latest my-shop --app
cd my-shop
npm install tailwindcss supabase @supabase/auth-helpers-nextjs stripe
npx tailwindcss init -p
```

- Configure Tailwind in `tailwind.config.js`
- Import styles in `globals.css`

---

## 🔐 Supabase Setup

- Create a [Supabase](https://supabase.com) project
- Enable Auth Providers:
  - Google
  - Twitter
  - Facebook

### Supabase Tables

```sql
-- Products (AI images)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  image_url text,
  price_cents int
);

-- Cart items
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  quantity int DEFAULT 1
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  total_cents int,
  paid boolean DEFAULT false
);

-- Points transactions
CREATE TABLE points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount int,
  created_at timestamp DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  plan text,
  status text,
  current_period_end timestamp
);
```

### Supabase Client

```js
// lib/supabase.js
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
export const supabase = createBrowserClient()
```

---

## 👥 Auth Pages

- `/login` and `/signup`
- Use Supabase Auth helpers
- Social login buttons (Google, Twitter, Facebook)
- Protect routes with `middleware.ts`

---

## 🖼️ Product List

- Page: `/products`
- Display products with `Add to Cart` button

---

## 🛍️ Shopping Cart

- Table: `cart_items`
- Show selected products, quantity, total
- Allow remove, update quantity

---

## 💰 Points System

- Auth users can purchase points
- `points_transactions` records:
  - Stripe payments
  - Manual deductions (for purchases)

---

## 💳 Checkout Options

### 1. Stripe Payment
- Create a checkout session via `/api/checkout`
- Use Stripe client

```ts
import { loadStripe } from '@stripe/stripe-js'
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

### 2. Use Points
- Check user's points balance
- Deduct points if sufficient
- Mark order as paid

---

## 📦 Subscription Plans

- Stripe subscriptions (e.g., 1000 points/month)
- Supabase `subscriptions` table
- Sync with webhooks

---

## ⚙️ Webhooks (Optional)

- Stripe webhook to listen to:
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`

---

## 🗂️ Suggested Folder Structure

```
src/
  app/
    products/
    cart/
    checkout/
    login/
    signup/
  components/
    AuthButtons.tsx
    ProductCard.tsx
    Cart.tsx
  lib/
    supabase.js
    stripe.js
```

---

## ✨ Enhancements

- `shadcn/ui` or `radix-ui` for UI
- Persist cart in Supabase
- Responsive design with Tailwind
