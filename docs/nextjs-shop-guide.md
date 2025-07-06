# 🛒 AI Shop - Complete Setup Guide

## ✅ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe (checkout + webhooks)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Setup

### 1. Local Development (Recommended)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Clone and setup
git clone <repository-url>
cd manus-ai-shop
npm install

# Start local Supabase
supabase start

# Run development server
npm run dev
```

**Local Services:**

- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323

## 🔐 Supabase Setup

- Create a [Supabase](https://supabase.com) project
- Enable Auth Providers:
  - Google
  - Twitter
  - Facebook

### Database Schema

**Core Tables:**

- `profiles` - User accounts & points balance
- `products` - AI-generated images for sale
- `cart_items` - Shopping cart contents
- `orders` - Purchase records
- `order_items` - Individual order items
- `points_transactions` - Points purchase/spend history

_Complete schema: `supabase/migrations/20241201000001_initial_schema.sql`_

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Key Features

### Authentication

- Email/password + social logins (Google, GitHub)
- Protected routes with middleware
- User session management

### Shopping Experience

- Product gallery with AI-generated images
- Real-time cart management
- Dual payment options (Stripe + Points)

### Upload Feature

- Authenticated users can upload images
- Set pricing and descriptions
- Automatic product creation

### Payment Processing

- Stripe checkout integration
- Points-based transactions
- Webhook handling for confirmations

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Environment Variables for Production

- Update `NEXT_PUBLIC_APP_URL` to your domain
- Configure Stripe webhook URL
- Set Supabase production URLs

## 📚 Additional Resources

- [Architecture Analysis](docs/.github/ARCHITECTURE_ANALYSIS.md)
- [Purchase Workflows](docs/.github/augment-workflows.md)
- [Local Development Setup](docs/.github/local-development-setup.md)
