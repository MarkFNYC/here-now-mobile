# How to Check Supabase Storage for Uploaded Images

## 🎯 Quick Check: Is the Image Actually Uploaded?

### Method 1: Supabase Dashboard (Easiest)

**Steps**:
1. Go to: https://supabase.com/dashboard
2. Select your project: **siyabqommfwjzefpgwjm**
3. Click **Storage** in the left sidebar
4. Click on **profile-photos** bucket
5. You should see files listed (named like `[user-id].jpg`)

**What to look for**:
- ✅ File exists → Upload worked!
- ✅ File size > 0 → File has content
- ✅ Recent timestamp → Just uploaded
- ❌ No file → Upload failed

---

### Method 2: Check Database for Photo URL

**Steps**:
1. Go to Supabase Dashboard
2. Click **Table Editor** in left sidebar
3. Select **users** table
4. Find your user row
5. Check **photo_url** column

**What to look for**:
- ✅ URL exists → Database updated
- ✅ URL format: `https://siyabqommfwjzefpgwjm.supabase.co/storage/v1/object/public/profile-photos/...`
- ❌ NULL or empty → Database not updated

---

### Method 3: Test URL Directly in Browser

**Steps**:
1. Copy the `photo_url` from database
2. Paste in browser address bar
3. Press Enter

**What should happen**:
- ✅ Image displays → URL works, issue is with app
- ❌ 404 or error → Storage permissions issue
- ❌ Access denied → Bucket not public

---

## 🔍 Detailed Storage Check

### Check File Details:

1. **Storage** → **profile-photos** bucket
2. Click on a file
3. Check:
   - **File size** (should be > 0)
   - **Last modified** (should be recent)
   - **Public URL** (copy this to test)

### Check Bucket Permissions:

1. **Storage** → **profile-photos** bucket
2. Click **Settings** tab
3. Check:
   - ✅ **Public bucket** should be ON (for public URLs)
   - ✅ **File size limit** (should allow your file size)
   - ✅ **Allowed MIME types** (should include `image/jpeg`, `image/png`)

---

## 🐛 Troubleshooting

### File Exists But URL Doesn't Work

**Problem**: File uploaded but URL returns 404

**Check**:
1. Is bucket public? (Storage → Settings → Public bucket)
2. Is file name correct? (should match user ID)
3. Try accessing via Storage API URL directly

### File Doesn't Exist

**Problem**: Upload failed silently

**Check**:
1. Look for errors in console logs
2. Check Storage → Logs for upload errors
3. Verify RLS policies allow uploads

### Database Has URL But File Missing

**Problem**: Database updated but file upload failed

**Check**:
1. Storage → profile-photos bucket
2. Look for file with user ID as name
3. If missing, upload failed after database update

---

## 📝 Quick Verification Checklist

After uploading a photo, verify:

- [ ] File exists in Storage → profile-photos bucket
- [ ] File size > 0 KB
- [ ] File name matches user ID (e.g., `abc123.jpg`)
- [ ] Database → users table has photo_url
- [ ] photo_url matches file in storage
- [ ] URL works when opened in browser
- [ ] Bucket is set to public

---

## 🔗 Direct Links

**Your Supabase Project**:
- Dashboard: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm
- Storage: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm/storage/buckets
- Users Table: https://supabase.com/dashboard/project/siyabqommfwjzefpgwjm/editor

---

## 💡 Pro Tip

**Quick Test**:
1. Upload photo in app
2. Immediately check Supabase Storage
3. If file exists → Upload worked, issue is with display
4. If file missing → Upload failed, check console logs

This tells you immediately if the problem is:
- **Upload** (file doesn't exist)
- **Display** (file exists but doesn't show)


