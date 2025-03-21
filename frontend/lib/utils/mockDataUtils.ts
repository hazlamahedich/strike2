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
 * @param forceMock Option to force mock data regardless of settings
 * @returns Current mock data status
 */
export function getMockDataStatus(forceMock = false): boolean {
  // If force mock is enabled, always return true
  if (forceMock) {
    return true;
  }

  if (typeof window === 'undefined') {
    // Server-side execution
    return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  }
  
  // Client-side execution - check multiple sources in priority order:
  
  // 1. Check URL param (highest priority) - useful for testing
  if (typeof window.location !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const mockParam = urlParams.get('mock');
    if (mockParam === 'true') return true;
    if (mockParam === 'false') return false;
  }
  
  // 2. Check localStorage (user preference)
  const localStorageMock = localStorage.getItem('strike_app_mock_data');
  if (localStorageMock === 'true') return true;
  if (localStorageMock === 'false') return false;
  
  // 3. Check environment variable (default setting)
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}

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
 * Enable mock data mode
 */
export function enableMockData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('strike_app_mock_data', 'true');
  }
}

/**
 * Disable mock data mode
 */
export function disableMockData(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('strike_app_mock_data', 'false');
  }
}

/**
 * Toggle mock data mode
 * @returns The new mock data status
 */
export const toggleMockData = (): boolean => {
  if (typeof window !== 'undefined') {
    const currentStatus = getMockDataStatus();
    const newStatus = !currentStatus;
    
    localStorage.setItem('strike_app_mock_data', newStatus ? 'true' : 'false');
    console.log(`Mock data mode ${newStatus ? 'enabled' : 'disabled'}`);
    
    return newStatus;
  }
  
  return false;
}; 