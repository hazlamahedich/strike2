'use client';

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Settings, FunctionSquare, TrendingUp, CandlestickChart, BarChart3, AreaChart, PieChart } from 'lucide-react';
import LLMUsageDashboard from '@/components/dashboard/LLMUsageDashboard';
import LLMSettingsDialog from '@/components/dashboard/LLMSettingsDialog';
import AIFunctionUsage from '@/components/dashboard/AIFunctionUsage';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function LLMAnalyticsPage() {
  const [expandedView, setExpandedView] = useState<string | null>(null);

  const toggleExpandView = (viewId: string) => {
    setExpandedView(expandedView === viewId ? null : viewId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your LLM usage, costs, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className={expandedView ? 'bg-muted' : ''}
            onClick={() => setExpandedView(null)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard View
          </Button>
          <LLMSettingsDialog 
            trigger={
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                LLM Settings
              </Button>
            }
          />
        </div>
      </div>

      {expandedView ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {expandedView === 'overview' && <AreaChart className="h-5 w-5 text-primary" />}
              {expandedView === 'models' && <CandlestickChart className="h-5 w-5 text-primary" />}
              {expandedView === 'functions' && <FunctionSquare className="h-5 w-5 text-primary" />}
              {expandedView === 'requests' && <PieChart className="h-5 w-5 text-primary" />}
              {expandedView === 'overview' && 'Detailed LLM Usage Overview'}
              {expandedView === 'models' && 'Model Performance Analytics'}
              {expandedView === 'functions' && 'AI Function Usage Analytics'}
              {expandedView === 'requests' && 'Request Type Analysis'}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpandedView(null)}
            >
              Back to Dashboard
            </Button>
          </div>
          
          {expandedView === 'overview' && <LLMUsageDashboard />}
          {expandedView === 'models' && <LLMUsageDashboard />}
          {expandedView === 'functions' && <AIFunctionUsage />}
          {expandedView === 'requests' && <LLMUsageDashboard />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overview Card */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AreaChart className="mr-2 h-4 w-4 text-primary" />
                LLM Usage Overview
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toggleExpandView('overview')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-hidden">
                <LLMUsageDashboard />
              </div>
              <div className="pt-2 text-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => toggleExpandView('overview')}
                >
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Models Card */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CandlestickChart className="mr-2 h-4 w-4 text-primary" />
                Model Performance
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toggleExpandView('models')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-hidden">
                <LLMUsageDashboard />
              </div>
              <div className="pt-2 text-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => toggleExpandView('models')}
                >
                  View Model Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Functions Card */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FunctionSquare className="mr-2 h-4 w-4 text-primary" />
                AI Function Usage
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toggleExpandView('functions')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-hidden">
                <AIFunctionUsage />
              </div>
              <div className="pt-2 text-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => toggleExpandView('functions')}
                >
                  View Function Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Request Types Card */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <PieChart className="mr-2 h-4 w-4 text-primary" />
                Request Analysis
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => toggleExpandView('requests')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-hidden">
                <LLMUsageDashboard />
              </div>
              <div className="pt-2 text-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => toggleExpandView('requests')}
                >
                  View Request Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 