import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/hooks/useUserSettings";
import { MockFeatureIndicator } from "@/components/MockFeatureIndicator";
import { Beaker, Sparkles, Lightbulb } from 'lucide-react';

export function MockFeatureDemo() {
  // Default to enabled to prevent UI flashing
  const [isEnabled, setIsEnabled] = useState(true);
  const { isMockFeaturesEnabled, useFallback, isLoading } = useUserSettings();
  
  const [demoData, setDemoData] = useState({
    insights: [
      "Customer engagement increased by 27% this month",
      "Top performing campaign: 'Summer Sale' with 42% conversion",
      "Most active time for customer interactions: Tuesdays 2-4pm",
      "Recommended action: Follow up with inactive leads from Q1"
    ],
    predictions: [
      "Projected revenue growth: 18% in next quarter",
      "Churn risk detected for 5 enterprise customers",
      "Optimal pricing point for new service: $79/month",
      "Best time to launch new campaign: First week of next month"
    ]
  });
  
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
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Beaker className="h-5 w-5 text-purple-500" />
        <h2 className="text-xl font-semibold">
          Mock Features Demo
          {useFallback && <span className="text-xs ml-2 text-gray-500">(Using fallback settings)</span>}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MockFeatureIndicator featureName="AI Insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis of your CRM data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {demoData.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-amber-100 text-amber-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Generate More Insights</Button>
            </CardFooter>
          </Card>
        </MockFeatureIndicator>
        
        <MockFeatureIndicator featureName="Predictive Analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                Data-driven predictions for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {demoData.predictions.map((prediction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{prediction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Run New Predictions</Button>
            </CardFooter>
          </Card>
        </MockFeatureIndicator>
      </div>
    </div>
  );
} 