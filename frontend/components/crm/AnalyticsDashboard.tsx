import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange?: (range: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
}

export function AnalyticsDashboard({ 
  timeRange = 'week', 
  onTimeRangeChange 
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Sample data for charts
  const salesData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 5000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ];
  
  const pipelineData = [
    { name: 'Lead', value: 25 },
    { name: 'Qualified', value: 18 },
    { name: 'Proposal', value: 12 },
    { name: 'Negotiation', value: 8 },
    { name: 'Closed', value: 5 },
  ];
  
  const conversionData = [
    { name: 'Converted', value: 68 },
    { name: 'Lost', value: 32 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const CONVERSION_COLORS = ['#00C49F', '#FF8042'];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const handleTimeRangeChange = (range: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
            <Button 
              variant={timeRange === 'day' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleTimeRangeChange('day')}
            >
              Day
            </Button>
            <Button 
              variant={timeRange === 'week' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleTimeRangeChange('week')}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleTimeRangeChange('month')}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === 'quarter' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleTimeRangeChange('quarter')}
            >
              Quarter
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'secondary' : 'ghost'} 
              size="sm"
              className="text-xs h-7"
              onClick={() => handleTimeRangeChange('year')}
            >
              Year
            </Button>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(128500)}
          icon={<DollarSign className="h-5 w-5" />}
          change={12.5}
          changeLabel="vs last period"
        />
        <StatCard 
          title="New Leads" 
          value="48"
          icon={<Users className="h-5 w-5" />}
          change={-8.3}
          changeLabel="vs last period"
        />
        <StatCard 
          title="Conversion Rate" 
          value="24.8%"
          icon={<Target className="h-5 w-5" />}
          change={3.2}
          changeLabel="vs last period"
        />
        <StatCard 
          title="Avg. Deal Size" 
          value={formatCurrency(28500)}
          icon={<BarChart3 className="h-5 w-5" />}
          change={5.7}
          changeLabel="vs last period"
        />
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Sales Trend</h3>
                  <Badge variant="outline">This Week</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Pipeline Distribution</h3>
                  <Badge variant="outline">Current</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="p-4 pb-0">
                <h3 className="font-medium">Conversion Rate</h3>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CONVERSION_COLORS[index % CONVERSION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>Goal: 75%</span>
                    <span>Current: 68%</span>
                  </div>
                  <Progress value={68} max={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-0">
                <h3 className="font-medium">Top Performing Deals</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Enterprise Solution</span>
                    <Badge variant="outline" className="text-green-500 border-green-500">$85,000</Badge>
                  </div>
                  <Progress value={90} className="h-1.5" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Closing in 5 days</span>
                    <span>90% probability</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SaaS Integration</span>
                    <Badge variant="outline" className="text-blue-500 border-blue-500">$42,000</Badge>
                  </div>
                  <Progress value={75} className="h-1.5" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Closing in 12 days</span>
                    <span>75% probability</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Consulting Package</span>
                    <Badge variant="outline" className="text-purple-500 border-purple-500">$28,500</Badge>
                  </div>
                  <Progress value={60} className="h-1.5" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Closing in 18 days</span>
                    <span>60% probability</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="p-4 pb-0">
                <h3 className="font-medium">Activity Summary</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 text-blue-500 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Meetings</span>
                  </div>
                  <span className="font-medium">24</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 text-green-500 p-1.5 rounded-md">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-sm">New Contacts</span>
                  </div>
                  <span className="font-medium">48</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 text-purple-500 p-1.5 rounded-md">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Opportunities</span>
                  </div>
                  <span className="font-medium">12</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="bg-amber-100 text-amber-500 p-1.5 rounded-md">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-sm">Closed Deals</span>
                  </div>
                  <span className="font-medium">5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader className="p-4 pb-0">
              <h3 className="font-medium">Sales Performance</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pipeline" className="mt-4">
          <Card>
            <CardHeader className="p-4 pb-0">
              <h3 className="font-medium">Pipeline Analysis</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineData}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Deals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader className="p-4 pb-0">
              <h3 className="font-medium">Activity Metrics</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[400px]">
                <p className="text-center text-muted-foreground">Activity metrics visualization would go here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: number;
  changeLabel?: string;
}

function StatCard({ title, value, icon, change, changeLabel }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="bg-primary/10 p-2 rounded-md">
            {icon}
          </div>
        </div>
        
        <div className="flex items-center mt-4">
          {change > 0 ? (
            <Badge variant="outline" className="text-green-500 border-green-500 font-normal">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {change}%
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-500 border-red-500 font-normal">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              {Math.abs(change)}%
            </Badge>
          )}
          
          {changeLabel && (
            <span className="text-xs text-muted-foreground ml-2">{changeLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 