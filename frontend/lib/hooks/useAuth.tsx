'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import supabase from '../supabase/client';
import apiClient from '../api/client';

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

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Set token in API client
          apiClient.setAuthToken(session.access_token);
          
          // Try to get user profile from backend
          try {
            const userData = await apiClient.get<User>('/api/auth/me');
            setUser(userData);
          } catch (error) {
            // If backend fails, use Supabase user data
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Set token in API client
          apiClient.setAuthToken(session.access_token);
          
          // Update user state
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
          });
        } else {
          // Clear auth state
          apiClient.clearAuthToken();
          setUser(null);
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        // Set token in API client
        apiClient.setAuthToken(data.session.access_token);
        
        // Try to get user profile from backend
        try {
          const userData = await apiClient.get<User>('/api/auth/me');
          setUser(userData);
        } catch (profileError) {
          // If backend fails, use Supabase user data
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
          });
        }
        
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Login failed. Please check your credentials and try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Also register with backend
        try {
          await apiClient.post('/api/auth/register', {
            email,
            password,
            name,
          });
        } catch (backendError) {
          console.error('Backend registration error:', backendError);
          // Continue anyway since we registered with Supabase
        }
        
        toast.success('Registration successful! Please check your email to verify your account.');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
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