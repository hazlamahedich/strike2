import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useState, useEffect } from 'react';

interface MockFeatureIndicatorProps {
  featureName?: string;
  showAlert?: boolean;
  children?: React.ReactNode;
}

export function MockFeatureIndicator({ 
  featureName = 'Feature', 
  showAlert = true,
  children 
}: MockFeatureIndicatorProps) {
  // Default to enabled to prevent UI flashing
  const [isEnabled, setIsEnabled] = useState(true);
  const { isMockFeaturesEnabled, useFallback, isLoading } = useUserSettings();
  
  useEffect(() => {
    // Only update once the settings have loaded
    if (!isLoading) {
      setIsEnabled(isMockFeaturesEnabled);
    }
  }, [isMockFeaturesEnabled, isLoading]);
  
  if (!isEnabled) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {showAlert && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            Mock {featureName}
            {useFallback && <span className="text-xs ml-2">(Using fallback settings)</span>}
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            This is a mock feature for demonstration purposes only.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
} 