'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Loader2, BarChart, FunctionSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockData } from "@/context/MockDataContext";

// Define types for AI function usage data
interface FunctionUsageData {
  functionType: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
}

interface DailyUsageData {
  date: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface AIFunctionUsageResponse {
  functionUsage: FunctionUsageData[];
  dailyUsage: DailyUsageData[];
}

// Mock data for development or when API fails
const EMPTY_FUNCTION_USAGE_DATA: AIFunctionUsageResponse = {
  functionUsage: [],
  dailyUsage: []
};

// Sample mock data with realistic values
const SAMPLE_FUNCTION_USAGE_DATA: AIFunctionUsageResponse = {
  functionUsage: [
    {
      functionType: 'text-generation',
      requestCount: 75,
      promptTokens: 15000,
      completionTokens: 8000,
      totalTokens: 23000,
      totalCost: 0.46,
      avgCostPerRequest: 0.00613
    },
    {
      functionType: 'code-generation',
      requestCount: 30,
      promptTokens: 6000,
      completionTokens: 4500,
      totalTokens: 10500,
      totalCost: 0.21,
      avgCostPerRequest: 0.007
    },
    {
      functionType: 'summarization',
      requestCount: 20,
      promptTokens: 8000,
      completionTokens: 2000,
      totalTokens: 10000,
      totalCost: 0.20,
      avgCostPerRequest: 0.01
    }
  ],
  dailyUsage: [
    {
      date: '2023-03-01',
      requestCount: 5,
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      cost: 0.03
    },
    {
      date: '2023-03-02',
      requestCount: 8,
      promptTokens: 1600,
      completionTokens: 800,
      totalTokens: 2400,
      cost: 0.048
    },
    {
      date: '2023-03-03',
      requestCount: 12,
      promptTokens: 2400,
      completionTokens: 1200,
      totalTokens: 3600,
      cost: 0.072
    }
  ]
};

const AIFunctionUsage = () => {
  const [functionUsageData, setFunctionUsageData] = useState<AIFunctionUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const { isMockDataEnabled } = useMockData();

  useEffect(() => {
    if (isMockDataEnabled) {
      setFunctionUsageData(SAMPLE_FUNCTION_USAGE_DATA);
      setLoading(false);
      setError(null);
    } else {
      fetchFunctionUsageData(period, selectedFunction);
    }
  }, [period, selectedFunction, isMockDataEnabled]);

  // Fetch function usage data
  const fetchFunctionUsageData = async (period: string, functionType: string | null) => {
    // If mock data is enabled, use sample data
    if (isMockDataEnabled) {
      setFunctionUsageData(SAMPLE_FUNCTION_USAGE_DATA);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      // Add a console log to debug the API call
      console.log(`Fetching AI function usage data for period: ${period}, function: ${functionType || 'all'}`);
      
      let url = `/api/llm/function-usage?period=${period}`;
      if (functionType) {
        url += `&function_type=${encodeURIComponent(functionType)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI function usage API error:', response.status, errorData);
        
        // If we get a 404 or 500, it might mean no data yet or server error
        // In either case, provide empty data structure
        if (response.status === 404 || response.status === 500 || response.status === 403) {
          console.log('Using empty data due to API error:', response.status);
          setFunctionUsageData(EMPTY_FUNCTION_USAGE_DATA);
          
          // Only set error for 500 to show a message to the user
          if (response.status === 500) {
            setError('Server error occurred. Using default values.');
          } else {
            setError(null);
          }
        } else {
          setError(`Error fetching data: ${response.status}`);
          setFunctionUsageData(EMPTY_FUNCTION_USAGE_DATA);
        }
      } else {
        const data = await response.json();
        setFunctionUsageData(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching AI function usage data:', err);
      setError('Failed to fetch data. Using default values.');
      setFunctionUsageData(EMPTY_FUNCTION_USAGE_DATA);
    } finally {
      setLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Format large numbers with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  // Handle function selection
  const handleFunctionSelect = (functionType: string) => {
    setSelectedFunction(functionType === selectedFunction ? null : functionType);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading AI function usage data...</span>
      </div>
    );
  }

  // Calculate totals
  const totalRequests = functionUsageData?.functionUsage.reduce((sum, item) => sum + item.requestCount, 0) || 0;
  const totalTokensUsed = functionUsageData?.functionUsage.reduce((sum, item) => sum + item.totalTokens, 0) || 0;
  const totalCost = functionUsageData?.functionUsage.reduce((sum, item) => sum + item.totalCost, 0) || 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">AI Function Usage</h3>
        <Select value={period} onValueChange={handlePeriodChange}>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalTokensUsed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FunctionSquare className="mr-2 h-5 w-5" />
            AI Function Usage Breakdown
          </CardTitle>
          <CardDescription>
            Usage and cost breakdown by AI function type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function Type</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Avg. Cost/Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {functionUsageData?.functionUsage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No function usage data available for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                functionUsageData?.functionUsage.map((item, index) => (
                  <TableRow 
                    key={index}
                    className={selectedFunction === item.functionType ? 'bg-muted/50' : ''}
                    onClick={() => handleFunctionSelect(item.functionType)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell className="font-medium">{item.functionType}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.requestCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.totalTokens)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.avgCostPerRequest)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedFunction && functionUsageData && functionUsageData.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage for {selectedFunction}</CardTitle>
            <CardDescription>
              Daily breakdown of requests, tokens, and costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {functionUsageData && functionUsageData.dailyUsage.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(item.requestCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.totalTokens)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIFunctionUsage; 