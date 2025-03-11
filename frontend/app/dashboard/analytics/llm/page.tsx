'use client';

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Settings, FunctionSquare } from 'lucide-react';
import LLMUsageDashboard from '@/components/dashboard/LLMUsageDashboard';
import LLMSettingsDialog from '@/components/dashboard/LLMSettingsDialog';
import AIFunctionUsage from '@/components/dashboard/AIFunctionUsage';
import { Button } from '@/components/ui/button';

export default function LLMAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your LLM usage, costs, and performance metrics
          </p>
        </div>
        <LLMSettingsDialog 
          trigger={
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              LLM Settings
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="functions">AI Functions</TabsTrigger>
          <TabsTrigger value="requests">Request Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5" />
                LLM Usage Overview
              </CardTitle>
              <CardDescription>
                Comprehensive view of your AI usage and associated costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LLMUsageDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FunctionSquare className="mr-2 h-5 w-5" />
                AI Function Usage
              </CardTitle>
              <CardDescription>
                Detailed breakdown of AI-powered function usage and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIFunctionUsage />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>
                Detailed breakdown of usage by model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LLMUsageDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Analysis</CardTitle>
              <CardDescription>
                Analysis of request types and their frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LLMUsageDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 