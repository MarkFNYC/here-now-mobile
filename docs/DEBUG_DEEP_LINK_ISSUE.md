# Debug: Magic Link Still Opening Localhost

## Problem
Build 20: Email magic link still opens localhost instead of the app.

## Root Cause
Supabase **rejects** the `emailRedirectTo` parameter if the URL is not in the **allowed redirect URLs list**. Even though our code sends `herenow://auth/callback`, Supabase ignores it and falls back to the Site URL (which is likely localhost).

## ✅ Solution: Add Redirect URL to Supabase

### Step 1: Verify Supabase Configuration

1. Go to: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm
2. Navigate to: **Authentication** → **URL Configuration**
3. Check the **Redirect URLs** section

### Step 2: Add the Deep Link URL

**If `herenow://auth/callback` is NOT in the list:**

1. Click **+ Add URL**
2. Enter exactly: `herenow://auth/callback`
3. Click **Save**

**⚠️ CRITICAL:** The URL must match exactly (case-sensitive, no trailing slash)

### Step 3: Verify Site URL

While you're there, check the **Site URL**:
- It can be set to any valid URL (Supabase uses it as a fallback)
- For mobile apps, you can set it to: `https://your-app-domain.com` or leave it as default
- **Important:** This is NOT what gets used if `herenow://auth/callback` is in the redirect URLs list

## 🔍 How to Verify It's Fixed

### Check the Email Link
1. Send a new test email from the app
2. Open the email on your iPhone
3. **Look at the link URL** (long-press the link to see the full URL)
4. ✅ **Should show**: `herenow://auth/callback?access_token=...`
5. ❌ **If it shows**: `http://localhost:8081/...` or `https://...` → Redirect URL not added correctly

### Test the Link
1. Click the link in the email
2. ✅ **Expected**: App opens automatically
3. ❌ **If browser opens**: Redirect URL not configured or app not installed

## 🐛 Common Issues

### Issue 1: "Redirect URL not allowed" error
- **Cause**: URL not in Supabase redirect URLs list
- **Fix**: Add `herenow://auth/callback` to redirect URLs

### Issue 2: Link still uses localhost
- **Cause**: Redirect URL not added, or added incorrectly
- **Fix**: 
  1. Double-check the URL is exactly `herenow://auth/callback` (no typos)
  2. Make sure you clicked Save
  3. Send a NEW email (old emails have old links)

### Issue 3: App doesn't open when clicking link
- **Cause 1**: App not installed on device
- **Cause 2**: Deep link scheme not registered (requires app rebuild)
- **Fix**: 
  1. Make sure app is installed
  2. Rebuild app if you just added the scheme: `eas build --platform ios --profile production`

## 📝 Code Verification

The code is already correct. Check the logs when sending email:

```
[Auth] Using redirect URL: herenow://auth/callback
[Auth] Platform: ios
```

If you see `localhost` in the logs, there's a code issue. If you see `herenow://` but the email still has localhost, it's a Supabase configuration issue.

## ✅ Checklist

- [ ] `herenow://auth/callback` is in Supabase redirect URLs list
- [ ] URL is spelled exactly (case-sensitive)
- [ ] Clicked Save in Supabase dashboard
- [ ] Sent a NEW test email (old emails won't work)
- [ ] Checked the actual link URL in the email
- [ ] App is installed on test device
- [ ] App was built with deep link scheme (`scheme: "herenow"` in app.config.js)

## 🚀 Next Steps

1. **Add redirect URL in Supabase** (if not already done)
2. **Send a new test email** from the app
3. **Check the link URL** in the email
4. **Click the link** - app should open
5. If still not working, check the logs in the app console





