/**
 * Mock Data Utilities
 * 
 * This file contains utility functions to help with the transition
 * from the old mock data approach to the new standardized one.
 */

import { useMockData as configUseMockData } from '@/lib/config';

/**
 * Get the current mock data status
 * This is a non-hook version for use in non-React contexts
 * 
 * IMPORTANT: For React components, always use the useMockData hook from /hooks/useMockData.ts
 * 
 * @returns Current mock data status
 */
export const getMockDataStatus = (): boolean => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const storedValue = localStorage.getItem('mockDataSettings');
    if (storedValue) {
      try {
        const settings = JSON.parse(storedValue);
        return settings.enabled;
      } catch (e) {
        console.error('Error parsing stored mock data settings:', e);
      }
    }
  }
  
  // Fall back to the config value
  return configUseMockData();
};

/**
 * Transition guide for mock data usage
 * 
 * OLD APPROACH:
 * ```
 * import { useMockData } from '@/lib/config';
 * 
 * if (useMockData()) {
 *   // Use mock data
 * } else {
 *   // Use real data
 * }
 * ```
 * 
 * NEW APPROACH (for React components):
 * ```
 * import { useMockData } from '@/hooks/useMockData';
 * 
 * function MyComponent() {
 *   const { isEnabled } = useMockData();
 *   
 *   if (isEnabled) {
 *     // Use mock data
 *   } else {
 *     // Use real data
 *   }
 * }
 * ```
 * 
 * NEW APPROACH (for non-React contexts):
 * ```
 * import { getMockDataStatus } from '@/lib/utils/mockDataUtils';
 * 
 * if (getMockDataStatus()) {
 *   // Use mock data
 * } else {
 *   // Use real data
 * }
 * ```
 */

/**
 * Enable mock data mode client-side
 * This is useful for development and testing
 */
export const enableMockDataMode = (): void => {
  if (typeof window !== 'undefined') {
    try {
      // Store the setting in localStorage (for backward compatibility)
      localStorage.setItem('useMockData', 'true');
      
      // Store in the structured format used by useMockData hook
      const currentSettings = localStorage.getItem('mockDataSettings');
      let settings = { enabled: true };
      
      if (currentSettings) {
        try {
          const parsedSettings = JSON.parse(currentSettings);
          settings = { ...parsedSettings, enabled: true };
        } catch (e) {
          console.error('Error parsing stored mock data settings:', e);
        }
      }
      
      localStorage.setItem('mockDataSettings', JSON.stringify({
        ...settings,
        enabled: true,
        timestamp: new Date().toISOString()
      }));
      
      // Dispatch event for other components to react to the change
      window.dispatchEvent(new CustomEvent('mock-data-changed', { 
        detail: { useMockData: true } 
      }));
      
      console.log('Mock data mode enabled client-side');
      
      // Reload the page to apply the setting
      window.location.reload();
    } catch (e) {
      console.error('Error enabling mock data mode:', e);
    }
  }
};

/**
 * Disable mock data mode client-side
 */
export const disableMockDataMode = (): void => {
  if (typeof window !== 'undefined') {
    try {
      // Remove the setting from localStorage (for backward compatibility)
      localStorage.removeItem('useMockData');
      
      // Update the structured format used by useMockData hook
      const currentSettings = localStorage.getItem('mockDataSettings');
      let settings = { enabled: false };
      
      if (currentSettings) {
        try {
          const parsedSettings = JSON.parse(currentSettings);
          settings = { ...parsedSettings, enabled: false };
        } catch (e) {
          console.error('Error parsing stored mock data settings:', e);
        }
      }
      
      localStorage.setItem('mockDataSettings', JSON.stringify({
        ...settings,
        enabled: false,
        timestamp: new Date().toISOString()
      }));
      
      // Dispatch event for other components to react to the change
      window.dispatchEvent(new CustomEvent('mock-data-changed', { 
        detail: { useMockData: false } 
      }));
      
      console.log('Mock data mode disabled client-side');
      
      // Reload the page to apply the setting
      window.location.reload();
    } catch (e) {
      console.error('Error disabling mock data mode:', e);
    }
  }
}; 