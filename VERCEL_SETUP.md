# How to Connect Render Backend to Vercel Frontend

## Step-by-Step Guide

### Step 1: Get Your Render Backend URL

Your Render backend URL should look like:

```
https://your-service-name.onrender.com
```

For example:

```
https://studymate-backend.onrender.com
```

### Step 2: Add Environment Variable to Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your StudyMate project

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

3. **Add the Backend URL**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com` (your actual Render URL)
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"

### Step 3: Redeploy Your Frontend

After adding the environment variable, you need to redeploy:

**Option 1: Automatic Redeploy (Recommended)**

1. Go to "Deployments" tab
2. Click on the latest deployment
3. Click the three dots (•••) menu
4. Click "Redeploy"
5. Confirm the redeploy

**Option 2: Push a New Commit**

```bash
cd /path/to/StudyMate/client
git commit --allow-empty -m "Trigger redeploy with new env vars"
git push origin main
```

### Step 4: Verify the Connection

1. **Check Build Logs**
   - Go to Vercel → Deployments → Latest deployment
   - Check the build logs for any errors

2. **Test the Frontend**
   - Visit your Vercel URL: `https://your-app.vercel.app`
   - Open browser console (F12)
   - Try to signup or login
   - Check Network tab to see if API calls are going to your Render backend

3. **Expected Behavior**
   - API calls should go to: `https://your-backend.onrender.com/api/...`
   - You should see responses from your backend
   - No CORS errors in console

---

## Environment Variable Format

### ✅ Correct Format:

```
VITE_API_URL=https://studymate-backend.onrender.com
```

### ❌ Wrong Formats:

```
VITE_API_URL=https://studymate-backend.onrender.com/    (trailing slash)
VITE_API_URL=http://studymate-backend.onrender.com      (http instead of https)
VITE_API_URL="https://studymate-backend.onrender.com"   (quotes not needed)
```

---

## Troubleshooting

### Issue 1: "Network Error" or "Failed to fetch"

**Solution:**

- Verify your Render backend is running (check Render dashboard)
- Make sure `VITE_API_URL` is set correctly on Vercel
- Redeploy frontend after adding environment variable

### Issue 2: CORS Errors

**Solution:**

- Make sure `FRONTEND_URL` is set on Render to your Vercel URL
- Example: `FRONTEND_URL=https://study-mate-topaz.vercel.app`
- The backend already allows all `.vercel.app` domains, so this should work

### Issue 3: Environment Variable Not Working

**Solution:**

- Environment variables are only available AFTER redeploying
- Make sure you selected all environments (Production, Preview, Development)
- Clear browser cache and try again

---

## Quick Checklist

- [ ] Get Render backend URL (e.g., `https://studymate-xyz.onrender.com`)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Add `VITE_API_URL` with your Render URL
- [ ] Select all environments (Production, Preview, Development)
- [ ] Save the environment variable
- [ ] Redeploy your frontend on Vercel
- [ ] Test signup/login on your Vercel app
- [ ] Check browser console for errors

---

## Example Configuration

### On Render (Backend):

```
NODE_ENV=production
FRONTEND_URL=https://study-mate-topaz.vercel.app
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your-secret
RESEND_API_KEY=re_XXXXXXXXXX
GEMINI_API_KEY=AIzaSyXXXXXXXX
```

### On Vercel (Frontend):

```
VITE_API_URL=https://studymate-backend.onrender.com
```

---

## Testing the Connection

After deployment, open browser console and run:

```javascript
console.log(import.meta.env.VITE_API_URL);
```

You should see your Render backend URL printed.

Or check the Network tab:

- Try to signup/login
- Look at the request URL
- It should be: `https://your-backend.onrender.com/api/verify-email/send-otp`

---

## Need Help?

If you're still having issues:

1. Check Vercel build logs for errors
2. Check Render logs to see if requests are reaching the backend
3. Verify both environment variables are set correctly
4. Make sure you redeployed after adding environment variables

Good luck! 🚀
