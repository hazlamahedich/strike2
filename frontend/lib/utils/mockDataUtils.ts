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