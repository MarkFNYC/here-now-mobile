# Deploy to TestFlight - Quick Guide

## 🚀 Build and Submit to TestFlight

### Step 1: Build for iOS Production

```bash
cd ~/Desktop/here-now-mobile
eas build --platform ios --profile production
```

**What this does:**
- Builds your app for iOS production
- Takes ~15-20 minutes
- Uploads to Expo's servers

**Note:** You can continue working while the build runs in the background.

---

### Step 2: Submit to TestFlight

After the build completes, submit it:

```bash
eas submit --platform ios --latest
```

**Or submit manually:**
1. Go to: https://expo.dev/accounts/markynyc/projects/here-now-mobile/builds
2. Find your latest build
3. Click "Submit to App Store"
4. Follow the prompts

**Time:** ~5 minutes

---

## ✅ What's Ready

- ✅ Code changes for OTP authentication (removed `emailRedirectTo`)
- ✅ Deep linking configured (`herenow://auth/callback`)
- ✅ Phone OTP authentication (if Twilio is configured)
- ✅ Magic link authentication (works even if OTP template isn't configured)

---

## 📱 Testing Options While Email OTP Config is Pending

You can test the app in TestFlight using:

### Option 1: Phone Authentication (Recommended)
- Use the "Phone" tab in signup/login
- Requires Twilio setup (see `docs/PHONE_AUTH_SETUP.md`)
- Sends 6-digit SMS codes ✅

### Option 2: Magic Link Authentication (Works Now)
- Use the "Email" tab in signup/login
- Click the magic link in the email
- App will open automatically via deep link ✅
- **Note:** This works even if OTP template isn't configured

### Option 3: Fix Email OTP Template (5 minutes)
- Go to Supabase Dashboard → Authentication → Email Templates
- Enable OTP template with `{{ .Token }}`
- Disable Magic Link template
- Request new code from app
- See `docs/SUPABASE_OTP_SETUP.md` for details

---

## 🔍 Check Build Status

```bash
# View build status
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

Or check online:
https://expo.dev/accounts/markynyc/projects/here-now-mobile/builds

---

## 📝 Notes

- **Uncommitted changes are fine** - EAS builds from your current working directory
- **Email OTP config is optional** - App works with magic links or phone OTP
- **TestFlight review** - Usually takes 1-2 hours after submission
- **Version auto-increment** - `eas.json` has `autoIncrement: true` so version bumps automatically

---

## 🐛 Troubleshooting

### Build fails?
- Check: `eas build:list` for error messages
- Verify: You're logged in with `eas whoami`
- Check: All dependencies are installed (`npm install`)

### Submit fails?
- Verify: Build completed successfully first
- Check: Apple credentials are configured (`eas credentials`)
- Ensure: App Store Connect access is set up

### Need to cancel a build?
```bash
eas build:cancel [BUILD_ID]
```




