'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import supabase from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have the necessary parameters in the URL
    if (!searchParams?.has('token_hash')) {
      setErrorMessage('Invalid password reset link. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    const passwordStrength = getPasswordStrength(password);
    if (passwordStrength.strength === 'weak') {
      setErrorMessage(passwordStrength.message);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get the token hash from the URL
      const tokenHash = searchParams?.get('token_hash');
      
      if (!tokenHash) {
        throw new Error('Invalid password reset link');
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success('Password has been reset successfully!');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong', message: string } => {
    if (password.length < 8) {
      return { 
        strength: 'weak', 
        message: 'Password must be at least 8 characters long' 
      };
    }
    
    let score = 0;
    
    // Check for mixed case
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    }
    
    // Check for numbers
    if (/\d/.test(password)) {
      score += 1;
    }
    
    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    }
    
    if (score === 0) {
      return { 
        strength: 'weak', 
        message: 'Password is too weak. Add uppercase letters, numbers, or special characters.' 
      };
    } else if (score === 1) {
      return { 
        strength: 'medium', 
        message: 'Password strength is medium. Consider adding more variety.' 
      };
    } else {
      return { 
        strength: 'strong', 
        message: 'Password strength is strong.' 
      };
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : { strength: 'weak', message: '' };
  const strengthPercentage = 
    password.length === 0 ? 0 :
    passwordStrength.strength === 'weak' ? 33 :
    passwordStrength.strength === 'medium' ? 66 : 100;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl opacity-50 animate-pulse-subtle" />
        </div>
        
        <div className="w-full max-w-md z-10 mx-auto">
          <Card className="animate-slide-up hover-lift shadow-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Password Reset Successful</CardTitle>
              <CardDescription>Your password has been updated</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mb-4">
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/auth/login">
                <Button>Go to Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
          <p className="text-muted-foreground mt-2">Reset your password</p>
        </div>
        
        <Card className="animate-slide-up hover-lift shadow-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
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
                  <div className="mt-2 space-y-1">
                    <Progress value={strengthPercentage} className={`h-1 ${
                      passwordStrength.strength === 'weak' ? 'bg-destructive/30' :
                      passwordStrength.strength === 'medium' ? 'bg-amber-500/30' : 'bg-emerald-500/30'
                    }`} />
                    <p className={`text-xs ${
                      passwordStrength.strength === 'weak' ? 'text-destructive' :
                      passwordStrength.strength === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {passwordStrength.message}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 