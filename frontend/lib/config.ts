/**
 * Application Configuration
 */

// Mock data configuration
// This will be replaced with a function that can be dynamically updated
let _useMockData = true;

// Function to get the current mock data setting
export const useMockData = () => _useMockData;

// Function to update the mock data setting
export const setUseMockData = (value: boolean) => {
  _useMockData = value;
  // Optionally dispatch an event to notify components of the change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mock-data-changed', { detail: { useMockData: value } }));
  }
};

// For backward compatibility
export const USE_MOCK_DATA = true;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Feature Flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_REAL_TIME_UPDATES: false,
  ENABLE_ANALYTICS: true,
  ENABLE_LEAD_SCORING: true,
};

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
}; 