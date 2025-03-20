import React, { ReactNode, useEffect, useState } from 'react';
import { isAIFunctionalityEnabled } from '@/lib/services/aiSettingsService';

interface AIFeatureGuardProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

/**
 * Component that only renders its children if the specified AI feature is enabled
 */
export default function AIFeatureGuard({
  featureKey,
  children,
  fallback,
  loadingComponent,
}: AIFeatureGuardProps) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const enabled = await isAIFunctionalityEnabled(featureKey);
        setIsEnabled(enabled);
      } catch (error) {
        console.error(`Error checking AI feature ${featureKey}:`, error);
        setIsEnabled(false);
      }
    };

    checkFeature();
  }, [featureKey]);

  // Still loading
  if (isEnabled === null) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="py-2 px-3 bg-gray-100 rounded-md text-gray-500 text-sm animate-pulse">
        Loading feature...
      </div>
    );
  }

  // Feature is disabled
  if (!isEnabled) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
        This feature is currently disabled by the administrator.
      </div>
    );
  }

  // Feature is enabled, render children
  return <>{children}</>;
}