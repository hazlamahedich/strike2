import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Ensure environment variables are properly loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Log Supabase initialization in development
if (process.env.NODE_ENV === 'development') {
  console.log('Initializing Supabase client with URL:', supabaseUrl);
}

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 
      'X-Client-Info': 'strike-app' 
    },
  },
});

// Add event listeners for auth events in development
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth event:', event, session ? 'with session' : 'no session');
  });
}

export default supabase; 