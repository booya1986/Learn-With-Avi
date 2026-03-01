# Google OAuth Setup Guide

Enable "Sign in with Google" for students on LearnWithAvi.

## Overview

Google OAuth allows students to create accounts and log in using their Google credentials. This guide walks through:

1. Creating OAuth credentials in Google Cloud Console
2. Configuring Vercel environment variables
3. Testing the setup
4. Troubleshooting common issues

## Prerequisites

- Access to a Google account
- Vercel project deployed and live
- Admin access to Vercel project settings

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: `LearnWithAvi` (or your preferred name)
5. Click "CREATE"
6. Wait for project creation to complete (1-2 minutes)

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" (or "Google Identity")
3. Click "Google+ API"
4. Click "ENABLE"
5. You'll see confirmation: "Google+ API is enabled"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted: "To create an OAuth client ID, you must first create an OAuth consent screen"
   - Click "CREATE CONSENT SCREEN"
   - Choose "External" (for unrestricted users)
   - Click "CREATE"

### Configure OAuth Consent Screen

1. **App Information**
   - App name: `LearnWithAvi`
   - User support email: Your email
   - Developer contact: Your email

2. **Scopes**
   - Click "ADD OR REMOVE SCOPES"
   - Search for and add: `openid`, `email`, `profile`
   - Click "UPDATE"

3. **Test Users** (Optional for production)
   - Click "ADD USERS"
   - Add test email addresses if needed

4. **Summary**
   - Review settings
   - Click "SAVE AND CONTINUE" → "SAVE AND CONTINUE" → "BACK TO DASHBOARD"

### Create OAuth Client ID

1. Go back to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: Select "Web application"
4. Name: `LearnWithAvi - Web Client`

5. **Authorized redirect URIs**
   - Click "ADD URI"
   - Add both:
     ```
     https://learn-with-avi.vercel.app/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google
     ```
   - (Adjust `learn-with-avi.vercel.app` if using a different domain)
   - Click "CREATE"

6. **Copy Your Credentials**
   - A popup will show your credentials
   - Copy:
     - `Client ID` (starts with numbers and ends with `googleusercontent.com`)
     - `Client Secret` (long alphanumeric string)
   - Store these securely — you'll need them in the next step

## Step 4: Add Credentials to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/)
2. Select your LearnWithAvi project
3. Click "Settings" → "Environment Variables"
4. Add two new variables:

   **Variable 1:**
   - Name: `GOOGLE_CLIENT_ID`
   - Value: Paste the Client ID from step 3
   - Environments: Check "Production", "Preview", "Development"
   - Click "Save"

   **Variable 2:**
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: Paste the Client Secret from step 3
   - Environments: Check "Production", "Preview", "Development"
   - Click "Save"

5. **Redeploy your application**
   - Go to "Deployments"
   - Click the most recent deployment
   - Click "Redeploy"
   - Wait for the redeploy to complete

## Step 5: Verify Setup (Local Development)

Test on your local machine before production:

```bash
# 1. Copy env vars from Vercel to .env.local
# (Or set them in your terminal)
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000/en/auth/login
# 4. You should see "Sign in with Google" button
# 5. Click it and complete the OAuth flow
```

### Check Health Endpoint

Health endpoint shows Google OAuth status:

```bash
curl http://localhost:3000/api/v1/health
```

Look for the `auth.googleOAuth` field in the response. It should show:
- `"configured"` if credentials are set
- `"not_configured"` if credentials are missing

Example response:
```json
{
  "status": "healthy",
  "services": [
    {
      "name": "Google OAuth",
      "status": "healthy",
      "message": "Google OAuth configured"
    }
  ]
}
```

## Step 6: Production Testing

After redeploy, test on production:

1. Go to `https://learn-with-avi.vercel.app/en/auth/login`
2. Click "Sign in with Google"
3. Complete Google login
4. You should be redirected to your student dashboard

## Troubleshooting

### Issue: "Sign in with Google" button doesn't appear

**Possible causes:**
- Environment variables not set
- Application not redeployed after adding env vars
- Browser cache (try incognito mode)

**Solution:**
```bash
# Check if env vars are set
curl https://learn-with-avi.vercel.app/api/v1/health | jq '.services[] | select(.name == "Google OAuth")'

# Should show "configured" status
```

### Issue: "Redirect URI mismatch" error

**Possible causes:**
- Vercel domain is different from credentials redirect URI
- Typo in redirect URI configuration

**Solution:**
1. Check your actual Vercel domain (Settings → Domains)
2. Update Google Cloud Console credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click the OAuth client ID
   - Update "Authorized redirect URIs" to match your Vercel domain
   - Example: `https://your-custom-domain.com/api/auth/callback/google`

### Issue: Application not redeploying

**Solution:**
- Wait a few minutes after adding env vars (they need to propagate)
- Click "Redeploy" manually in Vercel Deployments
- Check deployment logs for errors

### Issue: "403 - Invalid Client" error

**Possible causes:**
- Client ID or Client Secret copied incorrectly
- Credentials are for a different Google Cloud project
- Credentials are expired/revoked

**Solution:**
1. Verify credentials in Google Cloud Console
2. Copy them again carefully
3. Update Vercel env vars
4. Redeploy

## Health Check Details

The `/api/v1/health` endpoint includes authentication status:

### Request (Authenticated Admin)

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  https://learn-with-avi.vercel.app/api/v1/health
```

### Response

```json
{
  "status": "healthy",
  "services": [
    {
      "name": "Google OAuth",
      "status": "healthy",
      "message": "Google OAuth configured"
    },
    {
      "name": "Anthropic Claude API",
      "status": "healthy",
      "message": "API key configured"
    }
  ]
}
```

## Next Steps

1. **Promote to other students**
   - Share the login link: `https://learn-with-avi.vercel.app/en/auth/login`
   - Recommend using Google OAuth for faster signup

2. **Monitor sign-ups**
   - Check Vercel Analytics: "Settings" → "Analytics"
   - Monitor error rate

3. **Customize OAuth consent**
   - Edit consent screen: "APIs & Services" → "OAuth consent screen"
   - Add logo and custom branding

## Security Considerations

- Never commit Google credentials to version control
- Rotate Client Secret if compromised
- Use different credentials for dev/production
- Monitor failed login attempts (via Sentry)

## Additional Resources

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Last Updated**: 2026-03-01
**Status**: Production Ready
