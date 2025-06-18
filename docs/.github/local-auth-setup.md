# Local Authentication Setup Guide

After migrating to local Supabase, you'll need to set up authentication since local Supabase has its own separate auth system.

## 🔐 Quick Solutions

### Option 1: Use Pre-created Test Accounts

I've already created test accounts for you:

**Test Account 1:**

- Email: `test@example.com`
- Password: `password123`

**Test Account 2:**

- Email: `dev@example.com`
- Password: `devpassword`

### Option 2: Create New Test Users (Easiest)

Use the helper script:

```bash
# Create default test user (test@example.com / password123)
./scripts/create-test-user.sh

# Create custom user
./scripts/create-test-user.sh your@email.com yourpassword

# Create multiple users
./scripts/create-test-user.sh admin@test.com admin123
./scripts/create-test-user.sh user@test.com user123
```

### Option 3: Use Supabase Studio

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **Authentication > Users**
3. Click **"Add User"**
4. Fill in:
   - Email: `your@email.com`
   - Password: `yourpassword`
   - ✅ **Email Confirm** (important!)
5. Click **"Create User"**

## 🌐 OAuth Setup (Google/GitHub)

Your OAuth providers are configured but need proper redirect URLs:

### For Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services > Credentials**
4. Edit your OAuth 2.0 Client
5. Add to **Authorized redirect URIs**:
   ```
   http://127.0.0.1:54321/auth/v1/callback
   ```

### For GitHub OAuth:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Edit your OAuth App
3. Set **Authorization callback URL**:
   ```
   http://127.0.0.1:54321/auth/v1/callback
   ```

## 🚨 Common Issues & Solutions

### Issue: "Database error querying schema"

**Solution:** Missing auth identities - FIXED! ✅

```bash
# This has been automatically fixed, but if you see this error again:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id, json_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, NOW(), u.created_at, u.updated_at
FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);
"
```

### Issue: Google OAuth "redirect_uri_mismatch" (Error 400)

**Solution:** Add local redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to "Authorized redirect URIs": `http://127.0.0.1:54321/auth/v1/callback`
5. Save changes

### Issue: "Invalid login credentials"

**Solution:** The user might not exist or email isn't confirmed

- Use the test accounts above
- Or create a new user with confirmed email

### Issue: "User not found" after login

**Solution:** The profile might not be created automatically

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE email = 'your@email.com';

-- Create profile manually if needed
INSERT INTO profiles (id, email, points)
VALUES ('your-user-id', 'your@email.com', 0);
```

### Issue: Can't access protected pages

**Solution:** Check if middleware is working

- Ensure you're logged in
- Check browser dev tools for auth errors
- Verify JWT token in localStorage

## 🔧 Advanced: Manual User Creation

If you need to create users programmatically:

```sql
-- Connect to local database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

-- Create user with confirmed email
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'newuser@example.com',
  crypt('newpassword', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email": "newuser@example.com"}',
  false,
  'authenticated',
  'authenticated'
);
```

## 📱 Testing Authentication Flow

1. **Start your app**: `npm run dev`
2. **Go to**: http://localhost:3000
3. **Try logging in** with test credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. **Check if profile is created** automatically
5. **Test protected routes** (cart, orders, etc.)

## 🔄 Switching Back to Cloud Auth

When you want to test with cloud authentication:

```bash
# Switch to cloud environment
./scripts/switch-env.sh cloud

# Restart your app
# Your cloud users will work again
```

## 📊 Verify Setup

Check that everything is working:

```bash
# Check local Supabase status
supabase status

# Check users in database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email, email_confirmed_at FROM auth.users;"

# Check profiles
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT email, points FROM profiles;"
```

## 🎯 Best Practices

1. **Use test accounts for development** - Don't use real emails
2. **Keep OAuth redirect URLs updated** - For both local and cloud
3. **Test auth flows regularly** - Ensure login/logout works
4. **Use meaningful test data** - Makes debugging easier
5. **Document test accounts** - Share with your team

## 🆘 Still Having Issues?

1. **Check Supabase logs**: `supabase logs`
2. **Verify environment**: `./scripts/switch-env.sh status`
3. **Reset local database**: `supabase db reset`
4. **Check browser console** for JavaScript errors
5. **Verify network requests** in browser dev tools

Your local authentication should now be working! 🎉
