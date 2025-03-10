'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VerificationSentPage() {
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
          <p className="text-muted-foreground mt-2">Verify your email</p>
        </div>
        
        <Card className="animate-slide-up hover-lift shadow-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Verification Email Sent</CardTitle>
            <CardDescription>Please check your inbox</CardDescription>
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
              We've sent a verification email to your inbox. Please click the link in the email to verify your account.
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