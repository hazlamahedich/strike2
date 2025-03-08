'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Activity, 
  Users, 
  Mail, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  RefreshCw
} from 'lucide-react';

import StatCard from '@/components/analytics/StatCard';
import ChartCard from '@/components/analytics/ChartCard';
import AnalysisCard from '@/components/analytics/AnalysisCard';
import UserPerformanceCard from '@/components/analytics/UserPerformanceCard';
import { useAnalyticsContext } from '@/context/AnalyticsContext';

import { 
  useOverviewStats, 
  useLeadStats, 
  useCampaignStats, 
  useCommunicationStats, 
  usePerformanceMetrics, 
  useTrendData, 
  useAnalysisRecommendation,
  useUserPerformance
} from '@/lib/hooks/useAnalytics';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { useMockData, setUseMockData } = useAnalyticsContext();
  
  // Fetch data using our hooks
  const { data: overviewStats, isLoading: isLoadingOverview, refetch: refetchOverview } = useOverviewStats();
  const { data: leadStats, isLoading: isLoadingLeads, refetch: refetchLeads } = useLeadStats();
  const { data: campaignStats, isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useCampaignStats();
  const { data: communicationStats, isLoading: isLoadingCommunications, refetch: refetchCommunications } = useCommunicationStats();
  const { data: performanceMetrics, isLoading: isLoadingPerformance, refetch: refetchPerformance } = usePerformanceMetrics();
  const { data: trendData, isLoading: isLoadingTrends, refetch: refetchTrends } = useTrendData();
  const { data: analysisData, isLoading: isLoadingAnalysis, refetch: refetchAnalysis } = useAnalysisRecommendation();
  const { data: userPerformanceData, isLoading: isLoadingUserPerformance, refetch: refetchUserPerformance } = useUserPerformance();
  
  // Function to refresh all data
  const refreshAllData = () => {
    refetchOverview();
    refetchLeads();
    refetchCampaigns();
    refetchCommunications();
    refetchPerformance();
    refetchTrends();
    refetchAnalysis();
    refetchUserPerformance();
  };
  
  // Format data for charts
  const formatLeadStatusData = () => {
    if (!leadStats) return [];
    
    return Object.entries(leadStats.byStatus).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatLeadSourceData = () => {
    if (!leadStats) return [];
    
    return Object.entries(leadStats.bySource).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatCampaignTypeData = () => {
    if (!campaignStats) return [];
    
    return Object.entries(campaignStats.byType).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatCommunicationTypeData = () => {
    if (!communicationStats) return [];
    
    return Object.entries(communicationStats.byType).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatSentimentData = () => {
    if (!communicationStats) return [];
    
    return [
      { name: 'Positive', value: communicationStats.sentimentAnalysis.positive },
      { name: 'Neutral', value: communicationStats.sentimentAnalysis.neutral },
      { name: 'Negative', value: communicationStats.sentimentAnalysis.negative },
    ];
  };
  
  const formatTimeSeriesData = () => {
    if (!performanceMetrics) return [];
    
    return performanceMetrics.timeSeriesData;
  };
  
  const formatTrendData = (type: 'leadGrowth' | 'conversionTrend' | 'campaignPerformance' | 'communicationEffectiveness') => {
    if (!trendData) return [];
    
    return trendData[type];
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="mock-data"
              checked={useMockData}
              onCheckedChange={setUseMockData}
            />
            <Label htmlFor="mock-data">
              {useMockData ? 'Using Mock Data' : 'Using Live Data'}
            </Label>
          </div>
          <Button variant="outline" size="sm" className="ml-4" onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Leads"
              value={overviewStats?.totalLeads || 0}
              icon={Users}
              isLoading={isLoadingOverview}
            />
            <StatCard
              title="Active Campaigns"
              value={overviewStats?.activeCampaigns || 0}
              icon={Target}
              isLoading={isLoadingOverview}
            />
            <StatCard
              title="Conversion Rate"
              value={`${overviewStats?.conversionRate.toFixed(1) || 0}%`}
              icon={TrendingUp}
              isLoading={isLoadingOverview}
            />
            <StatCard
              title="Response Rate"
              value={`${overviewStats?.responseRate.toFixed(1) || 0}%`}
              icon={Activity}
              isLoading={isLoadingOverview}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Lead Growth"
              description="Monthly lead acquisition trend"
              data={formatTrendData('leadGrowth')}
              type="line"
              dataKeys={['value']}
              xAxisKey="date"
              isLoading={isLoadingTrends}
            />
            <ChartCard
              title="Conversion Trend"
              description="Monthly conversion rate trend"
              data={formatTrendData('conversionTrend')}
              type="line"
              dataKeys={['value']}
              xAxisKey="date"
              isLoading={isLoadingTrends}
            />
          </div>
          
          <AnalysisCard
            data={analysisData}
            isLoading={isLoadingAnalysis}
          />
        </TabsContent>
        
        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Leads"
              value={leadStats?.total || 0}
              icon={Users}
              isLoading={isLoadingLeads}
            />
            <StatCard
              title="Conversion Rate"
              value={`${leadStats?.conversionRate.toFixed(1) || 0}%`}
              icon={TrendingUp}
              isLoading={isLoadingLeads}
            />
            <StatCard
              title="Acquisition Cost"
              value={`$${leadStats?.acquisitionCost.toFixed(2) || 0}`}
              icon={DollarSign}
              isLoading={isLoadingLeads}
            />
            <StatCard
              title="New Leads (30d)"
              value={leadStats?.byStatus?.['New'] || 0}
              icon={Users}
              isLoading={isLoadingLeads}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Leads by Status"
              description="Distribution of leads by current status"
              data={formatLeadStatusData()}
              type="bar"
              dataKeys={['value']}
              isLoading={isLoadingLeads}
            />
            <ChartCard
              title="Leads by Source"
              description="Distribution of leads by acquisition source"
              data={formatLeadSourceData()}
              type="pie"
              dataKeys={['value']}
              isLoading={isLoadingLeads}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Most recently added leads in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Source</th>
                      <th className="text-left p-2">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLeads ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td colSpan={5} className="p-2">
                            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      leadStats?.recentLeads.map((lead) => (
                        <tr key={lead.id} className="border-b">
                          <td className="p-2">{lead.name}</td>
                          <td className="p-2">{lead.email}</td>
                          <td className="p-2">{lead.status}</td>
                          <td className="p-2">{lead.source}</td>
                          <td className="p-2">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Campaigns"
              value={campaignStats?.total || 0}
              icon={Target}
              isLoading={isLoadingCampaigns}
            />
            <StatCard
              title="Active Campaigns"
              value={campaignStats?.active || 0}
              icon={Activity}
              isLoading={isLoadingCampaigns}
            />
            <StatCard
              title="Completed Campaigns"
              value={campaignStats?.completed || 0}
              icon={Target}
              isLoading={isLoadingCampaigns}
            />
            <StatCard
              title="Avg. Open Rate"
              value={`${trendData?.campaignPerformance[trendData.campaignPerformance.length - 1]?.openRate.toFixed(1) || 0}%`}
              icon={Mail}
              isLoading={isLoadingTrends}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Campaigns by Type"
              description="Distribution of campaigns by type"
              data={formatCampaignTypeData()}
              type="pie"
              dataKeys={['value']}
              isLoading={isLoadingCampaigns}
            />
            <ChartCard
              title="Campaign Performance Trends"
              description="Monthly trends in campaign performance metrics"
              data={formatTrendData('campaignPerformance')}
              type="line"
              dataKeys={['openRate', 'clickRate', 'conversionRate']}
              xAxisKey="date"
              isLoading={isLoadingTrends}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Performance metrics for recent campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Campaign</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Sent</th>
                      <th className="text-left p-2">Open Rate</th>
                      <th className="text-left p-2">Click Rate</th>
                      <th className="text-left p-2">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingCampaigns ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td colSpan={6} className="p-2">
                            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      campaignStats?.performance.map((campaign) => (
                        <tr key={campaign.id} className="border-b">
                          <td className="p-2">{campaign.name}</td>
                          <td className="p-2">{campaign.type}</td>
                          <td className="p-2">{campaign.sentCount.toLocaleString()}</td>
                          <td className="p-2">{campaign.openRate.toFixed(1)}%</td>
                          <td className="p-2">{campaign.clickRate.toFixed(1)}%</td>
                          <td className="p-2">{campaign.conversionRate.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Communications"
              value={communicationStats?.total || 0}
              icon={Mail}
              isLoading={isLoadingCommunications}
            />
            <StatCard
              title="Response Rate"
              value={`${communicationStats?.responseRate.toFixed(1) || 0}%`}
              icon={Activity}
              isLoading={isLoadingCommunications}
            />
            <StatCard
              title="Avg. Response Time"
              value={`${communicationStats?.averageResponseTime.toFixed(1) || 0} hrs`}
              icon={Clock}
              isLoading={isLoadingCommunications}
            />
            <StatCard
              title="Positive Sentiment"
              value={`${communicationStats?.sentimentAnalysis.positive || 0}%`}
              icon={TrendingUp}
              isLoading={isLoadingCommunications}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="Communications by Type"
              description="Distribution of communications by type"
              data={formatCommunicationTypeData()}
              type="pie"
              dataKeys={['value']}
              isLoading={isLoadingCommunications}
            />
            <ChartCard
              title="Sentiment Analysis"
              description="Distribution of communication sentiment"
              data={formatSentimentData()}
              type="pie"
              dataKeys={['value']}
              colors={['#4ade80', '#94a3b8', '#f87171']}
              isLoading={isLoadingCommunications}
            />
          </div>
          
          <ChartCard
            title="Communication Effectiveness"
            description="Trends in response rate and sentiment over time"
            data={formatTrendData('communicationEffectiveness')}
            type="line"
            dataKeys={['responseRate', 'sentimentScore']}
            xAxisKey="date"
            isLoading={isLoadingTrends}
          />
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Conversion Rate"
              value={`${performanceMetrics?.conversionRate.toFixed(1) || 0}%`}
              icon={TrendingUp}
              isLoading={isLoadingPerformance}
            />
            <StatCard
              title="Lead Quality Score"
              value={performanceMetrics?.leadQualityScore.toFixed(1) || 0}
              icon={Target}
              isLoading={isLoadingPerformance}
            />
            <StatCard
              title="Avg. Deal Size"
              value={`$${performanceMetrics?.averageDealSize.toLocaleString() || 0}`}
              icon={DollarSign}
              isLoading={isLoadingPerformance}
            />
            <StatCard
              title="Sales Cycle"
              value={`${performanceMetrics?.salesCycle || 0} days`}
              icon={Clock}
              isLoading={isLoadingPerformance}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="Customer Acquisition Cost"
              value={`$${performanceMetrics?.customerAcquisitionCost.toFixed(2) || 0}`}
              icon={DollarSign}
              isLoading={isLoadingPerformance}
            />
            <StatCard
              title="Return on Investment"
              value={`${performanceMetrics?.returnOnInvestment || 0}%`}
              icon={TrendingUp}
              isLoading={isLoadingPerformance}
            />
          </div>
          
          <ChartCard
            title="Performance Metrics Over Time"
            description="Monthly trends in key performance indicators"
            data={formatTimeSeriesData()}
            type="line"
            dataKeys={['leads', 'conversions', 'revenue']}
            xAxisKey="date"
            isLoading={isLoadingPerformance}
          />
          
          <AnalysisCard
            data={analysisData}
            isLoading={isLoadingAnalysis}
          />
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <UserPerformanceCard
            data={userPerformanceData}
            isLoading={isLoadingUserPerformance}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 