# Deep Linking Setup for Email Authentication

## Problem

When users click the email verification link, it opens `localhost` in the browser instead of opening your mobile app.

## Solution

Configure Supabase to use your app's deep link scheme (`herenow://auth/callback`) instead of localhost URLs.

## ✅ Steps to Fix

### 1. Add Redirect URL in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `siyabqommfwjzefpgwjm`
3. Navigate to **Authentication** → **URL Configuration**
4. Scroll to **Redirect URLs** section
5. Click **+ Add URL**
6. Enter: `herenow://auth/callback`
7. Click **Save**

### 2. Verify App Configuration

Your `app.config.js` already has the correct deep link scheme:
```javascript
scheme: "herenow",
```

This tells iOS and Android to handle URLs starting with `herenow://`.

### 3. Test the Fix

1. **Rebuild your app** (deep link configuration is set at build time):
   ```bash
   eas build --platform ios --profile production
   ```

2. **Send a test email**:
   - Open your app
   - Go to Sign Up screen
   - Enter your email
   - Tap "Send Verification Code"

3. **Check your email**:
   - Open the email on your phone
   - Click the verification link
   - ✅ **Expected**: App should open automatically
   - ❌ **If it still opens localhost**: Check Supabase redirect URLs again

## 🔍 How It Works

1. **User clicks email link**: Supabase redirects to `herenow://auth/callback?access_token=...&refresh_token=...`

2. **iOS/Android recognizes deep link**: The OS sees the `herenow://` scheme and opens your app

3. **App handles callback**: 
   - React Navigation routes to `AuthCallback` screen
   - `AuthCallbackScreen` extracts tokens from URL
   - Supabase session is created
   - User is logged in

## 📱 Platform-Specific Notes

### iOS
- Deep links work automatically with the `scheme` in `app.config.js`
- No additional configuration needed for Expo apps

### Android
- Deep links work automatically with the `scheme` in `app.config.js`
- No additional configuration needed for Expo apps

### Web
- Uses `http://localhost:8081/auth/callback` for local dev
- Uses your production domain for production builds

## 🐛 Troubleshooting

### Link still opens localhost
- **Check**: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- **Ensure**: `herenow://auth/callback` is in the list
- **Fix**: Add it if missing, then save

### App doesn't open when clicking link
- **Check**: App is installed on device
- **Check**: Link uses `herenow://` scheme (not `http://`)
- **Fix**: Rebuild app after adding redirect URL in Supabase

### "Invalid redirect URL" error
- **Cause**: URL not in Supabase's allowed redirect URLs list
- **Fix**: Add `herenow://auth/callback` to redirect URLs in Supabase

## 🔗 Additional Resources

- [Supabase Deep Linking Docs](https://supabase.com/docs/guides/auth/deep-linking)
- [Expo Deep Linking Docs](https://docs.expo.dev/guides/linking/)





