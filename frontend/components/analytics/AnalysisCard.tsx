import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisRecommendation } from '@/lib/hooks/useAnalytics';
import { Lightbulb, TrendingUp, AlertTriangle, Target, CheckCircle } from 'lucide-react';

interface AnalysisCardProps {
  data?: AnalysisRecommendation;
  isLoading?: boolean;
  className?: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  data,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>AI-Powered Analysis</CardTitle>
          <CardDescription>Loading insights and recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>AI-Powered Analysis</CardTitle>
          <CardDescription>No analysis data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analysis data is not available at this time. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI-Powered Analysis
        </CardTitle>
        <CardDescription>Insights and recommendations based on your data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>

        <Tabs defaultValue="strengths" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strengths">Strengths</TabsTrigger>
            <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="strengths" className="mt-4">
            <div className="flex items-start gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <h3 className="text-md font-semibold">Key Strengths</h3>
            </div>
            <ul className="space-y-2 mt-2">
              {data.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          
          <TabsContent value="weaknesses" className="mt-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <h3 className="text-md font-semibold">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2 mt-2">
              {data.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          
          <TabsContent value="opportunities" className="mt-4">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
              <h3 className="text-md font-semibold">Growth Opportunities</h3>
            </div>
            <ul className="space-y-2 mt-2">
              {data.opportunities.map((opportunity, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{opportunity}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-4">
            <div className="flex items-start gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-500 mt-0.5" />
              <h3 className="text-md font-semibold">Strategic Recommendations</h3>
            </div>
            <ul className="space-y-2 mt-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h3 className="text-sm font-semibold mb-2">Detailed Insight</h3>
          <p className="text-xs text-muted-foreground">{data.insightDetails}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisCard; 