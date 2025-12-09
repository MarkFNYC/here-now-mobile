# Local Testing Guide

## Quick Testing Options

### Option 1: iOS Simulator (Mac - Fastest)
```bash
npm run ios
```
- Opens iOS Simulator automatically
- Hot reloads on code changes
- ⚠️ Photo library access is limited in simulator
- ✅ Name editing works perfectly

### Option 2: Development Build on Physical Device (Best for Photo Testing)

#### Step 1: Build Development Client
```bash
# Build for your connected iOS device
eas build --profile development --platform ios

# Or for Android
eas build --profile development --platform android
```

#### Step 2: Install on Device
- iOS: Download from EAS build page and install via TestFlight or direct install
- Android: Download APK and install

#### Step 3: Start Development Server
```bash
npm start
```

#### Step 4: Connect Device
- Open the development build on your device
- Scan the QR code or enter the URL manually
- The app will connect to your local dev server

### Option 3: Android Emulator
```bash
npm run android
```
- Requires Android Studio and emulator setup
- Photo library access works better than iOS simulator

### Option 4: Web (Quick UI Testing)
```bash
npm run web
```
- Opens in browser
- ⚠️ Photo picker works but limited
- ✅ Good for testing name editing UI

## Testing Your Recent Changes

### Test Photo Selection Fix:
1. Go to Profile → Change Photo
2. Tap "Choose from Library"
3. Select a photo
4. Should now work properly on iOS

### Test Name Editing:
1. Go to Profile → Edit Name
2. Change your name
3. Save
4. Verify name updates in profile

## Troubleshooting

### If photo picker doesn't work:
- Make sure you're using a development build (not Expo Go)
- Check that permissions are granted in device settings
- Try restarting the development server

### If development build fails:
- Make sure you're logged into EAS: `eas login`
- Check your Apple Developer account is set up
- Try building for simulator first: `eas build --profile development --platform ios --local`

