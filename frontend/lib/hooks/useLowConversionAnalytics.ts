import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import { useMockData } from '@/hooks/useMockData';

// Types for analytics data
export interface AnalyticsMetrics {
  conversionRate: number;
  conversionRateDelta: number;
  emailOpenRate: number;
  emailOpenRateDelta: number;
  reengagedLeads: number;
  reengagedLeadsDelta: number;
  averageDaysInWorkflow: number;
  averageDaysInWorkflowDelta: number;
}

export interface EngagementData {
  month: string;
  opens: number;
  clicks: number;
  responses: number;
}

export interface ConversionTrendData {
  month: string;
  rate: number;
}

export interface SourceDistributionData {
  name: string;
  value: number;
}

export interface WorkflowPerformanceData {
  name: string;
  successful: number;
  partial: number;
  abandoned: number;
}

export interface AIRecommendation {
  title: string;
  description: string;
}

export interface LowConversionAnalyticsData {
  metrics: AnalyticsMetrics;
  engagementData: EngagementData[];
  conversionTrends: ConversionTrendData[];
  sourceDistribution: SourceDistributionData[];
  workflowPerformance: WorkflowPerformanceData[];
  recommendations: AIRecommendation[];
}

// Mock data (will be replaced by API calls)
const mockData: LowConversionAnalyticsData = {
  metrics: {
    conversionRate: 18.5,
    conversionRateDelta: 3.2,
    emailOpenRate: 42.3,
    emailOpenRateDelta: 5.7,
    reengagedLeads: 23,
    reengagedLeadsDelta: -2,
    averageDaysInWorkflow: 84,
    averageDaysInWorkflowDelta: -12
  },
  engagementData: [
    { month: 'Jan', opens: 32, clicks: 12, responses: 5 },
    { month: 'Feb', opens: 42, clicks: 18, responses: 8 },
    { month: 'Mar', opens: 38, clicks: 15, responses: 7 },
    { month: 'Apr', opens: 45, clicks: 20, responses: 10 },
    { month: 'May', opens: 50, clicks: 25, responses: 12 },
    { month: 'Jun', opens: 55, clicks: 28, responses: 15 }
  ],
  conversionTrends: [
    { month: 'Jan', rate: 3.2 },
    { month: 'Feb', rate: 3.5 },
    { month: 'Mar', rate: 4.1 },
    { month: 'Apr', rate: 5.3 },
    { month: 'May', rate: 6.2 },
    { month: 'Jun', rate: 7.5 }
  ],
  sourceDistribution: [
    { name: 'Direct', value: 35 },
    { name: 'Email', value: 25 },
    { name: 'Social', value: 20 },
    { name: 'Referral', value: 15 },
    { name: 'Other', value: 5 }
  ],
  workflowPerformance: [
    { name: 'Educational', successful: 42, partial: 28, abandoned: 18 },
    { name: 'Industry', successful: 35, partial: 30, abandoned: 22 },
    { name: 'Case Study', successful: 50, partial: 25, abandoned: 15 },
    { name: 'Product', successful: 40, partial: 35, abandoned: 20 }
  ],
  recommendations: [
    {
      title: 'Increase Educational Content in Industry Workflow',
      description: 'Leads in the Industry workflow show 28% higher engagement with educational content compared to product information. Consider adjusting content mix to include more educational materials.'
    },
    {
      title: 'Optimize Email Send Times',
      description: 'Emails sent between 9-11am show 15% higher open rates. Consider adjusting scheduling to prioritize morning delivery.'
    },
    {
      title: 'Extend Case Study Workflow',
      description: 'The Case Study workflow shows continuous engagement beyond the 90-day mark. Consider extending this workflow to 120 days.'
    }
  ]
};

export function useLowConversionAnalytics(timeframe: '7d' | '30d' | '90d' | '1y' = '30d') {
  const [data, setData] = useState<LowConversionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const { isEnabled: isMockDataEnabled } = useMockData();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isMockDataEnabled) {
          // Use mock data when mock data flag is enabled
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          setData(mockData);
        } else {
          // Use real API data when mock data is disabled
          const response = await fetch(`/api/analytics/low-conversion?timeframe=${timeframe}`, {
            headers: {
              Authorization: `Bearer ${session?.user?.id}`,
            },
          });
          
          if (!response.ok) {
            throw new Error(`Error fetching analytics data: ${response.statusText}`);
          }
          
          const apiData = await response.json();
          setData(apiData);
        }
      } catch (err: any) {
        console.error('Failed to fetch analytics data:', err);
        setError(err.message || 'Failed to fetch analytics data');
        toast({
          title: 'Error',
          description: 'Failed to load analytics data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeframe, session, isMockDataEnabled]);

  return { data, isLoading, error };
}

// Hook for exporting analytics data
export function useExportAnalytics() {
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { isEnabled: isMockDataEnabled } = useMockData();

  const exportData = async (format: 'csv' | 'pdf' = 'csv', timeframe: '7d' | '30d' | '90d' | '1y' = '30d') => {
    setIsExporting(true);

    try {
      if (isMockDataEnabled) {
        // Simulate export delay when mock data is enabled
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: 'Export Successful',
          description: `Analytics data has been exported as ${format.toUpperCase()}`,
        });
      } else {
        // Use real API when mock data is disabled
        const response = await fetch(`/api/analytics/low-conversion/export?format=${format}&timeframe=${timeframe}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.user?.id}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error exporting data: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `low-conversion-analytics-${timeframe}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Export Successful',
          description: `Analytics data has been exported as ${format.toUpperCase()}`,
        });
      }
    } catch (err: any) {
      console.error('Failed to export analytics data:', err);
      toast({
        title: 'Export Failed',
        description: err.message || 'Failed to export analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
} 