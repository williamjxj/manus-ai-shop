## *.vercel.app

- Project Id: prj_vSRfyYXGBw023BtPMS6bgimTEjzI

| Deployment Type | Domain Behavior |
| --- | --- |
| Production | Same domain every deploy (custom or default) |
| Preview | Unique domain per deployment (changes each time) |
| Localhost | Localhost URL, no Vercel domain |
| | |

| Env Vars           | Notes                                                                                      |
|--------------------|--------------------------------------------------------------------------------------------|
| APP_URL            | Typically used as the base URL of your app; may be used internally for API calls or config.|
| NEXT_PUBLIC_APP_URL | Publicly exposed app URL available on both server and client; used in frontend code.       |
| AUTH_URL           | Alias or alternative to `NEXTAUTH_URL`; base URL for authentication flows in some setups.  |
| NEXTAUTH_URL       | Base URL for NextAuth.js authentication; used to construct OAuth callback and redirect URLs.|
|                    |                                                                                            |

```bash
$ vercel link
# created .vercel/

$ vercel env ls preview

# Deploy with Environment Variables
$ vercel -e NODE_ENV=production
$ vercel --prod
```

## BUGS & FIX

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
   - Also keep the localhost URI for local testing:  `http://localhost:3000/api/auth/callback/google`  

3. #### Redeploy Your Vercel App

4. #### Verify Your OAuth Sign-In Code Uses Environment Variables
   - Ensure your app’s OAuth redirect URLs are dynamically set using environment variables, for example:  
     ```
     const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
     const redirectUri = `${baseUrl}/api/auth/callback/google`;
     ```

### Summary Table

| Issue                                  | Solution                                                                                   |
|---------------------------------------|--------------------------------------------------------------------------------------------|
| OAuth callback redirects to localhost | Update `NEXTAUTH_URL` or `AUTH_URL` in Vercel environment variables to your production URL |
| Google OAuth redirect URI incorrect   | Add production redirect URI in Google Cloud Console OAuth credentials                       |
| Environment variables not applied     | Redeploy app after updating environment variables                                          |
| Hardcoded localhost URLs in code      | Use environment variables dynamically for redirect URLs                                   |
