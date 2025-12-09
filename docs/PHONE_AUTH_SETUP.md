# Phone Authentication Setup Guide

## Overview

Your app already has phone authentication code implemented, but you need to configure **Twilio** in Supabase to enable SMS OTP verification.

## 📋 Prerequisites

1. **Twilio Account** (free trial available)
   - Sign up at: https://www.twilio.com/try-twilio
   - Free trial includes $15.50 credit and a phone number

2. **Supabase Project**
   - Your project: `siyabqommfwjzefpgwjm`
   - Dashboard: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm

## 🔧 Step-by-Step Setup

### Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your phone number
4. Complete account setup

### Step 2: Get Your Twilio Credentials

Once logged into Twilio Console:

1. **Account SID**:
   - Go to Dashboard
   - Copy your **Account SID** (starts with `AC...`)

2. **Auth Token**:
   - Go to Dashboard
   - Click "Show" next to Auth Token
   - Copy your **Auth Token**

3. **Phone Number**:
   - Go to **Phone Numbers** → **Manage** → **Active Numbers**
   - You should see a trial phone number (starts with `+1...`)
   - Copy the full phone number (including country code)

### Step 3: Enable Phone Provider in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** in the list
4. Toggle it **ON** (enable)
5. Click **Configure** to open settings

### Step 4: Configure Twilio in Supabase

In the Phone provider configuration:

1. **Enable Phone Provider**: Toggle ON

2. **SMS Provider**: Select **Twilio**

3. **Enter Twilio Credentials**:
   - **Twilio Account SID**: Paste your Account SID
   - **Twilio Auth Token**: Paste your Auth Token
   - **Twilio Phone Number**: Paste your phone number (e.g., `+1234567890`)

4. **Message Template** (optional):
   - Default: `Your code is {{ .Code }}`
   - You can customize this message

5. Click **Save**

### Step 5: Test Phone Authentication

1. **Open your app**
2. Go to **Sign Up** or **Login** screen
3. Select **Phone** tab
4. Enter your phone number (with country code, e.g., `+1234567890`)
5. Tap **Send Code**
6. You should receive an SMS with a 6-digit code
7. Enter the code to verify

## 🔍 Troubleshooting

### "Phone authentication is not enabled"
- **Fix**: Go to Supabase → Authentication → Providers → Enable Phone provider

### "SMS service not configured"
- **Fix**: Configure Twilio credentials in Supabase → Authentication → Providers → Phone → Configure

### "Invalid phone number format"
- **Fix**: Ensure phone number includes country code (e.g., `+1234567890`)

### SMS Not Received
- **Check**: Twilio trial accounts can only send to verified numbers initially
- **Fix**: Verify your phone number in Twilio Console
- **Alternative**: Use email authentication for testing

### Rate Limits
- Twilio trial accounts have rate limits
- Upgrade to paid account for production use

## 💰 Twilio Pricing

- **Trial**: Free $15.50 credit (enough for testing)
- **Pay-as-you-go**: ~$0.0075 per SMS in US
- **Monthly**: Starting at $20/month for dedicated number

## 📱 Phone Number Format

Your app automatically normalizes phone numbers:
- Adds `+1` prefix if missing (assumes US)
- Removes spaces, dashes, parentheses
- Format: `+1234567890` (country code + number)

## ✅ Verification Checklist

- [ ] Twilio account created
- [ ] Account SID copied
- [ ] Auth Token copied
- [ ] Phone number obtained
- [ ] Phone provider enabled in Supabase
- [ ] Twilio credentials configured in Supabase
- [ ] Test SMS received successfully
- [ ] Phone signup/login working in app

## 🔐 Security Notes

- **Never commit Twilio credentials to git**
- Store credentials in Supabase (they're encrypted)
- Use environment variables for local development if needed
- Rotate credentials if compromised

## 📚 Additional Resources

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Console](https://console.twilio.com/)
- [Twilio SMS API Docs](https://www.twilio.com/docs/sms)





