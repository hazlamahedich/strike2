'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MockDataContextType {
  isMockDataEnabled: boolean;
  toggleMockData: () => void;
  setMockDataEnabled: (enabled: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMockDataEnabled, setIsMockDataEnabled] = useState(false);

  // Load mock data preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Get stored preference or default to enabled in development mode
      const storedPreference = localStorage.getItem('mockDataEnabled');
      if (storedPreference !== null) {
        setIsMockDataEnabled(storedPreference === 'true');
      } else if (isDevelopment) {
        // In development mode, default to enabled if no preference is set
        setIsMockDataEnabled(true);
        localStorage.setItem('mockDataEnabled', 'true');
      }
      
      console.log(`Mock data ${isMockDataEnabled ? 'enabled' : 'disabled'} (${isDevelopment ? 'development' : 'production'} mode)`);
    }
  }, []);

  // Toggle mock data and save preference to localStorage
  const toggleMockData = () => {
    const newValue = !isMockDataEnabled;
    setIsMockDataEnabled(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockDataEnabled', String(newValue));
      console.log(`Mock data ${newValue ? 'enabled' : 'disabled'}`);
    }
  };

  // Set mock data enabled state directly
  const setMockDataEnabled = (enabled: boolean) => {
    setIsMockDataEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockDataEnabled', String(enabled));
      console.log(`Mock data ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  return (
    <MockDataContext.Provider value={{ isMockDataEnabled, toggleMockData, setMockDataEnabled }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = (): MockDataContextType => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}; 