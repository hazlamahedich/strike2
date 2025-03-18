import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Settings {
  use_mock_data: boolean;
  mock_data_delay: number;
  api_base_url: string;
  theme: string;
  // Add other settings as needed
}

// Default settings
const defaultSettings: Settings = {
  use_mock_data: true, // Default to using mock data
  mock_data_delay: 1000,
  api_base_url: '/api',
  theme: 'light'
};

// Function to fetch settings from API
const fetchSettings = async (): Promise<Settings> => {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings if API call fails
    return defaultSettings;
  }
};

// Hook to get and update settings
export const useSettings = () => {
  // Use React Query to fetch and cache settings
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    initialData: defaultSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to update settings (would need a corresponding API endpoint)
  const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      const updatedSettings = await response.json();
      
      // Invalidate the query to refetch with new settings
      query.refetch();
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  return {
    ...query,
    updateSettings,
  };
};

// Hook to get a specific setting value with a fallback
export const useSetting = <T>(key: keyof Settings, fallback: T) => {
  const { data: settings } = useSettings();
  return (settings?.[key] as unknown as T) ?? fallback;
};

// Export default settings for use elsewhere
export { defaultSettings }; 