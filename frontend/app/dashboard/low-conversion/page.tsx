'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LowConversionPipeline from '@/components/leads/LowConversionPipeline';
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

export default function LowConversionPage() {
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
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Workflow Settings
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Manual Lead
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-4">
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
                    <span className="text-2xl font-bold">18.5%</span>
                    <span className="text-sm text-muted-foreground">Conversion to Active Pipeline</span>
                    <div className="text-xs text-green-600 flex items-center">
                      <span>+3.2% from last month</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <LowConversionPipeline />
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-80">
                  <div className="flex flex-col items-center">
                    <BarChart2 className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics for low conversion leads are being developed.
                    </p>
                    <Button variant="outline" className="mt-4">
                      View Available Reports
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-80">
                  <div className="flex flex-col items-center">
                    <Settings className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">Workflow Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure automated workflows for low conversion leads here.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Configure Workflows
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 