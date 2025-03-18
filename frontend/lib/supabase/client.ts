import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Session } from 'next-auth';

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

// Function to get an authenticated Supabase client
export const getAuthenticatedClient = async (session: Session | null) => {
  try {
    // First try to get the Supabase session directly
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    
    if (supabaseSession) {
      console.log('Using Supabase session for authentication');
      return supabase;
    }
    
    // If no Supabase session, try to use the NextAuth session
    if (!session) {
      console.log('No session available, using anonymous client');
      return supabase;
    }

    // Check if session has a token property
    // We use a type assertion to access potential token properties
    const sessionAny = session as any;
    const token = sessionAny.supabaseAccessToken || 
                  sessionAny.accessToken || 
                  sessionAny.token || 
                  '';
    
    if (!token) {
      console.log('No token found in session, using anonymous client');
      return supabase;
    }
    
    // Create a new client with the session token
    const authenticatedClient = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            'X-Client-Info': 'strike-app',
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    console.log('Created authenticated Supabase client with token');
    return authenticatedClient;
  } catch (error) {
    console.error('Error creating authenticated client:', error);
    return supabase; // Fallback to anonymous client
  }
};

export default supabase; 