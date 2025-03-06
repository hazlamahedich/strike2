'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is logged in by looking for the user in localStorage
    const user = localStorage.getItem('strike_app_user');
    
    if (user) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to login
      router.push('/auth/login');
    }
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecting...</p>
    </div>
  );
}
