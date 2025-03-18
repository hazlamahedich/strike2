import { useState, useEffect } from 'react';
import { useUserSettings } from './useUserSettings';
import { setUseMockData } from '@/lib/config';

/**
 * Mock data settings interface
 * Contains all mock data related flags for the application
 */
interface MockDataSettings {
  enabled: boolean;              // Master toggle for all mock data
  companyAnalysis: boolean;      // Toggle for company analysis mock data
  autoTriggerAnalysis: boolean;  // Toggle for auto-triggering analysis
}

// Default mock data settings
const defaultSettings: MockDataSettings = {
  enabled: true,
  companyAnalysis: true,
  autoTriggerAnalysis: false
};

/**
 * Hook to manage mock data state across the application
 * This is the SINGLE SOURCE OF TRUTH for mock data settings
 * 
 * Usage:
 * ```
 * const { isEnabled } = useMockData();
 * 
 * return (
 *   <div>
 *     {isEnabled ? <MockDataComponent /> : <RealDataComponent />}
 *   </div>
 * );
 * ```
 */
export function useMockData() {
  const { profile, isMockFeaturesEnabled, toggleMockFeatures } = useUserSettings();
  const [settings, setSettings] = useState<MockDataSettings>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem('mockDataSettings');
      if (storedValue) {
        try {
          return JSON.parse(storedValue);
        } catch (e) {
          console.error('Error parsing stored mock data settings:', e);
        }
      }
    }
    return defaultSettings;
  });

  // Sync the mock data state with user preferences when profile loads
  useEffect(() => {
    if (profile) {
      const mockEnabled = profile.preferences?.enable_mock_features ?? true;
      setSettings(prev => ({
        ...prev,
        enabled: mockEnabled
      }));
      
      // Update the global config
      setUseMockData(mockEnabled);
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockDataSettings', JSON.stringify({
          ...settings,
          enabled: mockEnabled
        }));
      }
    }
  }, [profile]);

  // Listen for mock data changes from other components
  useEffect(() => {
    const handleMockDataChanged = (event: CustomEvent) => {
      setSettings(prev => {
        const newSettings = {
          ...prev,
          enabled: event.detail.useMockData
        };
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('mockDataSettings', JSON.stringify(newSettings));
        }
        
        return newSettings;
      });
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
      
      // Update local state
      setSettings(prev => {
        const newSettings = {
          ...prev,
          enabled: newValue
        };
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('mockDataSettings', JSON.stringify(newSettings));
        }
        
        return newSettings;
      });
      
      // Update the global config
      setUseMockData(newValue);
      
      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mock-data-changed', { 
          detail: { useMockData: newValue } 
        }));
      }
    }
    return success;
  };

  // Toggle company analysis mock data
  const toggleCompanyAnalysisMockData = () => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        companyAnalysis: !prev.companyAnalysis
      };
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockDataSettings', JSON.stringify(newSettings));
      }
      
      return newSettings;
    });
    return true;
  };

  // Toggle auto-trigger analysis
  const toggleAutoTriggerAnalysis = () => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        autoTriggerAnalysis: !prev.autoTriggerAnalysis
      };
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockDataSettings', JSON.stringify(newSettings));
      }
      
      return newSettings;
    });
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