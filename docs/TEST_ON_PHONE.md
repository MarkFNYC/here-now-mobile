# Test on Your iPhone (Instead of Simulator)

## 🚀 Quick Options

### Option 1: Expo Go App (Fastest - 2 minutes)

**Best for:** Quick testing, no build needed

1. **Install Expo Go** on your iPhone from the App Store
2. **Start dev server** on your Mac:
   ```bash
   npm start
   ```
3. **Connect to same WiFi** - Make sure your iPhone and Mac are on the same network
4. **Scan QR code** - Open Expo Go app and scan the QR code from terminal
5. **Test immediately** - App loads on your phone!

**Limitations:**
- Some native modules might not work (but most do)
- Can't test deep links easily
- Not a production build

---

### Option 2: Development Build (Recommended - 15 min first time)

**Best for:** Testing with all native features, deep links, production-like

1. **Build development client**:
   ```bash
   eas build --platform ios --profile development
   ```
2. **Install on iPhone**:
   - Download from Expo dashboard when build completes
   - Install via TestFlight or direct download link
3. **Start dev server**:
   ```bash
   npm start
   ```
4. **Connect to dev server**:
   - Open the development build app on your phone
   - It will automatically connect to your dev server
   - Or scan QR code if prompted

**Advantages:**
- ✅ All native features work (SecureStore, Location, etc.)
- ✅ Deep links work (`herenow://auth/callback`)
- ✅ Production-like environment
- ✅ Can test OTP codes, magic links, everything

---

### Option 3: TestFlight Build (What you're doing - 20 min)

**Best for:** Final testing, sharing with testers, production-like

1. **Build production**:
   ```bash
   eas build --platform ios --profile production
   ```
2. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios --latest
   ```
3. **Install from TestFlight** on your iPhone
4. **Test everything** - Full production build

**Advantages:**
- ✅ Full production build
- ✅ Can share with testers
- ✅ Tests App Store submission process
- ✅ All features work

---

## 📱 Which Should You Use?

### For Quick OTP Testing Right Now:
**Use Option 1 (Expo Go)** - Fastest way to test on your phone

### For Proper Testing (Recommended):
**Use Option 2 (Development Build)** - Best balance of speed and features

### For Final Testing:
**Use Option 3 (TestFlight)** - What you're already planning

---

## 🔧 Quick Start: Expo Go

```bash
# 1. Make sure you're on the same WiFi
# 2. Start dev server
npm start

# 3. On your iPhone:
#    - Open Expo Go app
#    - Scan the QR code shown in terminal
#    - App loads!
```

**Note:** If QR code doesn't work, you can also:
- Type the URL manually in Expo Go
- Use the "Enter URL manually" option in Expo Go

---

## 🐛 Troubleshooting

### "Unable to connect to server"
- ✅ Make sure iPhone and Mac are on same WiFi
- ✅ Check firewall isn't blocking connection
- ✅ Try using tunnel mode: `npm start -- --tunnel`

### "Module not found" errors
- Some native modules require a development build (Option 2)
- Expo Go has limitations with certain packages

### Deep links don't work
- Use Option 2 (Development Build) or Option 3 (TestFlight)
- Expo Go can't handle custom URL schemes easily

---

## 💡 Recommendation

**For testing OTP codes right now:**
1. Use **Expo Go** (Option 1) for immediate testing
2. If that works, great! 
3. If you need deep links or full features, use **Development Build** (Option 2)

**For final testing:**
- Use **TestFlight** (Option 3) - which you're already doing ✅




