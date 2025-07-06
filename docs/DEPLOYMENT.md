# 🚀 Deployment Guide

## 🏠 Local Development

### Prerequisites
- Node.js 18+
- Supabase CLI

### Quick Start
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

### Local Services
- **App**: http://localhost:3000
- **Supabase Studio**: http://127.0.0.1:54323
- **Database**: PostgreSQL on port 54322

### Environment Switching
```bash
# Switch between environments
./scripts/switch-env.sh local   # Local development
./scripts/switch-env.sh cloud   # Production/cloud
./scripts/switch-env.sh status  # Check current
```

---

## ☁️ Production Deployment

### Vercel (Recommended)

#### 1. Setup Repository
- Connect GitHub repository to Vercel
- Enable automatic deployments
- Configure build settings (Next.js preset)

#### 2. Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### 3. Domain Configuration
- Add custom domain in Vercel settings
- Update `NEXT_PUBLIC_APP_URL` to match your domain
- Configure SSL (automatic with Vercel)

---

## 🗄 Database Setup

### Supabase Production

#### 1. Create Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Note down project URL and API keys

#### 2. Run Migrations
```sql
-- Copy and run in Supabase SQL Editor
-- File: supabase/migrations/20241201000001_initial_schema.sql
```

#### 3. Configure Authentication
- **Providers**: Enable Google, GitHub
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: 
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/**`

#### 4. Storage Setup
- Create `products` bucket for image uploads
- Set appropriate policies for authenticated users

---

## 💳 Stripe Configuration

### Production Setup

#### 1. Account Setup
- Create Stripe account
- Complete account verification
- Switch to live mode

#### 2. API Keys
- Get live publishable key: `pk_live_...`
- Get live secret key: `sk_live_...`
- Update environment variables

#### 3. Webhook Configuration
- **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
- **Events to send**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- **Webhook Secret**: Copy to `STRIPE_WEBHOOK_SECRET`

---

## 🔧 OAuth Setup

### Google OAuth

#### 1. Google Cloud Console
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create/select project
- Enable Google+ API

#### 2. OAuth Credentials
- Create OAuth 2.0 Client ID
- **Authorized redirect URIs**:
  - `https://your-project.supabase.co/auth/v1/callback`
- Copy Client ID and Secret to Supabase

### GitHub OAuth

#### 1. GitHub Settings
- Go to GitHub → Settings → Developer settings → OAuth Apps
- Create new OAuth App

#### 2. Application Settings
- **Homepage URL**: `https://your-domain.com`
- **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
- Copy Client ID and Secret to Supabase

---

## 🔍 Monitoring & Debugging

### Health Checks
- **App Status**: `https://your-domain.com/api/debug/webhook-status`
- **Database Test**: `https://your-domain.com/api/test-local-db`
- **Webhook Test**: `https://your-domain.com/api/test/webhook`

### Logging
- Vercel Function Logs
- Supabase Dashboard Logs
- Stripe Dashboard Events

### Common Issues

#### Webhook Failures
1. Check webhook URL is accessible
2. Verify webhook secret matches
3. Check Stripe event types are configured
4. Review function logs for errors

#### Authentication Issues
1. Verify OAuth redirect URLs
2. Check Supabase auth configuration
3. Confirm environment variables are set
4. Test with different providers

#### Database Connection
1. Check Supabase service role key
2. Verify RLS policies are correct
3. Test database functions
4. Review migration status

---

## 📊 Performance Optimization

### Vercel Settings
- Enable Edge Functions where applicable
- Configure caching headers
- Use Vercel Analytics

### Database Optimization
- Add appropriate indexes
- Monitor query performance
- Use connection pooling

### CDN & Assets
- Optimize images with Next.js Image component
- Use Vercel's built-in CDN
- Enable compression
