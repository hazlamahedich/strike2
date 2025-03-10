'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { resetPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  if (isSubmitted) {
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
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>Reset password instructions sent</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="mb-4">
                We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, please check your spam folder.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/auth/login">
                <Button variant="outline">Return to Login</Button>
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
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full font-medium" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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