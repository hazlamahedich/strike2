'use client';

import React, { createContext, useContext } from 'react';
import { useMockData as useStandardizedMockData } from '@/hooks/useMockData';

/**
 * @deprecated Use the useMockData hook from /hooks/useMockData.ts directly instead
 * This context is kept for backward compatibility
 */
interface MockDataContextType {
  isMockDataEnabled: boolean;
  toggleMockData: () => void;
  setMockDataEnabled: (enabled: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

/**
 * @deprecated Use the useMockData hook from /hooks/useMockData.ts directly instead
 * This provider is kept for backward compatibility
 */
export const MockDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    isEnabled, 
    toggleMockData: standardToggleMockData 
  } = useStandardizedMockData();

  // Adapter function to maintain the old interface
  const toggleMockData = async () => {
    await standardToggleMockData();
  };

  // Adapter function to maintain the old interface
  const setMockDataEnabled = async (enabled: boolean) => {
    if (enabled !== isEnabled) {
      await standardToggleMockData();
    }
  };

  return (
    <MockDataContext.Provider value={{ 
      isMockDataEnabled: isEnabled, 
      toggleMockData, 
      setMockDataEnabled 
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

/**
 * @deprecated Use the useMockData hook from /hooks/useMockData.ts directly instead
 * This hook is kept for backward compatibility
 */
export const useMockData = (): MockDataContextType => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}; 