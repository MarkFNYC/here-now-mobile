# Configure Supabase to Send OTP Codes Instead of Magic Links

## Problem

Supabase is sending magic links (clickable links) but your app expects 6-digit OTP codes.

## Root Cause

Supabase determines which email template to use based on:
1. **Email template configuration** - The template must use `{{ .Token }}` (not `{{ .ConfirmationURL }}`)
2. **Template enablement** - The OTP template must be enabled
3. **Template priority** - If OTP template is disabled, Supabase falls back to Magic Link template

## ✅ Steps to Fix (CRITICAL)

### Step 1: Go to Email Templates

1. Go to: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm
2. Navigate to: **Authentication** → **Email Templates**
3. You'll see several templates listed (OTP, Magic Link, Confirm signup, etc.)

### Step 2: Configure OTP Template (REQUIRED)

1. Find the **"OTP"** template in the list
2. Click on it to edit
3. **CRITICAL**: Make sure it's **enabled** (toggle should be ON/green)
4. **CRITICAL**: Check the template content - it MUST include `{{ .Token }}` (NOT `{{ .ConfirmationURL }}`)

**Correct OTP Template (should look like this):**
```
Your verification code is: {{ .Token }}

This code will expire in 1 hour.
```

**❌ WRONG - This will send magic links:**
```
Click here to verify: {{ .ConfirmationURL }}
```

**✅ CORRECT - This will send OTP codes:**
```
Your code is: {{ .Token }}
```

5. Click **Save** to save the template

### Step 3: Disable Magic Link Template (RECOMMENDED)

To prevent Supabase from falling back to magic links:

1. Find the **"Magic Link"** template in the list
2. Click on it to edit
3. Toggle it **OFF** (disable it) - this ensures only OTP codes are sent
4. Click **Save**

### Step 4: Verify Configuration

After saving:
1. The OTP template should show as **ENABLED** ✅
2. The Magic Link template should show as **DISABLED** (optional but recommended)
3. The OTP template content should contain `{{ .Token }}` (not `{{ .ConfirmationURL }}`)

## 🔍 How It Works

- **OTP Template** (with `{{ .Token }}`): Supabase sends a 6-digit code in the email
- **Magic Link Template** (with `{{ .ConfirmationURL }}`): Supabase sends a clickable link

**Template Selection Logic:**
- If OTP template is **enabled** and contains `{{ .Token }}` → Sends OTP code ✅
- If OTP template is **disabled** or contains `{{ .ConfirmationURL }}` → Falls back to Magic Link ❌

## ✅ After Configuration

1. **Request a NEW code** from your app (old emails won't work)
2. Check your email - you should see a **6-digit code** (not a link)
3. Enter the code in the app's OTP field
4. User is verified ✅

## 🐛 Troubleshooting

### Still receiving magic links?

1. **Check OTP template is enabled**: Go to Email Templates → OTP → Toggle should be ON
2. **Check template content**: Must contain `{{ .Token }}` (not `{{ .ConfirmationURL }}`)
3. **Disable Magic Link template**: Go to Email Templates → Magic Link → Toggle OFF
4. **Request a NEW code**: Old emails were sent with the old template configuration
5. **Clear cache**: Sometimes Supabase caches templates - wait 1-2 minutes after saving

### Template variables reference

- `{{ .Token }}` - 6-digit OTP code (use this for OTP emails)
- `{{ .ConfirmationURL }}` - Clickable magic link (use this for magic link emails)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL

## 📝 Important Notes

1. **Code changes are already done**: The app code has been updated to remove `emailRedirectTo` parameter
2. **Dashboard configuration is required**: You MUST configure the Supabase dashboard as described above
3. **New codes only**: Old emails won't change - you need to request a new code after configuration
4. **Template priority**: Supabase uses the OTP template if enabled, otherwise falls back to Magic Link


