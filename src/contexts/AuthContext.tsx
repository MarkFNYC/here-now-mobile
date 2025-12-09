import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/database';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isProfileComplete: () => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPhoneOTP: (phone: string) => Promise<void>;
  signInWithEmailOTP: (email: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signUpWithPhone: (phone: string, fullName: string) => Promise<void>;
  signUpWithEmail: (email: string, fullName: string) => Promise<void>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  resendOTP: (phone: string) => Promise<void>;
  resendEmailOTP: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading (10 seconds max)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Session check timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000);

    // Handle auth callback from magic links (for web)
    if (typeof window !== 'undefined' && window.location) {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('[Auth] User signed in via magic link/callback');
          setSession(session);
          loadUserProfile(session.user.id);
        }
      });
    }

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        console.error('Error checking session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      clearTimeout(timeoutId);
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      console.log('[Auth] Loading user profile for:', userId);
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 8000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        // If user profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('[Auth] User profile not found, creating...');
          const { data: authUser } = await supabase.auth.getUser();

          if (authUser.user) {
            // Use upsert to handle race conditions where profile might be created between check and insert
            const { error: createError } = await supabase
              .from('users')
              .upsert({
                id: userId,
                phone_or_email: authUser.user.email || authUser.user.phone || '',
                full_name: authUser.user.user_metadata?.full_name || 'User',
                is_verified: false,
                is_on: false,
              }, {
                onConflict: 'id',
              });

            if (createError) {
              console.error('[Auth] Error creating user profile:', createError);
              // If upsert fails, try to fetch the profile again (might have been created by another process)
              if (createError.code === '23505' || createError.code === 'PGRST116') {
                const { data: existingUser } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', userId)
                  .single();
                if (existingUser) {
                  setUser(existingUser);
                  setLoading(false);
                  return;
                }
              }
              throw createError;
            }
            
            // After upsert, fetch the user profile to ensure we have the latest data
            const { data: newUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (fetchError) {
              console.error('[Auth] Error fetching user profile after upsert:', fetchError);
              // If fetch fails, don't set user - let it fall through to login screen
              // The upsert should have created the profile, so next time it will work
            } else if (newUser) {
              setUser(newUser);
            }
          } else {
            console.warn('[Auth] No auth user found, cannot create profile');
          }
        } else {
          console.error('[Auth] Error loading user profile:', error);
          throw error;
        }
      } else {
        console.log('[Auth] User profile loaded successfully');
        setUser(data);
      }
    } catch (error: any) {
      console.error('[Auth] Error loading user profile:', error);
      // On error, still set loading to false to prevent infinite loading
      // User will see login screen if no session, or we'll retry
    } finally {
      console.log('[Auth] Setting loading to false');
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signInWithPhoneOTP(phone: string) {
    // Normalize phone number (ensure it starts with +)
    let normalizedPhone = phone.replace(/\s|-|\(|\)/g, '');
    if (!normalizedPhone.startsWith('+')) {
      // If no country code, assume US (+1)
      normalizedPhone = '+1' + normalizedPhone;
    }
    
    console.log('[Auth] Signing in with phone:', normalizedPhone);
    
    // Sign in with phone OTP (works for both existing and new users)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      console.error('[Auth] Phone login error:', error);
      throw error;
    }
    
    console.log('[Auth] Phone OTP sent successfully');
  }

  async function signInWithEmailOTP(email: string) {
    console.log('[Auth] Signing in with email:', email);
    
    // Sign in with email OTP (works for both existing and new users)
    // Note: We don't include emailRedirectTo to ensure OTP codes are sent instead of magic links
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      console.error('[Auth] Email login error:', error);
      throw error;
    }
    
    console.log('[Auth] Email OTP sent successfully');
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        phone_or_email: email,
        full_name: fullName,
        is_verified: false,
        is_on: false,
      });

      if (profileError) throw profileError;
    }
  }

  async function signUpWithPhone(phone: string, fullName: string) {
    // Normalize phone number (ensure it starts with +)
    let normalizedPhone = phone.replace(/\s|-|\(|\)/g, '');
    if (!normalizedPhone.startsWith('+')) {
      // If no country code, assume US (+1)
      normalizedPhone = '+1' + normalizedPhone;
    }
    
    console.log('[Auth] Signing up with phone:', normalizedPhone);
    
    // Sign up with phone number (SMS verification)
    // signInWithOtp works for both signup and login
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('[Auth] Phone signup error:', error);
      
      // Provide helpful error messages for common issues
      let errorMessage = error.message;
      if (error.message?.includes('phone') || error.message?.includes('SMS')) {
        if (error.message?.includes('provider') || error.message?.includes('not enabled')) {
          errorMessage = 'Phone authentication is not enabled. Please contact support or use email signup.';
        } else if (error.message?.includes('invalid') || error.message?.includes('format')) {
          errorMessage = 'Invalid phone number format. Please use format: +1234567890';
        } else if (error.message?.includes('Twilio') || error.message?.includes('SMS provider')) {
          errorMessage = 'SMS service not configured. Please use email signup or contact support.';
        } else {
          errorMessage = `Phone signup failed: ${error.message}. Try email signup instead.`;
        }
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.name = error.name;
      throw enhancedError;
    }
    
    console.log('[Auth] Phone OTP sent successfully');
    console.log('[Auth] Data:', data);
  }

  async function signUpWithEmail(email: string, fullName: string) {
    console.log('[Auth] Signing up with email:', email);
    
    // Sign up with email OTP (6-digit code)
    // Note: We don't include emailRedirectTo to ensure OTP codes are sent instead of magic links
    // This requires Supabase to be configured to send OTP codes
    // Go to: Supabase Dashboard > Authentication > Email Templates > OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          full_name: fullName,
        },
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('[Auth] Email signup error:', error);
      throw error;
    }
    
    console.log('[Auth] Email OTP sent successfully');
  }

  async function verifyPhoneOTP(phone: string, token: string) {
    // Normalize phone number (ensure it starts with +)
    let normalizedPhone = phone.replace(/\s|-|\(|\)/g, '');
    if (!normalizedPhone.startsWith('+')) {
      // If no country code, assume US (+1)
      normalizedPhone = '+1' + normalizedPhone;
    }
    
    console.log('[Auth] Verifying phone OTP:', normalizedPhone);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'sms',
      });

      if (error) {
        console.error('[Auth] Phone OTP verification error:', error);
        throw error;
      }

      if (data.user) {
        console.log('[Auth] Phone OTP verified successfully, user:', data.user.id);
        // Create or update user profile after successful verification
        const fullName = data.user.user_metadata?.full_name || 'User';
        
        try {
          const { error: profileError } = await supabase.from('users').upsert({
            id: data.user.id,
            phone_or_email: normalizedPhone,
            full_name: fullName,
            is_verified: false, // ID verification is separate (Story 47)
            is_on: false,
          }, {
            onConflict: 'id',
          });

          if (profileError) {
            console.error('[Auth] Profile creation error:', profileError);
            // Don't throw - profile might already exist, try to load it
          }

          // Load the user profile with timeout protection
          // Use Promise.race to prevent hanging
          const loadProfilePromise = loadUserProfile(data.user.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile load timeout')), 10000)
          );

          try {
            await Promise.race([loadProfilePromise, timeoutPromise]);
          } catch (loadError: any) {
            console.warn('[Auth] Profile load failed or timed out:', loadError);
            // Don't throw - auth succeeded, profile will load on next app start
            // The session is valid, so user will be logged in
          }
        } catch (profileError: any) {
          console.error('[Auth] Error during profile setup:', profileError);
          // Don't throw - OTP verification succeeded, profile issues are non-critical
        }
      }
    } catch (error: any) {
      console.error('[Auth] Phone OTP verification failed:', error);
      throw error;
    }
  }

  async function verifyEmailOTP(email: string, token: string) {
    console.log('[Auth] Verifying email OTP:', email);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        console.error('[Auth] Email OTP verification error:', error);
        throw error;
      }

      if (data.user) {
        console.log('[Auth] Email OTP verified successfully, user:', data.user.id);
        // Create or update user profile after successful verification
        const fullName = data.user.user_metadata?.full_name || 'User';
        
        try {
          const { error: profileError } = await supabase.from('users').upsert({
            id: data.user.id,
            phone_or_email: email,
            full_name: fullName,
            is_verified: false, // ID verification is separate (Story 47)
            is_on: false,
          }, {
            onConflict: 'id',
          });

          if (profileError) {
            console.error('[Auth] Profile creation error:', profileError);
            // Don't throw - profile might already exist, try to load it
          }

          // Load the user profile with timeout protection
          // Use Promise.race to prevent hanging
          const loadProfilePromise = loadUserProfile(data.user.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile load timeout')), 10000)
          );

          try {
            await Promise.race([loadProfilePromise, timeoutPromise]);
          } catch (loadError: any) {
            console.warn('[Auth] Profile load failed or timed out:', loadError);
            // Don't throw - auth succeeded, profile will load on next app start
            // The session is valid, so user will be logged in
          }
        } catch (profileError: any) {
          console.error('[Auth] Error during profile setup:', profileError);
          // Don't throw - OTP verification succeeded, profile issues are non-critical
        }
      }
    } catch (error: any) {
      console.error('[Auth] Email OTP verification failed:', error);
      throw error;
    }
  }

  async function resendOTP(phone: string) {
    let normalizedPhone = phone.replace(/\s|-|\(|\)/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+1' + normalizedPhone;
    }
    
    console.log('[Auth] Resending phone OTP:', normalizedPhone);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      console.error('[Auth] Resend phone OTP error:', error);
      throw error;
    }
    
    console.log('[Auth] Phone OTP resent successfully');
  }

  async function resendEmailOTP(email: string) {
    console.log('[Auth] Resending email OTP:', email);
    
    // Note: We don't include emailRedirectTo to ensure OTP codes are sent instead of magic links
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('[Auth] Resend email OTP error:', error);
      throw error;
    }
    
    console.log('[Auth] Email OTP resent successfully');
  }

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  }

  function isProfileComplete(): boolean {
    if (!user) return false;
    // Profile is complete when:
    // - activity_tags exists and has at least 1 tag (required)
    // - neighbourhood exists and is not empty (required)
    // - photo_url and bio are optional
    const hasActivityTags = Boolean(user.activity_tags && user.activity_tags.length > 0);
    const hasNeighbourhood = Boolean(user.neighbourhood && user.neighbourhood.trim().length > 0);
    return Boolean(hasActivityTags && hasNeighbourhood);
  }

  const value = {
    user,
    session,
    loading,
    isProfileComplete,
    signIn,
    signInWithPhoneOTP,
    signInWithEmailOTP,
    signUp,
    signUpWithPhone,
    signUpWithEmail,
    verifyPhoneOTP,
    verifyEmailOTP,
    resendOTP,
    resendEmailOTP,
    refreshUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
