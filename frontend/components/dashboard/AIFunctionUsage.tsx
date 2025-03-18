'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import { Loader2 } from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { useLLM } from '@/contexts/LLMContext';
import { LLMUsageRecord } from '@/lib/types/llm';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define types
interface FunctionUsage {
  function_name: string;
  request_count: number;
  total_tokens: number;
  cost: number;
  percentage: number;
}

interface FunctionUsageData {
  functions: FunctionUsage[];
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

// Mock data for function usage
const MOCK_FUNCTION_USAGE: FunctionUsageData = {
  functions: [
    {
      function_name: 'Email Generation',
      request_count: 1250,
      total_tokens: 238500,
      cost: 4.77,
      percentage: 37.5
    },
    {
      function_name: 'Lead Scoring',
      request_count: 845,
      total_tokens: 152100,
      cost: 3.04,
      percentage: 25.4
    },
    {
      function_name: 'Company Analysis',
      request_count: 523,
      total_tokens: 94140,
      cost: 1.88,
      percentage: 15.7
    },
    {
      function_name: 'Meeting Summary',
      request_count: 428,
      total_tokens: 85600,
      cost: 1.71,
      percentage: 12.8
    },
    {
      function_name: 'Other',
      request_count: 287,
      total_tokens: 45920,
      cost: 0.92,
      percentage: 8.6
    },
  ],
  totalRequests: 3333,
  totalTokens: 616260,
  totalCost: 12.32
};

// Empty data structure for when no data is available
const EMPTY_FUNCTION_USAGE: FunctionUsageData = {
  functions: [],
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0
};

const AIFunctionUsage = () => {
  const [usageData, setUsageData] = useState<FunctionUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const { isMockDataEnabled } = useMockData();
  const { settings } = useLLM();

  useEffect(() => {
    if (isMockDataEnabled) {
      setUsageData(MOCK_FUNCTION_USAGE);
      setLoading(false);
      setError(null);
    } else {
      fetchFunctionUsage(period);
    }
  }, [period, isMockDataEnabled]);

  const fetchFunctionUsage = async (period: string) => {
    // Use mock data if enabled
    if (isMockDataEnabled) {
      setUsageData(MOCK_FUNCTION_USAGE);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/llm/function-usage?period=${period}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data found
          setUsageData(EMPTY_FUNCTION_USAGE);
          setError(null);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API returned status ${response.status}`);
      }
      
      const data = await response.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching function usage data:', err);
      setUsageData(EMPTY_FUNCTION_USAGE);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Configure chart options
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Requests'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Function'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'AI Function Usage'
      }
    }
  };

  // Prepare chart data
  const prepareChartData = (data: FunctionUsageData) => {
    return {
      labels: data.functions.map(func => func.function_name),
      datasets: [
        {
          label: 'Requests',
          data: data.functions.map(func => func.request_count),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!usageData || usageData.functions.length === 0) {
    return (
      <div className="p-6 border rounded-md bg-gray-50 text-gray-800 flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="font-medium">No function usage data available yet</p>
          <p className="text-sm mt-1">AI functions will appear here once they are used in your application.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchFunctionUsage(period)}
          className="mt-2"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Function Usage</h2>
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
          <Button variant="outline" onClick={() => fetchFunctionUsage(period)}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
            <div className="text-2xl font-bold mt-2">{usageData.totalRequests.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Tokens</div>
            <div className="text-2xl font-bold mt-2">{usageData.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Cost</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(usageData.totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div style={{ height: '400px' }}>
                <Bar 
                  options={chartOptions} 
                  data={prepareChartData(usageData)} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.functions.map((func) => (
                    <TableRow key={func.function_name}>
                      <TableCell className="font-medium">{func.function_name}</TableCell>
                      <TableCell className="text-right">{func.request_count.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{func.total_tokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(func.cost)}</TableCell>
                      <TableCell className="text-right">{func.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Model Information */}
      {settings && settings.defaultModel && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Default Model Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium">{settings.defaultModel.provider}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Model</p>
                <p className="font-medium">{settings.defaultModel.model_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost per 1K tokens</p>
                <p className="font-medium">
                  {settings.defaultModel.cost_per_1k_tokens 
                    ? formatCurrency(settings.defaultModel.cost_per_1k_tokens) 
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIFunctionUsage; 