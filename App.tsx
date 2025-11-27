import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';
import ProfileCreationNavigator from './src/navigation/ProfileCreationNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AuthCallbackScreen from './src/screens/AuthCallbackScreen';
import { RootStackParamList, AuthStackParamList } from './src/types/navigation';
import { hasValidCredentials } from './src/lib/supabase';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignUpScreen} />
      <AuthStack.Screen name="AuthCallback" component={AuthCallbackScreen} />
    </AuthStack.Navigator>
  );
}

function AppContent() {
  const { user, loading, isProfileComplete } = useAuth();
  const [showCallback, setShowCallback] = React.useState(false);

  React.useEffect(() => {
    // Check if we're on the callback URL (for web)
    if (typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      // Check if we're on /auth/callback or have auth tokens in the hash
      if (path.includes('/auth/callback') || (hash && hash.includes('access_token'))) {
        setShowCallback(true);
      }
    }
  }, []);

  // Clear callback flag once user is loaded (authentication completed)
  React.useEffect(() => {
    if (user && showCallback) {
      setShowCallback(false);
    }
  }, [user, showCallback]);

  if (loading && !showCallback) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  // If we're on the callback route, show the callback screen directly
  if (showCallback) {
    return <AuthCallbackScreen />;
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  // Check if profile is complete
  if (!isProfileComplete()) {
    return <ProfileCreationNavigator />;
  }

  return <MainNavigator />;
}

export default function App() {
  console.log('[App] Starting app...');
  
  // Check if Supabase credentials are valid
  if (!hasValidCredentials()) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 }}>
          Configuration Error
        </Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 10 }}>
          Missing Supabase credentials. Please check:
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 12, marginBottom: 4 }}>
          • .env file exists with EXPO_PUBLIC_SUPABASE_URL
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 12 }}>
          • EXPO_PUBLIC_SUPABASE_ANON_KEY is set
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 10, marginTop: 20 }}>
          Check the browser console for detailed error messages
        </Text>
      </View>
    );
  }

  try {
    // Configure deep linking for web callbacks
    const linking = {
      prefixes: ['herenow://', 'http://localhost:8081', 'https://localhost:8081'],
    };

    return (
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <AppContent />
            <StatusBar style="dark" />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    );
  } catch (error: any) {
    console.error('[App] Error rendering app:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 10 }}>
          App Error
        </Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 10 }}>
          {error?.message || 'An unexpected error occurred'}
        </Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 12 }}>
          Check the console for more details
        </Text>
      </View>
    );
  }
}
