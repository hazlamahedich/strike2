import { useState, useEffect, useCallback } from 'react';
import { AIFunctionalitySetting, UpdateAIFunctionalitySetting } from '../types/llm';
import {
  getAIFunctionalitySettings,
  updateAIFunctionalitySetting,
} from '../services/aiSettingsService';
import { useMockData } from '@/hooks/useMockData';

// Mock data for AI settings
const mockAISettings: AIFunctionalitySetting[] = [
  {
    id: 1,
    feature_key: 'sentiment_analysis',
    display_name: 'Sentiment Analysis',
    description: 'Analyze text to determine the sentiment (positive, negative, neutral)',
    is_enabled: true,
    requires_subscription: false,
    default_model_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    feature_key: 'lead_scoring',
    display_name: 'Lead Scoring',
    description: 'Automatically score leads based on various factors',
    is_enabled: true,
    requires_subscription: false,
    default_model_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    feature_key: 'email_summarization',
    display_name: 'Email Summarization',
    description: 'Automatically generate summaries of emails',
    is_enabled: false,
    requires_subscription: true,
    default_model_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    feature_key: 'content_generation',
    display_name: 'Content Generation',
    description: 'Generate marketing copy and other content based on prompts',
    is_enabled: true,
    requires_subscription: true,
    default_model_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export interface UseAISettingsReturn {
  settings: AIFunctionalitySetting[];
  loading: boolean;
  error: string | null;
  updateSetting: (featureKey: string, update: UpdateAIFunctionalitySetting) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isFunctionEnabled: (featureKey: string) => boolean;
}

/**
 * Hook to manage AI functionality settings
 */
export function useAISettings(): UseAISettingsReturn {
  const [settings, setSettings] = useState<AIFunctionalitySetting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isEnabled: isMockFeaturesEnabled } = useMockData();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use mock data if mock features are enabled
      if (isMockFeaturesEnabled) {
        setSettings(mockAISettings);
        setLoading(false);
        return;
      }
      
      const data = await getAIFunctionalitySettings();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI settings';
      setError(errorMessage);
      console.error('Error loading AI settings:', err);
    } finally {
      setLoading(false);
    }
  }, [isMockFeaturesEnabled]);

  // Load settings on initial render
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, isMockFeaturesEnabled]);

  // Function to update a setting
  const updateSetting = useCallback(
    async (featureKey: string, update: UpdateAIFunctionalitySetting) => {
      try {
        setError(null);
        
        // Handle mock data updates
        if (isMockFeaturesEnabled) {
          setSettings((prevSettings) =>
            prevSettings.map((setting) =>
              setting.feature_key === featureKey 
                ? { ...setting, ...update } 
                : setting
            )
          );
          return;
        }
        
        const updatedSetting = await updateAIFunctionalitySetting(featureKey, update);
        
        // Update the local state with the updated setting
        setSettings((prevSettings) =>
          prevSettings.map((setting) =>
            setting.feature_key === featureKey ? updatedSetting : setting
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update AI setting';
        setError(errorMessage);
        console.error(`Error updating AI setting ${featureKey}:`, err);
        throw err;
      }
    },
    [isMockFeaturesEnabled]
  );

  // Function to check if a feature is enabled
  const isFunctionEnabled = useCallback(
    (featureKey: string) => {
      const setting = settings.find((s) => s.feature_key === featureKey);
      return setting ? setting.is_enabled : false;
    },
    [settings]
  );

  return {
    settings,
    loading,
    error,
    updateSetting,
    refreshSettings: fetchSettings,
    isFunctionEnabled,
  };
} 