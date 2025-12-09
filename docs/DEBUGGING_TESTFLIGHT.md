# Debugging TestFlight Builds - Console Logs Guide

## 🎯 Best Methods to See Console Logs from TestFlight

### Method 1: Xcode Console (Recommended) ⭐

**Best for**: Real-time debugging while testing

**Steps**:
1. Connect your iPhone to Mac via USB
2. Open **Xcode**
3. Go to **Window** → **Devices and Simulators** (or `Cmd+Shift+2`)
4. Select your iPhone from the left sidebar
5. Click **Open Console** button (or right-click device → "Open Console")
6. Filter by your app name: `here-now-mobile` or `herenowmobile`
7. Run your TestFlight app and watch logs appear in real-time

**Pro Tips**:
- Use the search box to filter for specific logs (e.g., `[PhotoUpload]`)
- You can save logs to a file
- Logs persist even after app closes

---

### Method 2: Console.app (macOS System Console)

**Best for**: Viewing all device logs, not just your app

**Steps**:
1. Connect iPhone via USB
2. Open **Console.app** (Applications → Utilities → Console)
3. Select your iPhone from sidebar
4. Filter by process name: `herenowmobile`
5. Watch logs in real-time

**Note**: Shows ALL logs from device, so filtering is important

---

### Method 3: Xcode Organizer (Crash Reports)

**Best for**: Viewing crashes and errors after they happen

**Steps**:
1. Open **Xcode**
2. Go to **Window** → **Organizer** (or `Cmd+Option+O`)
3. Click **Crashes** tab
4. Select your app
5. View crash reports from TestFlight users

**Note**: Only shows crashes, not regular console logs

---

### Method 4: Add Remote Logging (Production-Ready)

**Best for**: Seeing logs from any device, anywhere

**Options**:
- **Sentry** - Error tracking + logging
- **Bugsnag** - Error tracking
- **LogRocket** - Session replay + logs
- **Firebase Crashlytics** - Free, good for React Native

---

### Method 5: In-App Debug Screen (Quick & Easy)

**Best for**: Quick debugging without external tools

Add a debug screen that shows recent logs in the app itself.

---

## 🔧 Setting Up Xcode for Better Debugging

### Enable Detailed Logging

1. In Xcode, go to **Product** → **Scheme** → **Edit Scheme**
2. Select **Run** → **Arguments**
3. Add environment variables:
   - `OS_ACTIVITY_MODE` = `disable` (reduces noise)
   - Or keep it enabled to see all logs

### View Device Logs in Xcode

1. **Window** → **Devices and Simulators**
2. Select device → **View Device Logs**
3. Filter by your app
4. Export logs if needed

---

## 📱 Quick Setup: View Logs Right Now

### Step 1: Connect Device
```bash
# Check if device is connected
xcrun xctrace list devices
```

### Step 2: Open Console
- Xcode → Window → Devices and Simulators → Open Console
- OR Console.app → Select iPhone

### Step 3: Filter Logs
- Search for: `herenowmobile` or `[PhotoUpload]` or `[ProfileScreen]`

### Step 4: Run TestFlight App
- Open your TestFlight app
- Perform actions (upload photo, etc.)
- Watch logs appear in real-time

---

## 🐛 What to Look For

### Our Custom Logs
Look for these prefixes:
- `[PhotoUpload]` - Photo upload process
- `[ProfileScreen]` - Profile screen state
- `[Auth]` - Authentication flow

### Common Issues to Check
- **Network errors**: Look for `fetch`, `network`, `error`
- **Image loading**: Look for `Image`, `expo-image`, `loading`
- **State updates**: Look for `User state changed`

---

## 💡 Pro Tips

1. **Use Console.app for better filtering** - More powerful than Xcode console
2. **Save logs to file** - Export for later analysis
3. **Filter by level** - Show only errors/warnings
4. **Use search** - Find specific log messages quickly
5. **Watch in real-time** - See logs as they happen

---

## 🚀 Quick Debugging Workflow

1. **Connect iPhone** via USB
2. **Open Console.app** (easier than Xcode console)
3. **Filter by app name**: `herenowmobile`
4. **Open TestFlight app**
5. **Reproduce issue** (upload photo, etc.)
6. **Watch logs** appear in real-time
7. **Search for errors** or specific log prefixes

---

## 📝 Example: Debugging Photo Upload Issue

1. Connect device
2. Open Console.app
3. Filter: `herenowmobile`
4. Search: `[PhotoUpload]`
5. Upload photo in TestFlight app
6. Watch for:
   - `[PhotoUpload] Photo URL: ...`
   - `[PhotoUpload] Verified photo URL in database: ...`
   - `[ProfileScreen] Photo URL: ...`
   - Any errors

---

## 🔍 Alternative: Add Debug Screen to App

We can add a simple debug screen that shows recent console logs in the app itself. This is useful for quick debugging without connecting to Mac.

Would you like me to add this?


