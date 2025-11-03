# Getting Started with Here Now Mobile

Quick start guide to get the app running in Cursor IDE.

## ⚡ Quick Start (5 minutes)

### Step 1: Open Project in Cursor

```bash
# From terminal
cd /Users/markfallows/Desktop/here-now-mobile
cursor .
```

Or: Open Cursor → File → Open Folder → Select `here-now-mobile`

### Step 2: Add Your Supabase Credentials

Open `.env` file and replace with your actual credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**Where to find these:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your "Here Now" project
3. Click Settings (gear icon) → API
4. Copy "Project URL" and "anon/public" key

### Step 3: Install Dependencies

In Cursor's integrated terminal:

```bash
npm install
```

### Step 4: Start the App

```bash
npm start
```

This will:
- Start the Expo development server
- Show a QR code in the terminal
- Open a browser window with controls

### Step 5: View on Your Phone

**Option A: Physical Device (Recommended)**
1. Install **Expo Go** app from App Store or Google Play
2. iPhone: Open Camera → Scan QR code
3. Android: Open Expo Go → Scan QR code

**Option B: Simulator**
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator

## 🎯 What You'll See

The app will open with 4 tabs at the bottom:

1. **Home** - Toggle switch (ON/OFF) to control your visibility
2. **Activities** - Empty state (will show pile-on events)
3. **Chats** - Empty state (will show conversations)
4. **Profile** - Basic profile placeholder

## 🔧 Next Steps (Development)

### 1. Connect Toggle to Supabase

Edit `src/screens/HomeScreen.tsx` around line 8:

```typescript
const handleToggle = async (value: boolean) => {
  setIsOn(value);

  // Add this:
  const { data, error } = await supabase
    .from('users')
    .update({ is_on: value, last_toggled_on: new Date().toISOString() })
    .eq('id', user.id); // You'll need to get user.id from auth context
};
```

### 2. Add Authentication

Create `src/contexts/AuthContext.tsx` to manage user session:

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Ask Cursor AI to help build this!
```

### 3. Fetch Nearby Users

Use the `get_nearby_users()` function we created in Supabase:

```typescript
const { data: nearbyUsers } = await supabase
  .rpc('get_nearby_users', {
    user_lat: currentLocation.latitude,
    user_lng: currentLocation.longitude,
    radius_km: 5
  });
```

### 4. Request Location Permissions

```bash
# Install location package (already done)
npm install expo-location
```

Then in your screen:

```typescript
import * as Location from 'expo-location';

const requestLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({});
    // Use location.coords.latitude and location.coords.longitude
  }
};
```

## 💡 Using Cursor AI

Cursor has Claude built-in. Use it to help build features:

**Example prompts:**

> "Create an AuthContext that handles Supabase authentication with phone number"

> "Build a UserCard component that shows profile pic, name, bio, and activity tags"

> "Add a function to fetch nearby users and display them in a FlatList"

> "Implement the Toggle functionality to update user's is_on status in Supabase"

## 📱 Testing Tips

### Hot Reload
- Save any file and changes appear instantly
- Shake device to open developer menu
- Press `r` in terminal to reload

### Debugging
- Press `m` in terminal to open menu
- Enable "Remote JS Debugging" for Chrome DevTools
- Use `console.log()` - output appears in terminal

### Check Supabase Connection
Add this to HomeScreen to test:

```typescript
useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    console.log('Supabase test:', { data, error });
  };
  testConnection();
}, []);
```

## 🐛 Common Issues

### "Network request failed"
- Check `.env` has correct Supabase URL
- Verify you're on same network as computer (not cellular)
- Try restarting Expo: `npm start --clear`

### "Unable to resolve module"
- Clear cache: `npm start --clear`
- Delete node_modules: `rm -rf node_modules && npm install`

### "Expo Go app crashes"
- Check for JavaScript errors in terminal
- Restart Expo Go app
- Update Expo Go to latest version

## 📚 Key Files to Edit

Start with these files to build core features:

1. **src/screens/HomeScreen.tsx** - Toggle and feed
2. **src/screens/ActivitiesScreen.tsx** - Activities list
3. **src/components/** - Create reusable components here
4. **src/lib/supabase.ts** - Already configured!
5. **src/types/database.ts** - TypeScript types (already done!)

## 🚀 Recommended Development Order

1. ✅ **Setup** (DONE!)
2. **Auth** - Phone/email login with Supabase
3. **Toggle** - Update user.is_on in database
4. **Location** - Get and store user location
5. **Feed** - Show nearby users who are ON
6. **Profile** - Edit user profile
7. **1:1 Connections** - Request to meet someone
8. **Activities** - Browse and create pile-ons
9. **Chat** - Real-time messaging

## 🎨 Design System

Colors already set up in screens:

- **Success Green:** `#10b981` - Primary actions, ON status
- **Background:** `#f9fafb` - Screen backgrounds
- **Card:** `#ffffff` - Card backgrounds
- **Border:** `#e5e7eb` - Borders
- **Text:** `#111827` - Primary text
- **Muted:** `#6b7280` - Secondary text

These match the v0 web prototype design system!

## 📞 Need Help?

1. **Cursor AI** - Use Cmd+K (Mac) or Ctrl+K (Windows) to ask Claude
2. **README.md** - Full documentation
3. **PRD** - Check ../v0-here-now-app/docs/PRD.md for feature specs
4. **Supabase Docs** - https://supabase.com/docs
5. **Expo Docs** - https://docs.expo.dev/

---

**You're all set!** 🎉 Open the project in Cursor and start building!
