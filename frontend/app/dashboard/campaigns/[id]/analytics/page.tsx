'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  useCampaignPerformance, 
  useCampaignLeadStats, 
  useCampaignActivityStats, 
  useCampaignTimeline,
  USE_MOCK_DATA
} from '@/lib/hooks/useCampaignAnalytics';
import { ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api/client';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Format date helper function
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Campaign type definition
type Campaign = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'cancelled';
  type: 'email' | 'sms' | 'social' | 'multi-channel';
  target_audience: string;
  start_date: string;
  end_date: string | null;
  leads_count: number;
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  created_at: string;
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [activeTab, setActiveTab] = useState('performance');
  const [campaignName, setCampaignName] = useState('');
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);
  
  // Fetch campaign details
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setIsLoadingCampaign(true);
        
        if (USE_MOCK_DATA) {
          // Use mock data for development
          // Simulate a delay to show loading state
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Set a mock campaign name based on the ID
          setCampaignName(`Campaign ${campaignId}`);
          setIsLoadingCampaign(false);
          return;
        }
        
        // Use real API data when ready
        const { data, error } = await apiClient.get<Campaign>(`campaigns/${campaignId}`);
        
        if (error) {
          console.error('Error fetching campaign details:', error);
        } else if (data) {
          setCampaignName(data.name || 'Campaign');
        }
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      } finally {
        setIsLoadingCampaign(false);
      }
    };
    
    fetchCampaignDetails();
  }, [campaignId]);
  
  // Fetch campaign analytics data
  const { 
    data: performanceData, 
    isLoading: isLoadingPerformance 
  } = useCampaignPerformance(campaignId);
  
  const { 
    data: leadStats, 
    isLoading: isLoadingLeadStats 
  } = useCampaignLeadStats(campaignId);
  
  const { 
    data: activityStats, 
    isLoading: isLoadingActivityStats 
  } = useCampaignActivityStats(campaignId);
  
  const { 
    data: timelineEvents, 
    isLoading: isLoadingTimeline 
  } = useCampaignTimeline(campaignId);
  
  // Format data for charts
  const formatPerformanceData = () => {
    if (!performanceData) return [];
    
    return performanceData.map(item => ({
      date: item.date,
      'Open Rate': item.open_rate,
      'Click Rate': item.click_rate,
      'Conversion Rate': item.conversion_rate,
    }));
  };
  
  const formatLeadSourceData = () => {
    if (!leadStats?.by_source) return [];
    
    return Object.entries(leadStats.by_source).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatLeadStatusData = () => {
    if (!leadStats?.by_status) return [];
    
    return Object.entries(leadStats.by_status).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  const formatActivityTypeData = () => {
    if (!activityStats?.by_type) return [];
    
    return Object.entries(activityStats.by_type).map(([name, value]) => ({
      name,
      value,
    }));
  };
  
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/campaigns">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {isLoadingCampaign ? (
                  <Skeleton className="h-9 w-[200px] inline-block" />
                ) : (
                  `${campaignName} - Analytics`
                )}
              </h2>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sends</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPerformance ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {performanceData?.reduce((sum, item) => sum + item.sends, 0).toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPerformance ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {performanceData && performanceData.length > 0
                        ? `${(performanceData.reduce((sum, item) => sum + item.open_rate, 0) / performanceData.length).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPerformance ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {performanceData && performanceData.length > 0
                        ? `${(performanceData.reduce((sum, item) => sum + item.click_rate, 0) / performanceData.length).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPerformance ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {performanceData && performanceData.length > 0
                        ? `${(performanceData.reduce((sum, item) => sum + item.conversion_rate, 0) / performanceData.length).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics Over Time</CardTitle>
                <CardDescription>
                  Open, click, and conversion rates over the campaign duration
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoadingPerformance ? (
                  <div className="flex h-full items-center justify-center">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatPerformanceData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Open Rate" stroke="#0088FE" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Click Rate" stroke="#00C49F" />
                      <Line type="monotone" dataKey="Conversion Rate" stroke="#FFBB28" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLeadStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {leadStats?.total.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLeadStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {leadStats?.active.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engaged Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLeadStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {leadStats?.engaged.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingLeadStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {leadStats?.converted.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Source</CardTitle>
                  <CardDescription>
                    Distribution of leads by acquisition source
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingLeadStats ? (
                    <div className="flex h-full items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatLeadSourceData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatLeadSourceData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Leads by Status</CardTitle>
                  <CardDescription>
                    Distribution of leads by current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingLeadStats ? (
                    <div className="flex h-full items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatLeadStatusData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingActivityStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {activityStats?.total.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingActivityStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {`${activityStats?.completion_rate.toFixed(1)}%` || '0%'}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingActivityStats ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {activityStats?.by_status?.completed.toLocaleString() || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activities by Type</CardTitle>
                  <CardDescription>
                    Distribution of activities by type
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingActivityStats ? (
                    <div className="flex h-full items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatActivityTypeData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatActivityTypeData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>
                    Most recent campaign activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivityStats ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activityStats?.recent.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type} • {formatDate(activity.created_at)}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            activity.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {activity.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Timeline</CardTitle>
                <CardDescription>
                  Chronological events in the campaign lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTimeline ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-muted">
                    {timelineEvents?.map((event) => (
                      <div key={event.id} className="relative pb-4">
                        <div className="absolute -left-[22px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(event.event_date)}
                          </div>
                          <div className="font-medium">
                            {event.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Event Type: {event.event_type.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 