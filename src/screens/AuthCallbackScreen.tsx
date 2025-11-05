import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthCallbackScreenProps {
  navigation?: any;
}

export default function AuthCallbackScreen({ navigation }: AuthCallbackScreenProps) {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we're on web and have URL hash parameters
        if (typeof window !== 'undefined') {
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
                window.history.replaceState(null, '', window.location.pathname);
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
                window.history.replaceState(null, '', window.location.pathname);
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
          // For mobile, Supabase should handle this via deep linking
          console.log('[AuthCallback] Mobile platform, checking session');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[AuthCallback] Error getting session:', sessionError);
            return;
          }

          if (session) {
            console.log('[AuthCallback] Session exists on mobile');
            await refreshUser();
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

    return () => clearTimeout(timer);
  }, [refreshUser]);

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

