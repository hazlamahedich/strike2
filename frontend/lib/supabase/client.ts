import { createClient } from '@supabase/supabase-js';

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
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Adding storage options for more reliable session persistence
    storage: {
      getItem: (key) => {
        try {
          const storedData = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
          if (process.env.NODE_ENV === 'development') {
            console.log(`Supabase storage: Getting item ${key}`, storedData ? 'found' : 'not found');
          }
          return storedData ? JSON.parse(storedData) : null;
        } catch (error) {
          console.error('Error getting item from storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(value));
            if (process.env.NODE_ENV === 'development') {
              console.log(`Supabase storage: Setting item ${key}`);
            }
          }
        } catch (error) {
          console.error('Error setting item in storage:', error);
        }
      },
      removeItem: (key) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
            if (process.env.NODE_ENV === 'development') {
              console.log(`Supabase storage: Removing item ${key}`);
            }
          }
        } catch (error) {
          console.error('Error removing item from storage:', error);
        }
      },
    },
  },
  // Configure global headers
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