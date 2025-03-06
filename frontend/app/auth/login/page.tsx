'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';
import supabase from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { signIn, isLoading } = useAuth();
  const router = useRouter();

  // Check for existing session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setDebugInfo(`Session check error: ${error.message}`);
          return;
        }
        
        if (session) {
          setDebugInfo(`Active session found for: ${session.user.email}`);
        } else {
          // Check if we have a local storage user
          const localUser = localStorage.getItem('strike_app_user');
          if (localUser) {
            setDebugInfo('No Supabase session, but local user found');
          } else {
            setDebugInfo('No active session found');
          }
        }
      } catch (error: any) {
        setDebugInfo(`Error checking session: ${error.message}`);
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDebugInfo(null);
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Signing in...');
      
      // Log authentication attempt
      console.log(`Attempting to sign in with email: ${email}`);
      setDebugInfo(`Attempting Supabase authentication for: ${email}`);
      
      await signIn(email, password);
      
      // The useAuth hook will handle the redirect and success message
      toast.dismiss();
    } catch (error: any) {
      toast.dismiss();
      
      // Set a more user-friendly error message based on the error type
      if (error?.message) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Please verify your email address before logging in. Check your inbox for a verification email.');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          setErrorMessage('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('Database error')) {
          setErrorMessage('There was an issue connecting to our database. We\'re using a fallback authentication method. Some features may be limited.');
        } else {
          setErrorMessage(`Login failed: ${error.message}`);
        }
        
        // Add debug info
        setDebugInfo(`Error: ${error.message}`);
        
        // Add more detailed debug info in development
        if (process.env.NODE_ENV === 'development') {
          if (error.code) setDebugInfo(prev => `${prev}, Code: ${error.code}`);
          if (error.status) setDebugInfo(prev => `${prev}, Status: ${error.status}`);
        }
      } else {
        setErrorMessage('Login failed. Please check your credentials and try again.');
      }
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
      </div>
      
      <div className="w-full max-w-md z-10 mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
            <span className="text-primary-foreground text-xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold">Strike</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        <Card className="animate-slide-up hover-lift shadow-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full font-medium" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            {/* Debug information (only in development) */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div className="mt-4 p-2 border border-dashed border-amber-300 rounded text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400">
                <p className="font-mono">Debug: {debugInfo}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center w-full text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="w-1/2" disabled={isLoading}>
                Google
              </Button>
              <Button variant="outline" className="w-1/2" disabled={isLoading}>
                Microsoft
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
} 