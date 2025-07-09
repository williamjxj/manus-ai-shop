# 🗄 Supabase Configuration

## 🏠 Local Development

### Start Local Supabase

```bash
# Install CLI
brew install supabase/tap/supabase

# Start services
supabase start

# Stop services
supabase stop
```

### Local Services

- **Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321
- **Database**: localhost:54322

### Test Accounts

- **Email**: test@example.com, **Password**: password123
- **Email**: dev@example.com, **Password**: devpassword

## ☁️ Production Setup

### Authentication Configuration

Navigate to: **Supabase Dashboard → Authentication → URL Configuration**

```bash
# Site URL
https://your-domain.com

# Redirect URLs
https://your-domain.com/auth/callback
https://your-domain.com/**
http://localhost:3000/auth/callback  # For local testing
http://localhost:3000/**
```

### OAuth Providers

**Google & GitHub Setup:**

- Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
- Configure in respective provider dashboards
- Add Client ID/Secret to Supabase

## 🔧 Database Management

### Schema Migration

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20241201000001_initial_schema.sql
```

### Backup & Restore

```bash
# Dump schema
docker exec -t supabase-db pg_dump -U postgres -s > schema_dump.sql

# Clean restart
supabase stop
docker volume prune
supabase start
```

## 🧪 Testing

### Debug Endpoints

- `GET /api/test-local-db` - Test database connection
- `GET /api/debug/webhook-status` - Check configuration

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # Local
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## static CDN & Assets

- update products: https://your-domain.supabase.co/storage/v1/object/public/images/products/1752066844087_otxk3qizdcl.jpg
- homepage video: https://your-domain.supabase.co/storage/v1/object/public/cdnmedia/
