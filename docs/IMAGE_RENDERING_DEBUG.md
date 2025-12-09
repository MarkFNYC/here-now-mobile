# Why Images Might Not Render - Debug Guide

## 🔍 Most Common Reasons Images Don't Render

### 1. **State Not Updating After Upload** ⚠️ MOST LIKELY
**Problem**: `refreshUser()` might not be updating the React state properly, so the component doesn't re-render with the new URL.

**Symptoms**:
- Upload succeeds
- Database has the URL
- But ProfileScreen still shows old/no image

**Fix**: Ensure `refreshUser()` actually updates state and triggers re-render

---

### 2. **expo-image Caching Issues**
**Problem**: expo-image might be caching an empty/broken image URL

**Symptoms**:
- URL is correct in database
- URL is correct in component props
- But image doesn't load

**Fix**: 
- Use `key` prop to force re-render (already added ✅)
- Try `cachePolicy="none"` temporarily to test
- Clear expo-image cache

---

### 3. **URL Format Issues**
**Problem**: Supabase Storage URL might not be accessible or in wrong format

**Symptoms**:
- URL looks correct
- But image doesn't load
- Network errors in console

**Check**:
- Is bucket public?
- Is URL accessible in browser?
- Does URL have correct format?

---

### 4. **Timing Issues**
**Problem**: Image might not be immediately available after upload

**Symptoms**:
- Upload succeeds
- But image doesn't appear until app restart

**Fix**: Add delay or retry logic

---

### 5. **Component Not Re-rendering**
**Problem**: ProfileScreen might not be subscribed to user state changes properly

**Symptoms**:
- User state updates
- But ProfileScreen doesn't update

**Fix**: Ensure useEffect dependencies are correct

---

## 🧪 Debugging Steps

### Step 1: Check Console Logs
Look for these logs after upload:
```
[PhotoUpload] Photo URL: https://...
[PhotoUpload] Verified photo URL in database: https://...
[ProfileScreen] Photo URL: https://...
[ProfileScreen] Photo loaded successfully: https://...
```

**If you see**:
- ✅ All logs → State is updating, issue is with image loading
- ❌ Missing `[ProfileScreen] Photo URL` → State not updating
- ❌ Missing `Photo loaded successfully` → Image loading failing

---

### Step 2: Check Database Directly
1. Go to Supabase Dashboard
2. Check `users` table
3. Verify `photo_url` column has the URL
4. Copy URL and test in browser

**If URL works in browser but not in app**:
- → expo-image issue or CORS issue

**If URL doesn't work in browser**:
- → Storage bucket permissions issue

---

### Step 3: Test URL Accessibility
Try opening the URL directly:
```bash
# In browser, try:
https://siyabqommfwjzefpgwjm.supabase.co/storage/v1/object/public/profile-photos/[USER_ID].jpg
```

**If it works**: URL is fine, issue is with expo-image
**If it doesn't**: Storage bucket permissions issue

---

### Step 4: Check expo-image Cache
Try clearing cache by:
1. Adding `cachePolicy="none"` temporarily
2. Or uninstalling/reinstalling app
3. Or using a different URL format

---

## 🔧 Most Likely Fixes

### Fix 1: Ensure State Updates Properly
The `refreshUser()` function needs to actually update the state. Check if `loadUserProfile()` is being called and updating `setUser()`.

### Fix 2: Force Component Re-render
We already added `key={user.photo_url}` which should help, but we might need to also:
- Add a state variable that changes when photo updates
- Use `useFocusEffect` to refresh on screen focus
- Manually trigger refresh after upload

### Fix 3: Check Supabase Storage Permissions
Ensure the `profile-photos` bucket is:
- ✅ Public (or has proper RLS policies)
- ✅ Allows public read access
- ✅ Has correct CORS settings

### Fix 4: Try Different URL Format
Sometimes Supabase Storage URLs need different formats:
- With/without query parameters
- Direct CDN URL vs Storage API URL
- Signed URL vs public URL

---

## 🎯 Quick Test

Add this temporary debug code to ProfileScreen:

```typescript
useEffect(() => {
  console.log('[ProfileScreen] User state changed:', {
    hasPhotoUrl: !!user?.photo_url,
    photoUrl: user?.photo_url,
    userId: user?.id
  });
}, [user]);
```

This will show if the user state is actually updating.


