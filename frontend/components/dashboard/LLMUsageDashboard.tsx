'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, BarChart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockData } from "@/context/MockDataContext";

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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.total_requests.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.total_tokens.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(usageData.total_cost)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Usage Tables */}
          <Tabs defaultValue="models">
            <TabsList>
              <TabsTrigger value="models">Usage by Model</TabsTrigger>
              <TabsTrigger value="types">Usage by Type</TabsTrigger>
            </TabsList>
            
            <TabsContent value="models">
              <Card>
                <CardHeader>
                  <CardTitle>Model Usage</CardTitle>
                  <CardDescription>Token usage and cost breakdown by model</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(usageData.tokens_by_model).length > 0 ? (
                        Object.keys(usageData.tokens_by_model).map((modelName) => (
                          <TableRow key={modelName}>
                            <TableCell className="font-medium">{modelName}</TableCell>
                            <TableCell>{usageData.tokens_by_model[modelName].toLocaleString()}</TableCell>
                            <TableCell>{formatCurrency(usageData.cost_by_model[modelName] || 0)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No usage data available for this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="types">
              <Card>
                <CardHeader>
                  <CardTitle>Request Types</CardTitle>
                  <CardDescription>Number of requests by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(usageData.requests_by_type).length > 0 ? (
                        Object.keys(usageData.requests_by_type).map((type) => (
                          <TableRow key={type}>
                            <TableCell className="font-medium">{type}</TableCell>
                            <TableCell>{usageData.requests_by_type[type]}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4">
                            No request data available for this period.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No usage data available yet.</p>
        </div>
      )}
    </div>
  );
};

export default LLMUsageDashboard; 