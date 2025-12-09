# Next Steps: Deep Link Fix

## Step 1: Configure Supabase (Do This First - Takes 2 Minutes)

1. Go to: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm
2. Navigate to: **Authentication** → **URL Configuration**
3. Scroll to: **Redirect URLs** section
4. Click: **+ Add URL**
5. Enter: `herenow://auth/callback`
6. Click: **Save**

✅ This is just a dashboard setting - no code/build needed!

---

## Step 2: Build and Push to TestFlight (Required for Code Changes)

The code changes we made require a new build:

### Build Command
```bash
cd ~/Desktop/here-now-mobile
eas build --platform ios --profile production
```

### After Build Completes
1. Wait for build to finish (usually 10-20 minutes)
2. Submit to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```

Or submit manually:
1. Go to: https://expo.dev/accounts/markynyc/projects/here-now-mobile/builds
2. Find your latest build
3. Click "Submit to App Store"
4. Follow the prompts

---

## Step 3: Test the Fix

Once the new build is on TestFlight:

1. **Update your TestFlight app** to the new version
2. **Send a test email**:
   - Open the app
   - Go to Sign Up screen
   - Enter your email
   - Tap "Send Verification Code"
3. **Check your email** on your iPhone
4. **Click the verification link** in the email
5. ✅ **Expected result**: App should open automatically (not localhost in browser)

---

## Why Both Steps Are Needed

- **Supabase configuration**: Tells Supabase to use `herenow://` URLs in emails
- **App build**: Includes the code changes that handle those deep links properly

Both are required for the fix to work!





