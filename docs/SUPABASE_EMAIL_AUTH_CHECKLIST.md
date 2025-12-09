# Supabase Email Authentication Verification Checklist

## ✅ Steps to Verify Email Auth is Enabled

### 1. Access Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: **siyabqommfwjzefpgwjm**

### 2. Navigate to Authentication Settings
- Click **Authentication** in the left sidebar
- Click **Providers** tab

### 3. Verify Email Provider
- ✅ **Email** provider should be **ENABLED** (toggle should be ON)
- ✅ **Confirm email** setting should be configured (usually enabled by default)

### 4. Check Email Templates
- Go to **Authentication** → **Email Templates**
- Verify the following templates exist and are configured:
  - **Confirm signup** - for new user registration
  - **Magic Link** - for passwordless login
  - **OTP** - for OTP codes (if using 6-digit codes)

### 5. Check Site URL Configuration (CRITICAL FOR DEEP LINKS)
- Go to **Authentication** → **URL Configuration**
- **Site URL**: Can be set to `https://your-domain.com` or leave as default
- **Redirect URLs** (MUST include these):
  - `herenow://auth/callback` ⚠️ **THIS IS CRITICAL** - Required for mobile app deep linking
  - `http://localhost:8081/auth/callback` (for local web dev)
  - `https://localhost:8081/auth/callback` (for local web dev HTTPS)
  - Any production domain you use (e.g., `https://yourapp.com/auth/callback`)

**How to add redirect URLs:**
1. Go to **Authentication** → **URL Configuration**
2. Scroll to **Redirect URLs** section
3. Click **+ Add URL**
4. Enter `herenow://auth/callback`
5. Click **Save**
6. Repeat for other URLs you need

**⚠️ Important:** If `herenow://auth/callback` is NOT in the redirect URLs list, email links will open in the browser instead of your app!

### 6. API Settings Verification
- Go to **Settings** → **API**
- Verify **Project URL**: `https://siyabqommfwjzefpgwjm.supabase.co`
- Verify **anon/public key** matches what's in your code

## 🔧 How to Enable Email Auth (If Disabled)

If Email provider is disabled:

1. Go to **Authentication** → **Providers**
2. Find **Email** in the list
3. Click the toggle to **ENABLE** it
4. Configure settings:
   - **Enable email confirmations**: Usually ON for security
   - **Secure email change**: Recommended ON
   - **Double confirm email changes**: Optional but recommended

## 📧 Email Delivery Configuration

### Default (Supabase SMTP)
- Works out of the box but has rate limits
- Good for development and testing
- May have deliverability issues in production

### Custom SMTP (Recommended for Production)
1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure your own SMTP server (SendGrid, AWS SES, etc.)
3. This improves deliverability and removes rate limits

## 🐛 Common Issues

### "Invalid API key" Error
- **Cause**: Wrong anon key or email auth disabled
- **Fix**: 
  1. Verify API key in Settings → API
  2. Enable Email provider in Authentication → Providers

### "Email rate limit exceeded"
- **Cause**: Too many emails sent via default SMTP
- **Fix**: Set up custom SMTP or wait for rate limit reset

### "Email not received"
- **Cause**: Email in spam, or SMTP not configured
- **Fix**: 
  1. Check spam folder
  2. Set up custom SMTP for better deliverability
  3. Verify email address is valid

## 🔍 Quick Verification Commands

You can test email auth from your app:
1. Open the app
2. Go to Sign Up screen
3. Enter an email address
4. Tap "Send Verification Code"
5. Check your email inbox (and spam folder)

If you receive the email → Email auth is working ✅
If you get an error → Follow troubleshooting steps above


