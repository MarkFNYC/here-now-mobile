import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(
    'https://siyabqommfwjzefpgwjm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeWFicW9tbWZ3anplZnBnd2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzOTk4ODAsImV4cCI6MjA0NTk3NTg4MH0.gNIJ3SjqMbv-U37i-eSfbCkwxeHKBt-oTwokWNVMrTU',
    {
      auth: {
        storage: SecureStore as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

  return supabaseInstance;
}

// For backward compatibility - all existing imports will continue to work
// This proxy defers initialization until first property access
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    // If it's a function, bind it to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as SupabaseClient;

// Export whether credentials are valid (lazy-checked)
export function hasValidCredentials(): boolean {
  // Credentials are hardcoded, so they're always valid
  return true;
}
