'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend as ReLegend, ResponsiveContainer,
  Treemap
} from 'recharts';
import { Loader2, BarChart as BarChartIcon, PieChart as PieChartIcon, Activity, Zap, Sparkles, Code } from 'lucide-react';
import { useMockData } from '@/context/MockDataContext';
import { useLLM } from '@/contexts/LLMContext';
import { LLMUsageRecord } from '@/lib/types/llm';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  RadialLinearScale
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

// Color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B', '#6A7FDB'];

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
  const [chartType, setChartType] = useState('bar');
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

  // Prepare data for the treemap visualization
  const prepareTreemapData = (data: FunctionUsageData) => {
    return data.functions.map(func => ({
      name: func.function_name,
      size: func.request_count,
      fill: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  };

  // Prepare data for radar chart
  const prepareRadarData = (data: FunctionUsageData) => {
    const normalized = data.functions.map(func => {
      // Normalize values for radar chart
      const maxTokens = Math.max(...data.functions.map(f => f.total_tokens));
      const maxCost = Math.max(...data.functions.map(f => f.cost));
      const maxCount = Math.max(...data.functions.map(f => f.request_count));
      
      return {
        function: func.function_name,
        tokens: (func.total_tokens / maxTokens) * 100,
        cost: (func.cost / maxCost) * 100,
        requests: (func.request_count / maxCount) * 100
      };
    });
    
    return normalized;
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
        <div>
          <h2 className="text-2xl font-bold">AI Function Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Visualize usage patterns across your AI-powered functions
          </p>
        </div>
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

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-indigo-500" />
              Total Functions Called
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.functions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Distinct AI functions</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Total Invocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Function calls processed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Total AI Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(usageData.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated API cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Options */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Function Usage Visualization
            </CardTitle>
            <div className="flex">
              <Button 
                variant={chartType === 'bar' ? 'default' : 'outline'} 
                size="sm" 
                className="px-3 mr-2"
                onClick={() => setChartType('bar')}
              >
                <BarChartIcon className="h-4 w-4 mr-1" />
                Bar
              </Button>
              <Button 
                variant={chartType === 'pie' ? 'default' : 'outline'} 
                size="sm" 
                className="px-3 mr-2"
                onClick={() => setChartType('pie')}
              >
                <PieChartIcon className="h-4 w-4 mr-1" />
                Pie
              </Button>
              <Button 
                variant={chartType === 'treemap' ? 'default' : 'outline'} 
                size="sm" 
                className="px-3 mr-2"
                onClick={() => setChartType('treemap')}
              >
                <div className="grid grid-cols-2 gap-0.5 h-4 w-4 mr-1">
                  <div className="bg-primary rounded-sm"></div>
                  <div className="bg-primary rounded-sm"></div>
                  <div className="bg-primary rounded-sm"></div>
                  <div className="bg-primary rounded-sm"></div>
                </div>
                Treemap
              </Button>
              <Button 
                variant={chartType === 'radar' ? 'default' : 'outline'} 
                size="sm" 
                className="px-3"
                onClick={() => setChartType('radar')}
              >
                <Activity className="h-4 w-4 mr-1" />
                Radar
              </Button>
            </div>
          </div>
          <CardDescription>
            Compare usage across different AI functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="requests">Request Count</TabsTrigger>
              <TabsTrigger value="tokens">Token Usage</TabsTrigger>
              <TabsTrigger value="cost">Cost</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests" className="h-96">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData.functions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="function_name" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <ReTooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} requests`, 'Count']}
                    />
                    <ReLegend />
                    <Bar 
                      dataKey="request_count" 
                      name="Requests" 
                      fill="#0088FE"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageData.functions}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="request_count"
                      nameKey="function_name"
                      label={({ function_name, request_count, percent }) => 
                        `${function_name}: ${request_count} (${(percent * 100).toFixed(0)}%)`
                      }
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: any) => `${value.toLocaleString()} requests`} />
                    <ReLegend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'treemap' && (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={prepareTreemapData(usageData)}
                    dataKey="size"
                    nameKey="name"
                    animationDuration={1000}
                  >
                    {prepareTreemapData(usageData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Treemap>
                </ResponsiveContainer>
              )}

              {chartType === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={130} 
                    data={prepareRadarData(usageData)}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="function" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Requests" 
                      dataKey="requests" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                    <ReTooltip />
                    <ReLegend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="tokens" className="h-96">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData.functions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="function_name" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <ReTooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} tokens`, 'Usage']}
                    />
                    <ReLegend />
                    <Bar 
                      dataKey="total_tokens" 
                      name="Token Usage" 
                      fill="#00C49F"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageData.functions}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="total_tokens"
                      nameKey="function_name"
                      label={({ function_name, total_tokens, percent }) => 
                        `${function_name}: ${(percent * 100).toFixed(0)}%`
                      }
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: any) => `${value.toLocaleString()} tokens`} />
                    <ReLegend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={130} 
                    data={prepareRadarData(usageData)}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="function" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Tokens" 
                      dataKey="tokens" 
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      fillOpacity={0.6} 
                    />
                    <ReTooltip />
                    <ReLegend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="cost" className="h-96">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData.functions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="function_name" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <ReTooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Cost']}
                    />
                    <ReLegend />
                    <Bar 
                      dataKey="cost" 
                      name="Cost" 
                      fill="#FFBB28"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageData.functions}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="cost"
                      nameKey="function_name"
                      label={({ function_name, cost, percent }) => 
                        `${function_name}: ${formatCurrency(cost)} (${(percent * 100).toFixed(0)}%)`
                      }
                      animationDuration={1000}
                    >
                      {usageData.functions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: any) => formatCurrency(value)} />
                    <ReLegend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'radar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={130} 
                    data={prepareRadarData(usageData)}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="function" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Cost" 
                      dataKey="cost" 
                      stroke="#FFBB28" 
                      fill="#FFBB28" 
                      fillOpacity={0.6} 
                    />
                    <ReTooltip />
                    <ReLegend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Function Breakdown</CardTitle>
          <CardDescription>Complete analysis of AI function usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <TableCell className="text-right">{func.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIFunctionUsage; 