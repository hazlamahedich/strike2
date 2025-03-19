'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, BarChart, PieChart, TrendingUp, DollarSign, MessageSquare, BrainCircuit, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockData } from "@/context/MockDataContext";
import { 
  AreaChart, Area, 
  BarChart as ReBarChart, Bar, 
  PieChart as RePieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Define types for LLM usage data
interface LLMUsageSummary {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  tokens_by_model: Record<string, number>;
  cost_by_model: Record<string, number>;
  requests_by_type: Record<string, number>;
  usage_by_day: Record<string, { tokens: number; cost: number }>;
}

// Mock data for development or when API fails
const EMPTY_USAGE_DATA: LLMUsageSummary = {
  total_requests: 0,
  total_tokens: 0,
  total_cost: 0,
  tokens_by_model: {},
  cost_by_model: {},
  requests_by_type: {},
  usage_by_day: {}
};

// Sample mock data with realistic values
const SAMPLE_USAGE_DATA: LLMUsageSummary = {
  total_requests: 125,
  total_tokens: 45678,
  total_cost: 0.9135,
  tokens_by_model: {
    'gpt-4': 25678,
    'gpt-3.5-turbo': 20000
  },
  cost_by_model: {
    'gpt-4': 0.7678,
    'gpt-3.5-turbo': 0.1457
  },
  requests_by_type: {
    'general': 75,
    'json': 30,
    'lead_scoring': 20
  },
  usage_by_day: {
    '2023-05-01': { tokens: 5000, cost: 0.1 },
    '2023-05-02': { tokens: 7500, cost: 0.15 },
    '2023-05-03': { tokens: 10000, cost: 0.2 },
    '2023-05-04': { tokens: 8000, cost: 0.16 },
    '2023-05-05': { tokens: 15178, cost: 0.3035 }
  }
};

// Color constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const LLMUsageDashboard = () => {
  const [usageData, setUsageData] = useState<LLMUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const { isMockDataEnabled, toggleMockData } = useMockData();

  useEffect(() => {
    if (isMockDataEnabled) {
      setUsageData(SAMPLE_USAGE_DATA);
      setLoading(false);
      setError(null);
    } else {
      fetchUsageData(period);
    }
  }, [period, isMockDataEnabled]);

  // Fetch usage data for a specific period
  const fetchUsageData = async (period: string) => {
    // If mock data is enabled, use sample data
    if (isMockDataEnabled) {
      setUsageData(SAMPLE_USAGE_DATA);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      // Add a console log to debug the API call
      console.log(`Fetching LLM usage data for period: ${period}`);
      
      const response = await fetch(`/api/llm/usage?period=${period}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('LLM usage API error:', response.status, errorData);
        
        // If we get a 404 or 500, it might mean no data yet or server error
        // In either case, provide empty data structure
        if (response.status === 404 || response.status === 500 || response.status === 403) {
          console.log('Using empty data due to API error:', response.status);
          setUsageData(EMPTY_USAGE_DATA);
          
          // Only set error for 500 to show a message to the user
          if (response.status === 500) {
            setError('Server error occurred. Using default values.');
          } else {
            setError(null);
          }
          return;
        }
        
        throw new Error(errorData.error || `API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('LLM usage data received:', data);
      setUsageData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching LLM usage data:', err);
      // Provide empty data structure instead of null
      setUsageData(EMPTY_USAGE_DATA);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load LLM usage data. Using default values.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  // Convert object data to array format for Recharts
  const prepareModelData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
  };

  // Prepare time series data for usage over time chart
  const prepareTimeSeriesData = (data: Record<string, { tokens: number; cost: number }>) => {
    return Object.entries(data)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tokens: values.tokens,
        cost: values.cost
      }));
  };

  // Prepare request type data for the bar chart
  const prepareRequestTypeData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      requests: value,
      fill: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isMockDataEnabled) {
    return (
      <div className="p-6 border border-red-200 rounded-md bg-red-50 text-red-800 flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="font-medium">No usage data available</p>
          <p className="text-sm mt-1">We couldn't retrieve your LLM usage data at this time.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => fetchUsageData(period)}
            className="mt-2"
          >
            Retry
          </Button>
          <Button 
            variant="outline" 
            onClick={() => toggleMockData()}
            className="mt-2"
          >
            Use Sample Data
          </Button>
        </div>
      </div>
    );
  }

  // If we have no data but no error, show a friendly message
  if (!isMockDataEnabled && (!usageData || (
    usageData.total_requests === 0 && 
    Object.keys(usageData.tokens_by_model).length === 0 &&
    Object.keys(usageData.requests_by_type).length === 0
  ))) {
    return (
      <div className="p-6 border rounded-md bg-gray-50 text-gray-800 flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="font-medium">No usage data available yet</p>
          <p className="text-sm mt-1">Start using LLM features in your application to see usage metrics.</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => fetchUsageData(period)}
            className="mt-2"
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              toggleMockData();
            }}
            className="mt-2"
          >
            Use Sample Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">LLM Usage Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchUsageData(period)}>
            Refresh
          </Button>
        </div>
      </div>

      {usageData ? (
        <div className="space-y-6">
          {/* Summary Cards with Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.total_requests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all models</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.total_tokens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Input and output combined</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(usageData.total_cost)}</div>
                <p className="text-xs text-muted-foreground mt-1">Estimated API cost</p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Usage Trends
              </CardTitle>
              <CardDescription>Token usage and costs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tokens">
                <TabsList className="mb-4">
                  <TabsTrigger value="tokens">Token Usage</TabsTrigger>
                  <TabsTrigger value="costs">Costs</TabsTrigger>
                </TabsList>
                <TabsContent value="tokens" className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={prepareTimeSeriesData(usageData.usage_by_day)}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ReTooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} tokens`, 'Usage']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorTokens)"
                        name="Token Usage"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="costs" className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={prepareTimeSeriesData(usageData.usage_by_day)}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                      <ReTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Cost']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorCost)"
                        name="Cost"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Model Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Models Usage Distribution
                </CardTitle>
                <CardDescription>Token usage by model</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={prepareModelData(usageData.tokens_by_model)}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareModelData(usageData.tokens_by_model).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: any) => `${value.toLocaleString()} tokens`} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Request Types
                </CardTitle>
                <CardDescription>Distribution by request type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={prepareRequestTypeData(usageData.requests_by_type)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ReTooltip formatter={(value: any) => `${value} requests`} />
                    <Legend />
                    <Bar dataKey="requests" name="Number of Requests">
                      {prepareRequestTypeData(usageData.requests_by_type).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Cost Distribution
              </CardTitle>
              <CardDescription>Costs by model</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={prepareModelData(usageData.cost_by_model)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(2)}`} />
                  <YAxis type="category" dataKey="name" />
                  <ReTooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Cost" radius={[0, 4, 4, 0]}>
                    {prepareModelData(usageData.cost_by_model).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>Complete breakdown of your LLM usage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(usageData.tokens_by_model).map(([model, tokens]) => {
                    const cost = usageData.cost_by_model[model] || 0;
                    const percentOfTotal = (tokens / usageData.total_tokens) * 100;
                    return (
                      <TableRow key={model}>
                        <TableCell className="font-medium">{model}</TableCell>
                        <TableCell className="text-right">{tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cost)}</TableCell>
                        <TableCell className="text-right">{percentOfTotal.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default LLMUsageDashboard; 