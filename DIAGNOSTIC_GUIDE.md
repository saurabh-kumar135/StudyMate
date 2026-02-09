# 🔍 SIGNUP FAILURE DIAGNOSTIC GUIDE

## Current Situation

You're experiencing "Signup failed. Please try again" with **NO error logs** on Render.

This means one of two things:

1. **Render is running OLD code** (without the detailed logging I added)
2. **RESEND_API_KEY is not set** on Render

---

## 🚨 IMMEDIATE STEPS TO FIX

### Step 1: Verify Render is Using Latest Code

I just added a **health check endpoint**. Visit this URL in your browser:

```
https://your-backend-url.onrender.com/api/health
```

**Replace `your-backend-url` with your actual Render URL**

You should see a JSON response like:

```json
{
  "status": "OK",
  "timestamp": "2026-02-09T03:50:00.000Z",
  "environment": "production",
  "envVarsSet": {
    "MONGODB_URI": true,
    "SESSION_SECRET": true,
    "RESEND_API_KEY": false,  ← THIS IS THE PROBLEM IF FALSE
    "GEMINI_API_KEY": true,
    "FRONTEND_URL": "https://study-mate-topaz.vercel.app"
  },
  "version": "v2.0-with-logging"
}
```

### Step 2: Check the Response

**If you see `"version": "v2.0-with-logging"`:**
✅ Latest code is deployed!

**If you see an error or old version:**
❌ Render is NOT using the latest code. You need to redeploy.

**If `"RESEND_API_KEY": false`:**
❌ This is your problem! RESEND_API_KEY is missing.

---

## 🔧 How to Fix Based on Diagnosis

### Fix 1: If Latest Code is NOT Deployed

**On Render Dashboard:**

1. Go to your StudyMate service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (5-10 minutes)
4. Check `/api/health` again

### Fix 2: If RESEND_API_KEY is Missing

**On Render Dashboard:**

1. Go to your service → **Environment** tab
2. Click "Add Environment Variable"
3. **Key**: `RESEND_API_KEY`
4. **Value**: Get from https://resend.com/api-keys
   - Sign up/login to Resend
   - Create a new API key
   - Copy the key (starts with `re_`)
5. Click "Save"
6. Render will automatically redeploy

### Fix 3: If Everything Looks Good But Still Failing

Check the Render logs WHILE trying to signup:

1. Open Render dashboard → Logs
2. Try to signup on your frontend
3. Look for these NEW logs:

```
📧 Signup attempt for: user@example.com
📝 User data: { firstName: 'John', lastName: 'Doe', userType: 'guest' }
🔑 RESEND_API_KEY exists: true
📤 Sending email via Resend API...
```

**If you DON'T see these emoji logs:**

- Render is still running old code
- Force redeploy on Render

**If you see:**

```
❌ RESEND_API_KEY is not configured!
```

- Add RESEND_API_KEY to Render environment variables

---

## 📋 Complete Checklist

- [ ] Visit `https://your-backend.onrender.com/api/health`
- [ ] Verify `"version": "v2.0-with-logging"` is shown
- [ ] Check all `envVarsSet` values are `true`
- [ ] If RESEND_API_KEY is `false`, add it to Render
- [ ] If version is old, manually redeploy on Render
- [ ] Wait for deployment to complete
- [ ] Check `/api/health` again to confirm
- [ ] Try signup again
- [ ] Check Render logs for emoji logs (📧, 🔑, etc.)

---

## 🎯 Expected Behavior After Fix

### 1. Health Check Should Show:

```json
{
  "status": "OK",
  "envVarsSet": {
    "RESEND_API_KEY": true  ← MUST BE TRUE
  },
  "version": "v2.0-with-logging"
}
```

### 2. Render Logs Should Show (when you try signup):

```
✅ CORS: Allowing Vercel domain: https://study-mate-topaz.vercel.app
📧 Signup attempt for: saurabhrajput.25072005@gmail.com
📝 User data: { firstName: 'Saurabh', lastName: 'Rajput', userType: 'guest' }
🔐 Hashing password...
💾 Storing pending verification...
📨 Attempting to send OTP email to: saurabhrajput.25072005@gmail.com
🔑 RESEND_API_KEY exists: true
📤 Sending email via Resend API...
✅ OTP email sent successfully to: saurabhrajput.25072005@gmail.com
```

### 3. Frontend Should:

- Redirect to email verification page
- You should receive an OTP email

---

## 🆘 Still Not Working?

If after following ALL steps above it still doesn't work:

1. **Take a screenshot** of the `/api/health` response
2. **Take a screenshot** of the Render logs when you try to signup
3. **Take a screenshot** of the browser console (F12 → Console tab)
4. Share these with me

---

## 🔑 How to Get RESEND_API_KEY

1. Go to: https://resend.com
2. Sign up or login
3. Go to "API Keys" section
4. Click "Create API Key"
5. Give it a name (e.g., "StudyMate Production")
6. Copy the key (starts with `re_`)
7. Add it to Render environment variables

**IMPORTANT**: Free tier allows 100 emails/day, which is enough for testing!

---

## ⚡ Quick Commands

### Check if latest code is on GitHub:

```bash
git log --oneline -1
```

Should show: `3d3a112 Add health check endpoint to diagnose environment variables`

### Force push to Render (if using Git integration):

Render should auto-deploy when you push to GitHub. If not, use Manual Deploy button.

---

**START WITH THE HEALTH CHECK ENDPOINT!** This will tell you exactly what's wrong. 🎯
