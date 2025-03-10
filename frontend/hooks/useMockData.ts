import { useState, useEffect } from 'react';
import { useUserSettings } from './useUserSettings';
import { useMockData as getConfigMockData, setUseMockData } from '@/lib/config';

// Mock data settings interface
interface MockDataSettings {
  enabled: boolean;
  companyAnalysis: boolean;
  autoTriggerAnalysis: boolean;
}

// Default mock data settings
const defaultSettings: MockDataSettings = {
  enabled: true,
  companyAnalysis: true,
  autoTriggerAnalysis: false
};

/**
 * Hook to manage mock data state across the application
 * This centralizes all mock data flags and syncs with user preferences
 */
export function useMockData() {
  const { profile, isMockFeaturesEnabled, toggleMockFeatures } = useUserSettings();
  const [settings, setSettings] = useState<MockDataSettings>({
    enabled: getConfigMockData(),
    companyAnalysis: true,
    autoTriggerAnalysis: false
  });

  // Sync the mock data state with user preferences when profile loads
  useEffect(() => {
    if (profile) {
      const mockEnabled = profile.preferences?.enable_mock_features ?? true;
      setSettings(prev => ({
        ...prev,
        enabled: mockEnabled
      }));
      setUseMockData(mockEnabled);
    }
  }, [profile]);

  // Listen for mock data changes from other components
  useEffect(() => {
    const handleMockDataChanged = (event: CustomEvent) => {
      setSettings(prev => ({
        ...prev,
        enabled: event.detail.useMockData
      }));
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
      const newValue = !settings.enabled;
      setSettings(prev => ({
        ...prev,
        enabled: newValue
      }));
      setUseMockData(newValue);
    }
    return success;
  };

  // Toggle company analysis mock data
  const toggleCompanyAnalysisMockData = () => {
    setSettings(prev => ({
      ...prev,
      companyAnalysis: !prev.companyAnalysis
    }));
    return true;
  };

  // Toggle auto-trigger analysis
  const toggleAutoTriggerAnalysis = () => {
    setSettings(prev => ({
      ...prev,
      autoTriggerAnalysis: !prev.autoTriggerAnalysis
    }));
    return true;
  };

  return {
    isEnabled: settings.enabled,
    useCompanyAnalysisMockData: settings.companyAnalysis,
    autoTriggerAnalysis: settings.autoTriggerAnalysis,
    toggleMockData,
    toggleCompanyAnalysisMockData,
    toggleAutoTriggerAnalysis
  };
} 