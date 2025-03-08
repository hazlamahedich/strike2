'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnalyticsContextType {
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage if available, otherwise default to true
  const [useMockData, setUseMockData] = useState<boolean>(true);
  
  // Load preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem('analytics_use_mock_data');
      if (storedValue !== null) {
        setUseMockData(storedValue === 'true');
      }
    }
  }, []);
  
  // Save preference to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_use_mock_data', useMockData.toString());
    }
  }, [useMockData]);
  
  return (
    <AnalyticsContext.Provider value={{ useMockData, setUseMockData }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};