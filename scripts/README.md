# 🚀 Supabase Sync Scripts

This folder contains scripts to sync your local Docker Supabase database to your remote Supabase cloud instance for Vercel deployment.

## 📁 Scripts Overview

| Script                  | Platform    | Purpose                  |
| ----------------------- | ----------- | ------------------------ |
| `sync-to-remote.sh`     | macOS/Linux | Main sync script (Bash)  |
| `verify-remote-sync.sh` | macOS/Linux | Verification script      |
| `setup-env-template.sh` | macOS/Linux | Environment setup helper |

## 🎯 What These Scripts Do

### **Sync Process:**

1. ✅ Extract current local Docker Supabase schema
2. ✅ Connect to your remote Supabase cloud instance
3. ✅ Create backup of remote database (optional)
4. ✅ Apply complete database schema to remote
5. ✅ Set up storage bucket for image uploads
6. ✅ Verify all components are properly synced

### **Components Synced:**

- 📊 **Database Tables**: profiles, products, cart_items, orders, etc.
- ⚙️ **Database Functions**: payment processing, points management
- 🔒 **Row Level Security**: user data protection policies
- 🗂️ **Storage Bucket**: product image storage with public access
- 📈 **Indexes**: performance optimization
- 🔧 **Triggers**: automatic user profile creation

## 🛠️ Prerequisites

### **Required:**

1. **PostgreSQL Client Tools** installed

   - **Linux**: `sudo apt-get install postgresql-client`
   - **macOS**: `brew install postgresql`
   - **Windows**: Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

2. **Local Supabase** running in Docker

   ```bash
   supabase start
   ```

3. **Remote Supabase Project** created at [supabase.com](https://supabase.com)

4. **Environment Variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### **Optional:**

- **Supabase CLI** for additional features
  ```bash
  npm install -g supabase
  ```

## 🚀 Usage Instructions

### **Step 1: Prepare Environment**

1. **Ensure local Supabase is running:**

   ```bash
   supabase status
   ```

2. **Verify `.env.local` exists** with remote Supabase credentials

3. **Get your remote database password** (set when creating Supabase project)

### **Step 2: Run Sync Script**

```bash
# Make script executable (if not already)
chmod +x scripts/sync-to-remote.sh

# Run sync
./scripts/sync-to-remote.sh
```

### **Step 3: Follow Interactive Prompts**

The script will ask for:

1. **Remote database password**
2. **Backup confirmation** (recommended: yes)
3. **Verification of connection details**

### **Step 4: Verify Sync (Optional)**

```bash
chmod +x scripts/verify-remote-sync.sh
./scripts/verify-remote-sync.sh
```

## 📋 What Gets Synced

### **Database Schema:**

```sql
-- Core Tables
✅ profiles (user accounts & points)
✅ products (AI images catalog)
✅ cart_items (shopping cart)
✅ orders (purchase records)
✅ order_items (order details)
✅ points_transactions (points history)
✅ webhook_events (Stripe webhooks)

-- Database Functions
✅ handle_new_user() (auto profile creation)
✅ update_user_points_atomic() (thread-safe points)
✅ process_points_purchase() (points buying)
✅ process_product_purchase() (product buying)
✅ process_points_checkout() (points spending)

-- Security & Performance
✅ Row Level Security policies
✅ Database indexes
✅ User triggers
```

### **Storage Setup:**

```
✅ product-images bucket (public access)
✅ Upload policies (authenticated users)
✅ File size limits (10MB)
✅ Allowed file types (images only)
```

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. Connection Failed**

```
❌ Failed to connect to remote database
```

**Solutions:**

- Check your database password
- Verify `.env.local` has correct Supabase URL
- Ensure your IP is not blocked by Supabase

#### **2. Permission Denied**

```
❌ Permission denied for schema public
```

**Solutions:**

- Use the database password (not service role key)
- Ensure you're using the postgres user

#### **3. Tables Already Exist**

```
❌ relation "profiles" already exists
```

**Solutions:**

- This is normal if you've run the script before
- The script handles existing tables gracefully

#### **4. Storage Bucket Issues**

```
⚠️ Storage bucket may be missing
```

**Solutions:**

- Check Supabase Dashboard > Storage
- Re-run just the storage setup:
  ```bash
  psql -h your-host -U postgres -d postgres -f supabase/setup-storage-bucket.sql
  ```

### **Manual Verification:**

If you want to manually check the sync:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

## 🎉 After Successful Sync

### **Your remote Supabase now has:**

- ✅ Complete database schema
- ✅ All necessary functions
- ✅ Security policies
- ✅ Storage bucket for uploads
- ✅ Sample data (if any)

### **Ready for Vercel Deployment:**

1. **Commit your changes:**

   ```bash
   git add .
   git commit -m "Add upload feature and sync database"
   git push origin main
   ```

2. **Deploy to Vercel** with environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **Test your deployed app:**
   - User registration/login
   - Product browsing
   - Cart functionality
   - Checkout process
   - Upload feature

## 🆘 Support

If you encounter issues:

1. **Check the script output** for specific error messages
2. **Verify your credentials** in `.env.local`
3. **Check Supabase Dashboard** for any issues
4. **Run the verification script** to identify missing components

The scripts are designed to be safe and can be run multiple times without causing issues.

**Happy deploying! 🚀**
