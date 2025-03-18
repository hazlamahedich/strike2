'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState('month');
  
  // Mock data for charts and metrics
  const salesData = {
    month: {
      totalRevenue: 125000,
      deals: 24,
      avgDealSize: 5208,
      conversionRate: 32,
      topSalesPerson: 'Alex Johnson',
      topProduct: 'Enterprise Plan',
      monthlyTrend: [42000, 38000, 45000],
      monthNames: ['April', 'May', 'June'],
    },
    quarter: {
      totalRevenue: 350000,
      deals: 65,
      avgDealSize: 5384,
      conversionRate: 28,
      topSalesPerson: 'Sarah Williams',
      topProduct: 'Enterprise Plan',
      monthlyTrend: [110000, 120000, 120000],
      monthNames: ['Q1', 'Q2', 'Q3'],
    },
    year: {
      totalRevenue: 1250000,
      deals: 230,
      avgDealSize: 5434,
      conversionRate: 30,
      topSalesPerson: 'Sarah Williams',
      topProduct: 'Enterprise Plan',
      monthlyTrend: [280000, 350000, 320000, 300000],
      monthNames: ['Q1', 'Q2', 'Q3', 'Q4'],
    },
  };
  
  // Get current data based on selected timeframe
  const currentData = salesData[timeframe as keyof typeof salesData];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your sales performance and metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={timeframe} 
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 16.5L12 21.75L21 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 12L12 17.25L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 7.5L12 12.75L21 7.5L12 2.25L3 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM9.97 9.47C9.97 10.2 9.37 10.8 8.64 10.8C7.91 10.8 7.31 10.2 7.31 9.47C7.31 8.74 7.91 8.14 8.64 8.14C9.37 8.14 9.97 8.74 9.97 9.47ZM16.69 9.47C16.69 10.2 16.09 10.8 15.36 10.8C14.63 10.8 14.03 10.2 14.03 9.47C14.03 8.74 14.63 8.14 15.36 8.14C16.09 8.14 16.69 8.74 16.69 9.47ZM12 17.53C9.97 17.53 8.14 16.08 7.31 14.03H16.69C15.86 16.08 14.03 17.53 12 17.53Z" fill="currentColor"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Closed</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 8V16M12 11V16M8 14V16M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.deals}</div>
            <p className="text-xs text-muted-foreground">
              +12 from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Size</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 18L18 20L22 16M12 15H8C6.13623 15 5.20435 15 4.46927 15.3045C3.48915 15.7105 2.71046 16.4892 2.30448 17.4693C2 18.2044 2 19.1362 2 21M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentData.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              +7% from previous period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2% from previous period
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>
        
        {/* Sales Performance Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Revenue performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple chart visualization */}
              <div className="h-[300px] w-full">
                <div className="flex h-full items-end gap-2">
                  {currentData.monthlyTrend.map((value, index) => (
                    <div key={index} className="relative flex h-full w-full flex-col justify-end">
                      <div 
                        className="bg-primary rounded-t w-full animate-in" 
                        style={{ 
                          height: `${(value / Math.max(...currentData.monthlyTrend)) * 100}%`,
                          transition: 'height 0.5s ease-in-out'
                        }}
                      ></div>
                      <div className="text-center text-sm mt-2">{currentData.monthNames[index]}</div>
                      <div className="text-center text-xs text-muted-foreground">{formatCurrency(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Sales representatives with highest revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Sarah Williams</span>
                    </div>
                    <span className="font-medium">{formatCurrency(120000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span>Alex Johnson</span>
                    </div>
                    <span className="font-medium">{formatCurrency(95000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span>Michael Brown</span>
                    </div>
                    <span className="font-medium">{formatCurrency(82000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      <span>Emily Davis</span>
                    </div>
                    <span className="font-medium">{formatCurrency(65000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Enterprise Plan</span>
                    </div>
                    <span className="font-medium">{formatCurrency(250000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span>Professional Plan</span>
                    </div>
                    <span className="font-medium">{formatCurrency(180000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span>Consulting Services</span>
                    </div>
                    <span className="font-medium">{formatCurrency(120000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      <span>Support Package</span>
                    </div>
                    <span className="font-medium">{formatCurrency(95000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
              <CardDescription>
                Current deals by pipeline stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4 mr-4">
                    <div className="bg-blue-500 h-4 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <div className="min-w-[100px] flex justify-between">
                    <span className="text-sm">Lead</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4 mr-4">
                    <div className="bg-purple-500 h-4 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="min-w-[100px] flex justify-between">
                    <span className="text-sm">Qualified</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4 mr-4">
                    <div className="bg-orange-500 h-4 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <div className="min-w-[100px] flex justify-between">
                    <span className="text-sm">Proposal</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4 mr-4">
                    <div className="bg-amber-500 h-4 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <div className="min-w-[100px] flex justify-between">
                    <span className="text-sm">Negotiation</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4 mr-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <div className="min-w-[100px] flex justify-between">
                    <span className="text-sm">Closed Won</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Deal Aging</CardTitle>
              <CardDescription>
                Time spent in each pipeline stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Lead</span>
                  <span className="font-medium">5 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Qualified</span>
                  <span className="font-medium">8 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proposal</span>
                  <span className="font-medium">12 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Negotiation</span>
                  <span className="font-medium">15 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Sales Cycle</span>
                  <span className="font-medium">40 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Placeholder for other tabs */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>
                Coming soon
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Team performance reports are under development</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Coming soon
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Product performance reports are under development</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 