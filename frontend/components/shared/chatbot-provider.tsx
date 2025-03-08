'use client';

import React, { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the FloatingChatbot component to avoid SSR issues with draggable
// Use noSSR option to completely disable server-side rendering for this component
const FloatingChatbot = dynamic(() => import('@/components/FloatingChatbot'), {
  ssr: false,
});

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <FloatingChatbot />
    </>
  );
}; 