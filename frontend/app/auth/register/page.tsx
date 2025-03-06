'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';
import supabase from '@/lib/supabase/client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { signUp, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDebugInfo(null);
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Creating your account...');
      
      // Log registration attempt
      console.log(`Attempting to register with email: ${email}`);
      setDebugInfo(`Attempting Supabase registration for: ${email}`);
      
      // Note: We can't check for existing users client-side with Supabase
      // The signUp function will handle the case if the email already exists
      
      await signUp(email, password, name);
      
      // The useAuth hook will handle the redirect and success message
      toast.dismiss();
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.dismiss();
      
      // Set a more user-friendly error message based on the error type
      if (error?.message) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setErrorMessage('An account with this email already exists. Please use a different email or try to log in.');
        } else if (error.message.includes('Password should be')) {
          setErrorMessage(error.message); // Password policy errors should be shown as-is
        } else if (error.message.includes('requires a valid email')) {
          setErrorMessage('Please enter a valid email address.');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          setErrorMessage('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('Database error')) {
          setErrorMessage('There was an issue with our database. Your account has been created using a fallback method. You can log in, but some features may be limited.');
          
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setErrorMessage(`Registration failed: ${error.message}`);
        }
        
        // Add debug info
        setDebugInfo(`Error: ${error.message}`);
        
        // Add more detailed debug info in development
        if (process.env.NODE_ENV === 'development') {
          if (error.code) setDebugInfo(prev => `${prev}, Code: ${error.code}`);
          if (error.status) setDebugInfo(prev => `${prev}, Status: ${error.status}`);
          if (error.details) setDebugInfo(prev => `${prev}, Details: ${JSON.stringify(error.details)}`);
        }
      } else {
        setErrorMessage('Registration failed. Please try again later.');
      }
      console.error('Registration failed:', error);
    }
  };

  // Helper function to check password strength
  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong', message: string } => {
    if (!password) {
      return { strength: 'weak', message: 'Enter a password' };
    }
    
    if (password.length < 8) {
      return { strength: 'weak', message: 'Password is too short' };
    }
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    
    if (criteriaCount <= 2) {
      return { strength: 'weak', message: 'Weak password' };
    } else if (criteriaCount === 3) {
      return { strength: 'medium', message: 'Medium strength password' };
    } else {
      return { strength: 'strong', message: 'Strong password' };
    }
  };
  
  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      {/* Background gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
      </div>
      
      {/* Main content container with improved centering */}
      <div className="w-full max-w-md z-10 mx-auto">
        {/* Logo and header section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary mb-4">
            <span className="text-primary-foreground text-xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold">Strike</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>
        
        {/* Registration card with improved spacing */}
        <Card className="animate-slide-up hover-lift shadow-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Register</CardTitle>
            <CardDescription>Create a new account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
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
                {password && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            passwordStrength.strength === 'weak' ? 'w-1/3 bg-destructive' : 
                            passwordStrength.strength === 'medium' ? 'w-2/3 bg-amber-500' : 
                            'w-full bg-green-500'
                          }`} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{passwordStrength.message}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full font-medium" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
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
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
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
          By creating an account, you agree to our{' '}
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