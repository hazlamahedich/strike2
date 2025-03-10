'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';

type AuthContextType = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  signUpWithCredentials: (email: string, password: string, name: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  user: Session['user'] | null;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "unauthenticated",
  signInWithCredentials: async () => {},
  signUpWithCredentials: async () => {},
  signOutUser: async () => {},
  resetPassword: async () => {},
  isLoading: false,
  signUp: async () => {},
  user: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user || null;

  // Sign in function
  const signInWithCredentials = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error.message);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function - this will need to call your API
  const signUpWithCredentials = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      // Call your API to register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(data.message || 'Registration failed');
      }
      
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/auth/verification-sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for signUpWithCredentials for backward compatibility
  const signUp = signUpWithCredentials;

  // Sign out function
  const signOutUser = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      
      toast.success('Logged out successfully');
      
      // Use a small timeout to ensure state is updated before redirect
      setTimeout(() => {
        router.push('/auth/login');
      }, 300);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function - this will need to call your API
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      // Call your API to send a reset password email
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to send reset email' }));
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        status,
        signInWithCredentials,
        signUpWithCredentials,
        signOutUser,
        resetPassword,
        isLoading,
        signUp,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 