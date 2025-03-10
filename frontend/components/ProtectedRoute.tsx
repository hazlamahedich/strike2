'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, status, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Status:', status, 'User:', user ? 'exists' : 'null', 'Loading:', isLoading);
    
    // Only redirect if we're not loading and there's no user
    if (!isLoading) {
      if (user) {
        console.log('User authenticated, allowing access to', pathname);
        setIsAuthorized(true);
      } else if (status === 'unauthenticated') {
        console.log('No user found, redirecting from', pathname);
        // Use a small timeout to ensure state is consistent
        setTimeout(() => {
          router.replace(`/auth/login?redirectedFrom=${encodeURIComponent(pathname)}`);
        }, 100);
      }
    }
  }, [user, isLoading, router, pathname, status]);

  // Show loading state while checking auth
  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authorized
  return <>{children}</>;
} 