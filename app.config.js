// Hardcode Supabase credentials directly
// process.env is empty during EAS builds, so we hardcode the values here
const supabaseUrl = 'https://siyabqommfwjzefpgwjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeWFicW9tbWZ3anplZnBnd2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzOTk4ODAsImV4cCI6MjA0NTk3NTg4MH0.gNIJ3SjqMbv-U37i-eSfbCkwxeHKBt-oTwokWNVMrTU';

export default {
  expo: {
    name: "here-now-mobile",
    slug: "here-now-mobile",
    scheme: "herenow",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.markynyc.herenowmobile",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Required for expo-location
        NSLocationWhenInUseUsageDescription: "This app needs your location to show nearby activities and connect you with people in your area.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs your location to show nearby activities and connect you with people in your area.",
        // Required for expo-image-picker
        NSCameraUsageDescription: "This app needs access to your camera to take profile photos.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to select profile photos.",
        NSPhotoLibraryAddUsageDescription: "This app needs access to save photos to your library."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.markynyc.herenowmobile"
    },
    web: {
      favicon: "./assets/favicon.png",
      build: {
        env: {
          EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
          EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
        }
      }
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: "https://siyabqommfwjzefpgwjm.supabase.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeWFicW9tbWZ3anplZnBnd2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzOTk4ODAsImV4cCI6MjA0NTk3NTg4MH0.gNIJ3SjqMbv-U37i-eSfbCkwxeHKBt-oTwokWNVMrTU",
      eas: {
        projectId: "12ea2d88-43c3-4e98-99e1-6a20da0c4915"
      }
    },
    owner: "markynyc"
  }
};
