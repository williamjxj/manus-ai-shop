# 🛠️ Production Scripts

Essential scripts for deployment and maintenance of the Adult Products Gallery.

## 📁 Scripts Overview

| Script                    | Platform    | Purpose                          |
| ------------------------- | ----------- | -------------------------------- |
| `test-build.js`           | Node.js     | Production build testing         |
| `approve-product.js`      | Node.js     | Approve products for public view |
| `create-admin-account.js` | Node.js     | Create admin user accounts       |
| `create-test-user.js`     | Node.js     | Create test user for development |
| `sync-to-remote.sh`       | macOS/Linux | Sync local DB to remote Supabase |
| `verify-remote-sync.sh`   | macOS/Linux | Verify remote sync status        |
| `setup-env-template.sh`   | macOS/Linux | Environment setup helper         |

## 🎯 Script Functions

### **Production Build Testing (`test-build.js`):**

- TypeScript type checking
- ESLint validation
- Next.js build compilation
- Automated deployment verification

### **Product Management:**

- **`approve-product.js`**: Approve products for public viewing
- **`create-admin-account.js`**: Set up admin user accounts
- **`create-test-user.js`**: Create development test users

### **Database Sync (`sync-to-remote.sh`):**

- Extract local Supabase schema
- Connect to remote Supabase instance
- Apply complete database schema
- Set up storage buckets
- Verify sync completion

### **Components Managed:**

- 📊 **Database Schema**: Core tables and relationships
- 🔒 **Security Policies**: Row Level Security (RLS)
- 🗂️ **Storage Buckets**: Media file storage
- 📈 **Performance**: Indexes and optimization

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
