'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';
import { MockDataProvider } from '@/context/MockDataContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <AuthProvider>
        <MockDataProvider>
          {children}
          <Toaster position="top-right" richColors />
        </MockDataProvider>
      </AuthProvider>
    </SessionProvider>
  );
} 