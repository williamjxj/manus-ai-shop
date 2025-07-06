# 🚀 Vercel Deployment

## 🔧 Setup

### Link Project

```bash
# Link to existing Vercel project
vercel link

# Deploy to production
vercel --prod
```

### Environment Variables

Set in **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Required for all environments
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🌐 Domain Configuration

### Deployment Types

- **Production**: Stable domain (custom or .vercel.app)
- **Preview**: Unique domain per deployment
- **Development**: localhost:3000

## 🐛 Troubleshooting

1. #### Update OAuth Base URL Environment Variable

   - Check your Vercel project environment variables for keys like `NEXTAUTH_URL` or `AUTH_URL`.
   - Set it to your **production domain with HTTPS**, for example:
     ```
     NEXTAUTH_URL=https://manus-ai-shop.vercel.app
     ```
   - Keep `http://localhost:3000` in your local `.env` file for local development.
   - Update these variables in the **Vercel Dashboard → Settings → Environment Variables** for the relevant environment (Production, Preview).

2. #### Update Google OAuth Redirect URIs

   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs.
   - Add your production callback URL to **Authorized redirect URIs**, e.g. `https://manus-ai-shop.vercel.app/api/auth/callback/google`
   - Also keep the localhost URI for local testing: `http://localhost:3000/api/auth/callback/google`

3. #### Redeploy Your Vercel App

4. #### Verify Your OAuth Sign-In Code Uses Environment Variables
   - Ensure your app’s OAuth redirect URLs are dynamically set using environment variables, for example:
     ```
     const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
     const redirectUri = `${baseUrl}/api/auth/callback/google`;
     ```

### Summary Table

| Issue                                 | Solution                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| OAuth callback redirects to localhost | Update `NEXTAUTH_URL` or `AUTH_URL` in Vercel environment variables to your production URL |
| Google OAuth redirect URI incorrect   | Add production redirect URI in Google Cloud Console OAuth credentials                      |
| Environment variables not applied     | Redeploy app after updating environment variables                                          |
| Hardcoded localhost URLs in code      | Use environment variables dynamically for redirect URLs                                    |
