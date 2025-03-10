import { useState, useEffect } from 'react';
import { useUserSettings } from './useUserSettings';
import { useMockData as getConfigMockData, setUseMockData } from '@/lib/config';

/**
 * Hook to manage mock data state across the application
 * This centralizes all mock data flags and syncs with user preferences
 */
export function useMockData() {
  const { profile, isMockFeaturesEnabled, toggleMockFeatures } = useUserSettings();
  const [isEnabled, setIsEnabled] = useState(getConfigMockData());

  // Sync the mock data state with user preferences when profile loads
  useEffect(() => {
    if (profile) {
      const mockEnabled = profile.preferences?.enable_mock_features ?? true;
      setIsEnabled(mockEnabled);
      setUseMockData(mockEnabled);
    }
  }, [profile]);

  // Listen for mock data changes from other components
  useEffect(() => {
    const handleMockDataChanged = (event: CustomEvent) => {
      setIsEnabled(event.detail.useMockData);
    };

    window.addEventListener('mock-data-changed', handleMockDataChanged as EventListener);
    
    return () => {
      window.removeEventListener('mock-data-changed', handleMockDataChanged as EventListener);
    };
  }, []);

  // Toggle mock data and update user preferences
  const toggleMockData = async () => {
    const success = await toggleMockFeatures();
    if (success) {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      setUseMockData(newValue);
    }
    return success;
  };

  return {
    isEnabled,
    toggleMockData
  };
} 