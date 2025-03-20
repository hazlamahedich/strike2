import { useState, useEffect } from 'react';
import { isAIFunctionalityEnabled } from '../services/aiSettingsService';

interface UseAIFeatureReturn {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if an AI feature is enabled
 * 
 * @param featureKey The feature key to check
 * @returns Object with the feature enabled state, loading state, and error
 */
export function useAIFeature(featureKey: string): UseAIFeatureReturn {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkFeature = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const enabled = await isAIFunctionalityEnabled(featureKey);
        
        if (isMounted) {
          setIsEnabled(enabled);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check feature status';
        
        if (isMounted) {
          setError(errorMessage);
          console.error(`Error checking AI feature ${featureKey}:`, err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkFeature();

    return () => {
      isMounted = false;
    };
  }, [featureKey]);

  return {
    isEnabled,
    isLoading,
    error,
  };
} 