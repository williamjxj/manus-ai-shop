# 🚀 Quick Start - Sync to Production

**For macOS users ready to deploy to Vercel**

## ⚡ One-Command Deployment

```bash
# 1. Set up environment variables (interactive)
./scripts/setup-env-template.sh

# 2. Sync your local database to remote Supabase
./scripts/sync-to-remote.sh

# 3. Verify everything worked (optional)
./scripts/verify-remote-sync.sh
```

## 📋 What You Need Ready

### **Before Running Scripts:**
1. ✅ **Remote Supabase project** created at [supabase.com](https://supabase.com)
2. ✅ **Database password** (from when you created the project)
3. ✅ **API keys** from Supabase Dashboard > Settings > API
4. ✅ **Stripe account** with test/live keys
5. ✅ **Local Supabase running**: `supabase status`

### **What Gets Synced:**
- 📊 All database tables (products, orders, users, etc.)
- ⚙️ Payment processing functions
- 🔒 Security policies
- 🗂️ Image storage bucket
- 📈 Performance indexes

## 🎯 After Sync Success

### **Deploy to Vercel:**
```bash
# Commit your changes
git add .
git commit -m "Ready for production deployment"
git push origin main

# Deploy on Vercel with the environment variables from .env.local
```

### **Environment Variables for Vercel:**
Copy these from your generated `.env.local` to Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (update to your Vercel domain)

## 🆘 If Something Goes Wrong

### **Common Issues:**
- **Connection failed**: Check database password
- **Permission denied**: Use postgres user, not service role
- **Tables exist**: Normal, scripts handle this gracefully

### **Get Help:**
```bash
# Check what's in your remote database
./scripts/verify-remote-sync.sh

# Check local Supabase status
supabase status

# Check environment variables
cat .env.local
```

## ✅ Success Indicators

You'll know it worked when:
- ✅ Scripts complete without errors
- ✅ Verification shows all tables/functions exist
- ✅ Supabase Dashboard shows your tables
- ✅ Storage bucket `product-images` exists
- ✅ Your Vercel app works with remote database

**That's it! Your AI Shop is ready for production! 🎉**
