# AI Shop - Next.js E-commerce Application

A comprehensive e-commerce application built with Next.js, Supabase, and Stripe for purchasing AI-generated images.

## Features

- 🔐 **Authentication**: Email/password and social logins (Google, GitHub)
- 🛒 **Shopping Cart**: Add, remove, and manage cart items
- 💳 **Payment Processing**: Stripe integration for card payments
- 🪙 **Points System**: Purchase and use points for transactions
- 🎨 **AI Art Gallery**: Browse and purchase AI-generated images
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payments**: Stripe
- **Deployment**: Ready for Vercel/Netlify

## Setup Instructions

### 🚀 Quick Start with Local Development (Recommended)

For faster development and testing, use local Supabase:

```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Start local Supabase
supabase start

# 3. Install dependencies and start development
npm install
npm run dev
```

The project is pre-configured for local development! 🎉

**Local Services:**

- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323
- Test endpoint: http://localhost:3000/api/test-local-db

For detailed local development setup, see [Local Development Guide](docs/local-development-setup.md).

### 🔄 Environment Switching

Use the environment switcher script:

```bash
# Check current environment
./scripts/switch-env.sh status

# Switch to local development
./scripts/switch-env.sh local

# Switch to cloud/production
./scripts/switch-env.sh cloud
```

### 1. Environment Variables (Manual Setup)

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Enable authentication providers in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google and GitHub OAuth
4. Copy your project URL and anon key to `.env.local`

### 3. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your test API keys from the Stripe Dashboard
3. Set up a webhook endpoint pointing to `/api/webhooks/stripe`
4. Copy the webhook secret to `.env.local`

### 4. Installation

```bash
npm install
npm run dev
open http://localhost:3000
```

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles with points balance
- `products` - AI-generated image products
- `cart_items` - Shopping cart items
- `orders` - Purchase orders
- `order_items` - Individual items in orders
- `points_transactions` - Points purchase/spend history
- `subscriptions` - Subscription plans (future feature)

## API Routes

- `/api/checkout` - Main checkout processing
- `/api/checkout/points` - Points package purchases
- `/api/webhooks/stripe` - Stripe webhook handler

## Pages

- `/` - Homepage
- `/login` - User login
- `/signup` - User registration
- `/products` - Product gallery
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/points` - Points management
- `/checkout/success` - Payment success

## Features in Detail

### Authentication

- Email/password authentication
- Social login with Google and GitHub
- Protected routes with middleware
- User session management

### Shopping Experience

- Product browsing with categories
- Add to cart functionality
- Cart management (update quantities, remove items)
- Dual payment options (Stripe or Points)

### Payment Processing

- Stripe Checkout integration
- Points-based transactions
- Webhook handling for payment confirmation
- Order tracking and history

### Points System

- Purchase points packages
- Use points for product purchases
- Transaction history
- Balance management

## Deployment

The application is ready for deployment on platforms like Vercel or Netlify. Make sure to:

1. Set up environment variables in your deployment platform
2. Configure Supabase for production
3. Update Stripe webhook URLs for production
4. Set the correct `NEXT_PUBLIC_APP_URL`

## Security Features

- Row Level Security (RLS) in Supabase
- Protected API routes
- Secure payment processing
- Environment variable protection

## Future Enhancements

- Subscription plans
- Order history page
- Product reviews and ratings
- Admin dashboard
- Email notifications
- Download functionality for purchased images

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.

```bash
$ supabase
$ stripe
$ vercel
```
