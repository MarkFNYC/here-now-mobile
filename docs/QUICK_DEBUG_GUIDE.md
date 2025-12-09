# Quick Debug Guide - View TestFlight Logs

## 🚀 Fastest Way: Console.app (Right Now!)

### Step-by-Step:

1. **Connect iPhone to Mac** via USB cable
2. **Open Console.app**:
   - Press `Cmd+Space` (Spotlight)
   - Type "Console"
   - Press Enter
3. **Select your iPhone** from left sidebar
4. **Filter logs**:
   - In search box, type: `herenowmobile`
   - OR search for: `[PhotoUpload]` or `[ProfileScreen]`
5. **Open TestFlight app** on your iPhone
6. **Watch logs appear** in real-time!

**That's it!** You'll see all console.log() output from your app.

---

## 📱 Alternative: Xcode Console

### Steps:

1. **Connect iPhone** via USB
2. **Open Xcode**
3. **Window** → **Devices and Simulators** (`Cmd+Shift+2`)
4. **Select iPhone** from left sidebar
5. **Click "Open Console"** button
6. **Filter**: Type `herenowmobile` in search box
7. **Run TestFlight app** and watch logs

---

## 🔍 What Logs to Look For

### Photo Upload Flow:
```
[PhotoUpload] Photo uploaded successfully
[PhotoUpload] Photo URL: https://...
[PhotoUpload] Verified photo URL in database: https://...
[PhotoUpload] User data refreshed
[ProfileScreen] User state changed: {...}
[ProfileScreen] Photo URL: https://...
[ProfileScreen] Photo URL accessibility check: {...}
[ProfileScreen] Photo loaded successfully: https://...
```

### If Something's Wrong:
- Look for `Error` or `error` in logs
- Check `[ProfileScreen] Photo URL not accessible`
- Look for network errors

---

## 💡 Pro Tips

1. **Console.app is easier** than Xcode console (less noise)
2. **Use search/filter** to find specific logs
3. **Save logs** if you need to review later
4. **Watch in real-time** - logs appear as they happen

---

## 🐛 Common Issues

### "No logs showing"
- Make sure iPhone is unlocked
- Trust the computer if prompted
- Restart Console.app

### "Too many logs"
- Use search/filter box
- Filter by app name: `herenowmobile`
- Filter by log prefix: `[PhotoUpload]`

### "Logs stop appearing"
- Restart the app
- Reconnect device
- Restart Console.app

---

## 📝 Quick Test

1. Connect iPhone
2. Open Console.app
3. Filter: `[PhotoUpload]`
4. Upload a photo in TestFlight app
5. You should see logs appear immediately!


