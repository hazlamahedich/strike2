import React, { useState } from 'react';
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
  BarChart2, 
  ArrowRight, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp,
  Users,
  Mail,
  RefreshCw
} from 'lucide-react';
import { useLowConversionAnalytics, useExportAnalytics } from '@/lib/hooks/useLowConversionAnalytics';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const LowConversionAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { data, isLoading, error } = useLowConversionAnalytics(timeframe);
  const { exportData, isExporting } = useExportAnalytics();

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    await exportData(format, timeframe);
  };

  // Render loading skeletons when data is loading
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Skeleton for summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton for charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Performance</h2>
          <p className="text-muted-foreground">
            Analyze performance of low conversion workflows and lead engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeframe} className="w-auto">
            <TabsList>
              <TabsTrigger value="7d" onClick={() => setTimeframe('7d')}>7D</TabsTrigger>
              <TabsTrigger value="30d" onClick={() => setTimeframe('30d')}>30D</TabsTrigger>
              <TabsTrigger value="90d" onClick={() => setTimeframe('90d')}>90D</TabsTrigger>
              <TabsTrigger value="1y" onClick={() => setTimeframe('1y')}>1Y</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <span className="text-2xl font-bold">{data.metrics.conversionRate}%</span>
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <div className={`text-xs ${data.metrics.conversionRateDelta >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                <span>{data.metrics.conversionRateDelta >= 0 ? '+' : ''}{data.metrics.conversionRateDelta}% from last period</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <span className="text-2xl font-bold">{data.metrics.emailOpenRate}%</span>
              <span className="text-sm text-muted-foreground">Email Open Rate</span>
              <div className={`text-xs ${data.metrics.emailOpenRateDelta >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                <span>{data.metrics.emailOpenRateDelta >= 0 ? '+' : ''}{data.metrics.emailOpenRateDelta}% from last period</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <span className="text-2xl font-bold">{data.metrics.reengagedLeads}</span>
              <span className="text-sm text-muted-foreground">Re-Engaged Leads</span>
              <div className={`text-xs ${data.metrics.reengagedLeadsDelta >= 0 ? 'text-green-600' : 'text-amber-600'} flex items-center`}>
                <span>{data.metrics.reengagedLeadsDelta >= 0 ? '+' : ''}{data.metrics.reengagedLeadsDelta} from last period</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <span className="text-2xl font-bold">{data.metrics.averageDaysInWorkflow}</span>
              <span className="text-sm text-muted-foreground">Days avg. in workflow</span>
              <div className={`text-xs ${data.metrics.averageDaysInWorkflowDelta <= 0 ? 'text-green-600' : 'text-amber-600'} flex items-center`}>
                <span>{data.metrics.averageDaysInWorkflowDelta <= 0 ? '' : '+'}{data.metrics.averageDaysInWorkflowDelta} from last period</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Email opens, clicks and responses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.engagementData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opens" fill="#0088FE" name="Opens" />
                  <Bar dataKey="clicks" fill="#00C49F" name="Clicks" />
                  <Bar dataKey="responses" fill="#FFBB28" name="Responses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Conversion Trend</CardTitle>
            <CardDescription>Low conversion lead reactivation rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.conversionTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#8884d8" 
                    name="Conversion Rate (%)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Source Distribution</CardTitle>
            <CardDescription>Lead sources in low conversion workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sourceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Workflow Performance</CardTitle>
            <CardDescription>Performance by workflow type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.workflowPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successful" stackId="a" fill="#00C49F" name="Success" />
                  <Bar dataKey="partial" stackId="a" fill="#FFBB28" name="Partial" />
                  <Bar dataKey="abandoned" stackId="a" fill="#FF8042" name="Abandoned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Optimizations based on workflow performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">{recommendation.title}</h4>
                <p className="text-sm">
                  {recommendation.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LowConversionAnalytics; 