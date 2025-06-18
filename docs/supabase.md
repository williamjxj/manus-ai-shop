```text
Supabase Dashboard
├── Authentication (left sidebar)
    ├── Users
    ├── Policies
    ├── Providers
    └── URL Configuration ← Click here
        ├── Site URL: [https://manus-ai-shop.vercel.app]
        └── Redirect URLs:
            [https://manus-ai-shop.vercel.app/auth/callback]
            [https://manus-ai-shop.vercel.app/**]
            [http://localhost:3000/auth/callback]
            [http://localhost:3000/**]
```

## Local Testing accounts

- Test Account 1: Email: test@example.com, Password: password123

- Test Account 2: Email: dev@example.com, Password: devpassword

## Local Docker Supabase OAuth

When using local Supabase with Docker, OAuth providers (Google/GitHub) need to redirect to your local Supabase instance (127.0.0.1:54321), not directly to your Next.js app. Then Supabase handles the redirect back to your app.

### Key Points for Local Supabase OAuth:

1. `OAuth providers redirect to Supabase` (localhost:54321/auth/v1/callback), not your app
2. `Supabase then redirects to your app` (localhost:3000/auth/callback)
3. `Use localhost consistently` instead of mixing 127.0.0.1 and localhost
4. `Both Google and GitHub need the same redirect URI`: http://localhost:54321/auth/v1/callback

### Cleaned Up Environment Variables

- Removed redundant environment variables: AUTH_URL, NEXTAUTH_URL, NEXT_PUBLIC_SITE_URL
- Kept only the essential `NEXT_PUBLIC_APP_URL`
