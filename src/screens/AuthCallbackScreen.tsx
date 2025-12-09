import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthCallbackScreenProps {
  navigation?: any;
  route?: any;
}

export default function AuthCallbackScreen({ navigation: navProp, route: routeProp }: AuthCallbackScreenProps) {
  const { refreshUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const handleAuthCallback = async (initialUrl?: string) => {
      try {
        // Check for deep link parameters from route
        const routeParams = (route.params || {}) as any;
        let accessToken = routeParams.access_token;
        let refreshToken = routeParams.refresh_token;
        
        // If we have an initial URL from deep link, parse it
        if (initialUrl) {
          console.log('[AuthCallback] Processing deep link URL:', initialUrl);
          try {
            const url = new URL(initialUrl);
            accessToken = url.searchParams.get('access_token') || url.hash.split('access_token=')[1]?.split('&')[0];
            refreshToken = url.searchParams.get('refresh_token') || url.hash.split('refresh_token=')[1]?.split('&')[0];
          } catch (e) {
            console.warn('[AuthCallback] Error parsing deep link URL:', e);
          }
        }

        // Check if we're on web and have URL hash parameters
        if (typeof window !== 'undefined' && window.location?.hash) {
          const hash = window.location.hash;
          
          if (hash && hash.includes('access_token')) {
            console.log('[AuthCallback] Processing callback URL hash');
            
            // Parse hash parameters
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const error = hashParams.get('error');
            const errorDescription = hashParams.get('error_description');

            if (error) {
              console.error('[AuthCallback] Error from callback:', error, errorDescription);
              // Could show error message or redirect to login
              return;
            }

            if (accessToken && refreshToken) {
              console.log('[AuthCallback] Setting session with tokens from URL');
              
              // Set the session using the tokens from the URL
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('[AuthCallback] Error setting session:', sessionError);
                return;
              }

              if (data.session) {
                console.log('[AuthCallback] Session set successfully, user:', data.session.user.id);
                
                // Refresh user data - this will trigger navigation in App.tsx
                await refreshUser();
                
                // Clear the URL hash to clean up
                if (typeof window !== 'undefined' && window.history && window.location) {
                  window.history.replaceState(null, '', window.location.pathname || '');
                }
              }
            } else {
              console.log('[AuthCallback] No tokens in hash, checking existing session');
              
              // Try to get session from Supabase (it might have already detected it)
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) {
                console.error('[AuthCallback] Error getting session:', sessionError);
                return;
              }

              if (session) {
                console.log('[AuthCallback] Session already exists');
                await refreshUser();
                
                // Clear the URL hash
                if (typeof window !== 'undefined' && window.history && window.location) {
                  window.history.replaceState(null, '', window.location.pathname || '');
                }
              } else {
                console.warn('[AuthCallback] No session found and no tokens in URL');
              }
            }
          } else {
            // No hash parameters, just check for existing session
            console.log('[AuthCallback] No hash parameters, checking existing session');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('[AuthCallback] Error getting session:', sessionError);
              return;
            }

            if (session) {
              console.log('[AuthCallback] Session exists');
              await refreshUser();
            }
          }
        } else {
          // For mobile, handle deep link parameters or check session
          console.log('[AuthCallback] Mobile platform');
          
          // If we have tokens from deep link, use them
          if (accessToken && refreshToken) {
            console.log('[AuthCallback] Setting session from deep link tokens');
            
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[AuthCallback] Error setting session from deep link:', sessionError);
              // Fall through to check existing session
            } else if (data.session) {
              console.log('[AuthCallback] Session set from deep link successfully');
              await refreshUser();
              return;
            }
          }
          
          // Otherwise, check for existing session (Supabase might have handled it automatically)
          console.log('[AuthCallback] Checking existing session');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[AuthCallback] Error getting session:', sessionError);
            return;
          }

          if (session) {
            console.log('[AuthCallback] Session exists on mobile');
            await refreshUser();
          } else {
            console.warn('[AuthCallback] No session found on mobile');
          }
        }
      } catch (error) {
        console.error('[AuthCallback] Unexpected error:', error);
      }
    };

    // Small delay to ensure Supabase client is ready
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 100);

    // Listen for deep links on mobile
    const handleDeepLink = (event: { url: string }) => {
      console.log('[AuthCallback] Received deep link:', event.url);
      handleAuthCallback(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[AuthCallback] App opened with deep link:', url);
        handleAuthCallback(url);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [refreshUser, route.params]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.text}>Completing sign in...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#6b7280',
  },
});

