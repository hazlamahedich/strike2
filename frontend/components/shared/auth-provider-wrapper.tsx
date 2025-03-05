'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

export default function AuthProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <AuthProvider>{children}</AuthProvider>;
} 