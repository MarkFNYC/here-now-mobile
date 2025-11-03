# Here Now - Mobile App

React Native mobile application for Here Now, a location-based social platform for spontaneous real-world connections.

## 🚀 Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation (Bottom Tabs + Stack)
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **State Management:** React Context API (planned)
- **Location Services:** expo-location
- **Authentication:** Supabase Auth

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your iOS/Android device (for testing)
- OR iOS Simulator (Mac) / Android Emulator

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase project details:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase Dashboard under Settings > API.

### 3. Run the App

```bash
# Start Expo development server
npm start

# Or run directly on specific platform
npm run ios      # iOS Simulator (Mac only)
npm run android  # Android Emulator
npm run web      # Web browser (for quick testing)
```

### 4. Test on Physical Device

1. Install **Expo Go** from App Store or Google Play
2. Run `npm start`
3. Scan the QR code with your device camera (iOS) or Expo Go app (Android)

## 📁 Project Structure

```
here-now-mobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ActivitiesScreen.tsx
│   │   ├── ChatsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation setup
│   │   └── MainNavigator.tsx
│   ├── lib/             # Third-party integrations
│   │   └── supabase.ts
│   ├── types/           # TypeScript types
│   │   ├── database.ts
│   │   └── navigation.ts
│   ├── hooks/           # Custom React hooks
│   └── contexts/        # React Context providers
├── assets/              # Images, fonts, etc.
├── App.tsx              # Root component
├── .env                 # Environment variables (not committed)
└── package.json
```

## 🎯 Current Status

### ✅ Completed
- [x] Project setup with Expo + TypeScript
- [x] Supabase client configuration
- [x] React Navigation with bottom tabs
- [x] Basic screen structure (Home, Activities, Chats, Profile)
- [x] TypeScript types matching database schema
- [x] Toggle UI on Home screen

### 🚧 In Progress
- [ ] Supabase authentication flow
- [ ] Toggle functionality (update user status)
- [ ] Fetch nearby users (Feed)
- [ ] Geolocation services
- [ ] User profile management

### 📅 Planned
- [ ] 1:1 connection requests
- [ ] Pile-on activities
- [ ] Real-time chat
- [ ] Push notifications
- [ ] Image upload for profiles
- [ ] Activity creation

## 🔑 Key Features (From PRD)

### Core Features
1. **Toggle (ON/OFF)** - Control your visibility to nearby users
2. **Feed** - Swipe through nearby users who are ON
3. **Activities** - Browse and create pile-on events
4. **1:1 Connections** - Request to meet specific people
5. **Chat** - Message within connections
6. **Profile** - Manage your interests and bio

## 🗺️ Geolocation

The app uses PostGIS for location-based queries:
- Users must grant location permissions
- Location is stored as `GEOGRAPHY(POINT, 4326)` in Supabase
- Nearby queries use `get_nearby_users()` function (5km default radius)
- Location is only visible when user is "ON"

## 🔒 Security & Privacy

- **RLS Policies:** All database tables have Row Level Security enabled
- **Location Privacy:** Location hidden unless user toggles ON
- **Secure Storage:** Auth tokens stored in Expo SecureStore
- **Blocking:** Users can block others to prevent interaction

## 📱 Screens Overview

### Home Screen
- **Purpose:** Toggle ON/OFF + quick status
- **Key Feature:** Large toggle switch to control availability
- **Future:** Show feed of nearby users when ON

### Activities Screen
- **Purpose:** Browse and create pile-on activities
- **Features:** List/map view, activity cards, create button
- **Future:** Real-time activity updates

### Chats Screen
- **Purpose:** View all active conversations
- **Features:** Message list, unread indicators
- **Future:** Real-time messaging with Supabase subscriptions

### Profile Screen
- **Purpose:** Manage user profile and settings
- **Features:** Bio, interests, usual spots, activity stats
- **Future:** Edit profile, photo upload, settings

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## 🚀 Deployment

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 🔗 Related Repositories

- **Web App:** [v0-here-now-app](https://github.com/MarkFNYC/v0-here-now-app) - Next.js marketing site and admin dashboard
- **Database:** Supabase schema and migrations in `supabase/` folder of web repo

## 📚 Documentation

- [PRD (Product Requirements Document)](../v0-here-now-app/docs/PRD.md)
- [Database Schema Reference](../v0-here-now-app/supabase/SCHEMA_REFERENCE.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)

## 🐛 Troubleshooting

### "Could not connect to Metro"
- Restart Expo: `npm start --clear`
- Check firewall settings
- Try different network (not corporate VPN)

### "Unable to resolve module"
- Clear cache: `npm start --clear`
- Reinstall: `rm -rf node_modules && npm install`

### Location not working
- Grant location permissions in phone settings
- For iOS simulator: Debug > Location > Custom Location
- For Android emulator: Extended controls > Location

### Supabase connection errors
- Check `.env` file has correct credentials
- Verify Supabase project is running (not paused)
- Check RLS policies allow your queries

## 🤝 Development Workflow

1. **Open in Cursor IDE** for AI-assisted development
2. **Run `npm start`** to start Expo dev server
3. **Test on Expo Go** app or simulator
4. **Make changes** - hot reload will update automatically
5. **Commit to Git** when ready
6. **Deploy** via EAS when ready for production

## 📧 Support

For questions or issues:
- Check the PRD for feature specifications
- Review Supabase logs in dashboard
- Test queries in Supabase SQL Editor

---

**Last Updated:** November 2, 2025
**Version:** 0.1.0 (MVP in development)
**React Native Version:** Latest (via Expo)
**Expo SDK:** Latest
