# AI Shop - Next.js E-commerce Platform

A modern e-commerce application for purchasing AI-generated images with dual payment options (Stripe & Points system).

## ✨ Key Features

- 🔐 **Authentication**: Email/password + social logins (Google, GitHub)
- 🛒 **Shopping Cart**: Real-time cart management with persistent storage
- 💳 **Dual Payments**: Stripe checkout + Points-based transactions
- 🪙 **Points System**: Buy points packages, spend on products
- 🎨 **AI Art Gallery**: Browse and purchase AI-generated images
- 📤 **Upload Feature**: Authenticated users can upload and sell images
- 📱 **Responsive Design**: Mobile-first with Tailwind CSS
- 🔒 **Secure**: Row-level security (RLS) with Supabase

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe (webhooks + checkout)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Local Development (Recommended)

```bash
# 1. Install Supabase CLI
brew install supabase/tap/supabase

# 2. Clone and setup
git clone <repository-url>
cd manus-ai-shop
npm install

# 3. Start local Supabase
supabase start

# 4. Run development server
npm run dev
```

**Local Services:**

- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323

### Environment Switching

```bash
# Switch between local/cloud environments
./scripts/switch-env.sh local   # Local development
./scripts/switch-env.sh cloud   # Production/cloud
./scripts/switch-env.sh status  # Check current
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

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes (checkout, webhooks)
│   ├── auth/           # Authentication pages
│   ├── products/       # Product gallery
│   ├── cart/           # Shopping cart
│   ├── points/         # Points management
│   └── upload/         # Image upload feature
├── components/         # Reusable UI components
├── contexts/          # React contexts (CartContext)
└── lib/               # Utilities (Supabase, Stripe)

docs/                   # Documentation
├── DEPLOYMENT.md       # Deployment guide
├── FEATURES.md         # Feature documentation
├── debug-checklist.md  # Troubleshooting guide
└── *.md               # Other documentation

supabase/              # Database & SQL files
├── migrations/        # Database migrations
├── *.sql             # SQL scripts and utilities
└── config.toml       # Supabase configuration

scripts/              # Utility scripts
├── *.sh             # Shell scripts
└── *.js             # Node.js scripts
```

## 🗄 Database Schema

**Core Tables:**

- `profiles` - User accounts & points balance
- `products` - AI-generated images for sale
- `cart_items` - Shopping cart contents
- `orders` - Purchase records
- `points_transactions` - Points purchase/spend history

## 🚀 Deployment

**Vercel (Recommended):**

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

**Environment Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide
- **[FEATURES.md](docs/FEATURES.md)** - Feature documentation
- **[debug-checklist.md](docs/debug-checklist.md)** - Troubleshooting guide
- **[stripe.md](docs/stripe.md)** - Stripe integration details
- **[supabase.md](docs/supabase.md)** - Supabase setup and usage

## 🗄️ Database & SQL Files

All SQL files are organized in the `supabase/` folder:

- **`migrations/`** - Database schema migrations
- **`*.sql`** - Utility scripts and setup files
- **`config.toml`** - Supabase configuration

## 🔒 Security

- Row Level Security (RLS) policies
- Protected API routes
- Secure webhook verification
- Environment variable protection
