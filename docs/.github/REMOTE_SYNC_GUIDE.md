# Remote Supabase Database Sync Guide

This guide will help you clean your remote Supabase database and sync it with your local schema.

## ⚠️ Important Warnings

- **This will delete all application data** (products, orders, cart items, etc.)
- **User accounts will be preserved** (auth.users table is not touched)
- **Make backups if you need to preserve any data**
- **Test in a staging environment first if possible**

## 📋 Prerequisites

1. Access to your remote Supabase dashboard
2. SQL Editor access in Supabase
3. Backup of any important data (if needed)

## 🚀 Step-by-Step Process

### Step 1: Access Remote Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Clean Remote Database

1. In the SQL Editor, create a new query
2. Copy the entire contents of `supabase/clean-remote-database.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the cleanup script
5. Verify the cleanup was successful by checking the output messages

### Step 3: Apply Local Schema to Remote

1. Create another new query in the SQL Editor
2. Copy the entire contents of `supabase/complete-database-setup.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the setup script
5. Verify the setup was successful by checking the output messages

### Step 4: Update Environment Variables

Update your `.env.local` to use remote Supabase:

```bash
# === REMOTE SUPABASE (for production) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Comment out local Supabase
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
# SUPABASE_SERVICE_ROLE_KEY=local-service-key
```

### Step 5: Configure OAuth for Remote

Update your OAuth providers to use remote URLs:

#### Google Cloud Console:

- **Authorized redirect URIs**: `https://your-project-id.supabase.co/auth/v1/callback`

#### GitHub OAuth App:

- **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`

#### Supabase Auth Settings:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Update **Site URL** to your production domain
3. Add your production domain to **Redirect URLs**

### Step 6: Test the Application

1. Restart your Next.js application: `npm run dev`
2. Test user authentication (existing users should still work)
3. Test OAuth login with Google and GitHub
4. Test product browsing (sample products should be available)
5. Test cart functionality
6. Test checkout process

## 🔍 Verification Checklist

After completing the sync, verify these items:

- [ ] All tables are created (8 tables total)
- [ ] Sample products are available (6 products)
- [ ] User authentication works
- [ ] OAuth login works (Google & GitHub)
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] RLS policies are active
- [ ] Functions are created and working

## 🛠️ Troubleshooting

### If OAuth doesn't work:

1. Check redirect URLs in OAuth providers
2. Verify Supabase auth settings
3. Clear browser cache and cookies

### If functions fail:

1. Check function permissions in Supabase dashboard
2. Verify all functions are created successfully
3. Check Supabase logs for errors

### If RLS policies block access:

1. Verify policies are created correctly
2. Check user authentication status
3. Review policy conditions

## 📝 What Gets Synced

### Tables Created:

- `profiles` - User profiles and points
- `products` - AI-generated images for sale
- `cart_items` - Shopping cart contents
- `orders` - Purchase orders
- `order_items` - Order line items
- `points_transactions` - Points history
- `subscriptions` - User subscriptions
- `webhook_events` - Stripe webhook tracking

### Functions Created:

- `handle_new_user()` - Auto-create user profiles
- `update_user_points_atomic()` - Thread-safe points updates
- `process_points_purchase()` - Handle points purchases
- `process_product_purchase()` - Handle product purchases
- `process_points_checkout()` - Points-based checkout
- `verify_database_setup()` - Setup verification

### Security Features:

- Row Level Security (RLS) on all user tables
- Proper access policies for data protection
- Service role restrictions for sensitive operations

## 🔄 Switching Between Local and Remote

To switch back to local development:

1. Comment out remote Supabase URLs in `.env.local`
2. Uncomment local Supabase URLs
3. Update OAuth redirect URLs back to localhost
4. Restart your application

## 📞 Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify all environment variables are correct
3. Ensure OAuth providers are configured properly
4. Test with a fresh browser session
