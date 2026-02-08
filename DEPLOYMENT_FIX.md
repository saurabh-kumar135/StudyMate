# CORS Error Fix for Render Deployment

## Problem

Your backend on Render is rejecting requests from your Vercel frontend with "Not allowed by CORS" error.

## Root Cause

The CORS configuration in `app.js` is working correctly, but you need to set the proper environment variables on Render.

## Solution Steps

### Step 1: Set Environment Variables on Render

Go to your Render dashboard → Your StudyMate service → Environment tab, and add/update these variables:

```
NODE_ENV=production
FRONTEND_URL=https://your-actual-frontend-url.vercel.app
MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=your-session-secret
GEMINI_API_KEY=your-gemini-api-key
RESEND_API_KEY=your-resend-api-key
```

> **⚠️ CRITICAL: RESEND_API_KEY is REQUIRED!**
>
> Without `RESEND_API_KEY`, signup will fail with "Signup failed. Please try again" because the verification email cannot be sent.
>
> Get your Resend API key from: https://resend.com/api-keys

**IMPORTANT**: Replace `https://your-actual-frontend-url.vercel.app` with your ACTUAL Vercel deployment URL (e.g., `https://studymate-abc123.vercel.app`)

### Step 2: Verify CORS Configuration

The current `app.js` already has the correct CORS setup:

- ✅ Allows any `.vercel.app` domain (line 49)
- ✅ Allows the `FRONTEND_URL` from environment variable (line 41)
- ✅ Credentials enabled for session cookies (line 61)

### Step 3: Redeploy on Render

After setting the environment variables:

1. Render will automatically redeploy
2. OR manually trigger a redeploy from the Render dashboard

### Step 4: Update Frontend Environment Variable

On Vercel, make sure your frontend has the correct backend URL:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

Replace with your actual Render backend URL.

### Step 5: Redeploy Frontend on Vercel

After updating the environment variable on Vercel:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add/update `VITE_API_URL`
3. Redeploy your frontend

## Quick Checklist

- [ ] Render: Set `NODE_ENV=production`
- [ ] Render: Set `FRONTEND_URL` to your Vercel URL
- [ ] Render: Set all other required environment variables (MongoDB, API keys, etc.)
- [ ] Render: Redeploy the backend
- [ ] Vercel: Set `VITE_API_URL` to your Render backend URL
- [ ] Vercel: Redeploy the frontend
- [ ] Test: Visit your Vercel frontend and check if API calls work

## Testing

After deployment, open your browser console on the Vercel frontend and check:

1. Network tab should show successful API calls (200 status)
2. No CORS errors in console
3. Backend logs on Render should NOT show "CORS Error - Origin not allowed"

## Alternative: More Permissive CORS (Not Recommended for Production)

If you want to temporarily allow ALL origins for testing (NOT recommended for production):

Replace lines 44-62 in `app.js` with:

```javascript
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
```

But this is insecure. The current configuration is better.

## Need More Help?

If the error persists:

1. Check Render logs for the exact error message
2. Verify the `Origin` header in the failed request matches your Vercel URL
3. Make sure cookies are enabled in your browser
