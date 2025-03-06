'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import supabase from '../supabase/client';
import apiClient from '../api/client';
import { logSupabaseAuthError, logAuthState } from '../utils/debugUtils';
import { createUserProfile } from '../utils/databaseUtils';

// Define user type
type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

// Define auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

// Local storage keys
const LOCAL_STORAGE_USER_KEY = 'strike_app_user';
const LOCAL_STORAGE_TEMP_USERS_KEY = 'strike_app_temp_users';

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Log auth state for debugging in development
        if (process.env.NODE_ENV === 'development') {
          logAuthState();
        }
        
        // First check if we have an active Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting Supabase session:', sessionError);
          if (process.env.NODE_ENV === 'development') {
            logSupabaseAuthError(sessionError, 'getSession');
          }
        }
        
        if (session) {
          console.log('Found active Supabase session');
          
          // Set token in API client
          apiClient.setAuthToken(session.access_token);
          
          // Set user state from Supabase user data
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role || 'user',
          });
          
          // Store user in local storage for our app
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              role: session.user.user_metadata?.role || 'user',
            }));
          }
          
          setIsLoading(false);
          return;
        }
        
        // If no Supabase session, check local storage for temporary auth
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Set token in API client if we have one (for real auth)
            if (parsedUser.token) {
              apiClient.setAuthToken(parsedUser.token);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (process.env.NODE_ENV === 'development') {
          logSupabaseAuthError(error, 'initialization');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (session) {
          // Set token in API client
          apiClient.setAuthToken(session.access_token);
          
          // Update user state
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role || 'user',
          };
          
          setUser(userData);
          
          // Store in local storage
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
          }
        } else {
          // Clear auth state
          apiClient.clearAuthToken();
          setUser(null);
          
          // Clear local storage
          if (typeof window !== 'undefined') {
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Dismiss any existing toasts to prevent looping
      toast.dismiss();
      
      // TEMPORARY WORKAROUND: Check local storage for registered users
      // We'll keep this as a fallback but prioritize Supabase auth
      if (typeof window !== 'undefined') {
        const tempUsers = localStorage.getItem(LOCAL_STORAGE_TEMP_USERS_KEY);
        if (tempUsers) {
          const users = JSON.parse(tempUsers);
          const foundUser = users.find((u: any) => 
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );
          
          if (foundUser) {
            // Create user object without password
            const userObj = {
              id: foundUser.id,
              email: foundUser.email,
              name: foundUser.name,
              role: 'user',
              usingTempAuth: true // Flag to indicate temporary auth
            };
            
            // Store in local storage
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userObj));
            
            // Update state
            setUser(userObj);
            
            toast.success('Login successful (using temporary authentication)');
            router.push('/dashboard');
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Try Supabase auth
      console.log('Attempting Supabase sign in for:', email);
      
      // Show loading toast
      toast.loading('Signing in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Dismiss the loading toast
      toast.dismiss();
      
      if (error) {
        console.error('Supabase sign in error:', error);
        if (process.env.NODE_ENV === 'development') {
          logSupabaseAuthError(error, 'signIn');
        }
        
        throw error;
      }
      
      if (data.session) {
        // Set token in API client
        apiClient.setAuthToken(data.session.access_token);
        
        // Create user object
        const userObj = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role || 'user',
          usingTempAuth: false // Flag to indicate real auth
        };
        
        // Store in local storage
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userObj));
        
        // Update state
        setUser(userObj);
        
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Dismiss any loading toasts
      toast.dismiss();
      
      // Provide more specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please confirm your email before logging in.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Login failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      // Dismiss any existing toasts to prevent looping
      toast.dismiss();
      
      // Show loading toast
      toast.loading('Creating your account...');
      
      // TEMPORARY WORKAROUND: Check if user already exists in local storage
      if (typeof window !== 'undefined') {
        const tempUsers = localStorage.getItem(LOCAL_STORAGE_TEMP_USERS_KEY);
        if (tempUsers) {
          const users = JSON.parse(tempUsers);
          const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          
          if (existingUser) {
            toast.dismiss();
            toast.error('An account with this email already exists. Please try logging in instead.');
            throw new Error('User with this email already exists');
          }
        }
      }
      
      // Try Supabase auth with retry logic
      console.log('Attempting Supabase sign up for:', email);
      
      let supabaseSuccess = false;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (!supabaseSuccess && retryCount <= maxRetries) {
        try {
          // Add a small delay to ensure we don't hit rate limits (increase delay with each retry)
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
          
          console.log(`Supabase signup attempt ${retryCount + 1} of ${maxRetries + 1}`);
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { 
                name,
                role: 'user'
              }
            }
          });
          
          if (error) {
            console.error(`Supabase sign up error (attempt ${retryCount + 1}):`, error);
            console.log('Error details:', {
              code: error.code,
              message: error.message,
              status: error.status
            });
            
            // Check if it's a database error
            if (error.message?.includes('Database error')) {
              // This is likely a temporary issue, so we'll retry
              retryCount++;
              continue;
            }
            
            // Check if the error contains a message about the user already existing
            if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
              toast.dismiss();
              toast.error('An account with this email already exists. Please try logging in instead.');
              throw new Error('User with this email already exists');
            } else {
              toast.dismiss();
              toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
              throw error;
            }
          }
          
          if (data.user) {
            console.log('Supabase sign up successful, user data:', data.user);
            supabaseSuccess = true;
            
            // Try to create user profile
            try {
              console.log('Attempting to create profile for user:', data.user.id);
              const profileResult = await createUserProfile(data.user.id, email, name);
              console.log('Profile creation result:', profileResult);
              
              if (profileResult.success) {
                console.log('User profile created successfully or will be created later:', profileResult.message);
              } else {
                console.warn('Could not create user profile:', profileResult.message);
                // Don't throw an error here, just log it and continue
              }
            } catch (profileError: any) {
              console.error('Error creating profile:', profileError?.message || JSON.stringify(profileError));
              // Continue with auth flow even if profile creation fails
            }
            
            // Check if email confirmation is required
            if (data.session) {
              // Auto-confirmed email, user is signed in
              toast.dismiss();
              toast.success('Registration successful! You are now logged in.');
              
              // Set token in API client
              apiClient.setAuthToken(data.session.access_token);
              
              // Create user object
              const userObj = {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.user_metadata?.name,
                role: data.user.user_metadata?.role || 'user',
                usingTempAuth: false
              };
              
              // Update state
              setUser(userObj);
              
              // Store in local storage
              if (typeof window !== 'undefined') {
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userObj));
              }
              
              router.push('/dashboard');
            } else {
              // Email confirmation required
              toast.dismiss();
              toast.success('Registration successful! Please check your email to confirm your account.');
              
              // Store in temporary users for fallback
              try {
                if (typeof window !== 'undefined') {
                  // Get existing temp users or create new array
                  const existingTempUsers = localStorage.getItem(LOCAL_STORAGE_TEMP_USERS_KEY);
                  const users = existingTempUsers ? JSON.parse(existingTempUsers) : [];
                  
                  // Add new user
                  const newUser = {
                    id: data.user.id,
                    email,
                    password, // WARNING: This is not secure, only for temporary workaround
                    name,
                    createdAt: new Date().toISOString()
                  };
                  
                  // Add to users array
                  users.push(newUser);
                  
                  // Save back to local storage
                  localStorage.setItem(LOCAL_STORAGE_TEMP_USERS_KEY, JSON.stringify(users));
                  
                  console.log('User saved to local storage as fallback');
                }
              } catch (localStorageError) {
                console.error('Error saving to local storage:', localStorageError);
              }
              
              router.push('/auth/login');
            }
            
            break; // Exit the retry loop on success
          }
        } catch (error: any) {
          console.error(`Signup error (attempt ${retryCount + 1}):`, error);
          
          // Check if it's a network error
          if (error.message?.includes('fetch') || error.message?.includes('network')) {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`Network error, retrying (${retryCount}/${maxRetries})...`);
              continue;
            }
          }
          
          // For other errors, stop retrying
          toast.dismiss();
          toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
          throw error;
        }
      }
      
      // If we've exhausted retries without success, fall back to local storage
      if (!supabaseSuccess) {
        console.log('Supabase signup failed after retries, using local storage fallback');
        
        // Create a temporary user in local storage
        if (typeof window !== 'undefined') {
          // Get existing temp users or create new array
          const existingTempUsers = localStorage.getItem(LOCAL_STORAGE_TEMP_USERS_KEY);
          const users = existingTempUsers ? JSON.parse(existingTempUsers) : [];
          
          // Add new user
          const newUser = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            email,
            password, // WARNING: This is not secure, only for temporary workaround
            name,
            createdAt: new Date().toISOString()
          };
          
          // Add to users array
          users.push(newUser);
          
          // Save back to local storage
          localStorage.setItem(LOCAL_STORAGE_TEMP_USERS_KEY, JSON.stringify(users));
          
          // Create user object without password
          const userObj = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: 'user',
            usingTempAuth: true
          };
          
          // Store in local storage
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userObj));
          
          // Update state
          setUser(userObj);
          
          toast.dismiss();
          toast.success('Account created using fallback method. Some features may be limited.');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setIsLoading(false);
      
      // Make sure loading toast is dismissed
      toast.dismiss();
      
      // Don't show another error toast if we've already shown one
      if (!error.message?.includes('already exists')) {
        toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear local storage user
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear token from API client
      apiClient.clearAuthToken();
      
      // Clear user state
      setUser(null);
      
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      // TEMPORARY WORKAROUND: For local users, just show a message
      if (typeof window !== 'undefined') {
        const tempUsers = localStorage.getItem(LOCAL_STORAGE_TEMP_USERS_KEY);
        if (tempUsers) {
          const users = JSON.parse(tempUsers);
          const userExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
          
          if (userExists) {
            toast.success('If you have a local account, you would need to create a new one as this is a temporary solution.');
            return;
          }
        }
      }
      
      // Try Supabase password reset for real users
      console.log('Requesting password reset for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth; 