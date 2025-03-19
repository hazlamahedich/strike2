'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LowConversionPipeline from '@/components/leads/LowConversionPipeline';
import LowConversionAnalytics from '@/components/analytics/LowConversionAnalytics';
import WorkflowSettings from '@/components/workflows/WorkflowSettings';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart2,
  Download,
  FileUp,
  Settings,
  UserPlus,
} from 'lucide-react';
import { useLowConversionAnalytics } from '@/lib/hooks/useLowConversionAnalytics';
import { useExportAnalytics } from '@/lib/hooks/useLowConversionAnalytics';

export default function LowConversionPage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { data, isLoading } = useLowConversionAnalytics(timeframe);
  const { exportData, isExporting } = useExportAnalytics();

  const handleExport = async () => {
    await exportData('csv', timeframe);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Safe access to metrics with default values
  const conversionRate = data?.metrics?.conversionRate || 18.5;
  const conversionRateDelta = data?.metrics?.conversionRateDelta || 3.2;

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 p-8">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Low Conversion Pipeline</h1>
            <p className="text-muted-foreground">
              Monitor and manage leads in automated nurture campaigns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'pipeline' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Workflow Settings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExport} 
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Manual Lead
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Workflow Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-2">
                    <span className="text-2xl font-bold">142</span>
                    <span className="text-sm text-muted-foreground">Total Leads in Nurture</span>
                    <div className="text-xs text-green-600 flex items-center">
                      <span>+12% from last month</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-2">
                    <span className="text-2xl font-bold">23</span>
                    <span className="text-sm text-muted-foreground">Re-Engaged This Month</span>
                    <div className="text-xs text-amber-600 flex items-center">
                      <span>-5% from last month</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col space-y-2">
                    <span className="text-2xl font-bold">
                      {isLoading ? '...' : `${conversionRate}%`}
                    </span>
                    <span className="text-sm text-muted-foreground">Conversion to Active Pipeline</span>
                    <div className="text-xs text-green-600 flex items-center">
                      <span>
                        {isLoading ? '...' : `${conversionRateDelta >= 0 ? '+' : ''}${conversionRateDelta}%`} from last month
                      </span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <LowConversionPipeline />
          </TabsContent>
          
          <TabsContent value="analytics">
            <LowConversionAnalytics />
          </TabsContent>
          
          <TabsContent value="settings">
            <WorkflowSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 