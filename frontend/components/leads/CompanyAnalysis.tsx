import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, CheckCircle, RefreshCw, Building, Target, Users, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useMockData } from '../../hooks/useMockData';

interface CompanyAnalysisProps {
  leadId: number;
}

// Mock data structure for company analysis
const mockAnalysisData = {
  status: 'completed',
  website_url: 'https://example.com',
  updated_at: new Date().toISOString(),
  analysis: {
    company_summary: 'Example Corp is a leading provider of innovative software solutions for businesses of all sizes. They specialize in AI-powered CRM systems, data analytics, and cloud infrastructure services.',
    industry: 'Software & Technology',
    products_services: [
      'AI-powered CRM systems',
      'Data analytics platforms',
      'Cloud infrastructure services',
      'Business intelligence tools'
    ],
    value_proposition: 'Helping businesses leverage AI and data to drive growth and improve customer relationships.',
    target_audience: 'Mid-size to enterprise businesses looking to modernize their technology stack.',
    company_size_estimate: 'Medium (50-200 employees)',
    strengths: [
      'Strong technical expertise',
      'Innovative product offerings',
      'Established market presence',
      'Comprehensive solution suite'
    ],
    opportunities: [
      'Expanding into new markets',
      'Upselling additional services',
      'Partnership opportunities',
      'Integration with existing systems'
    ],
    conversion_strategy: 'Focus on demonstrating ROI and integration capabilities. Highlight case studies from similar companies in their industry.',
    key_topics: [
      'Digital transformation',
      'AI implementation',
      'Data security',
      'Operational efficiency'
    ],
    potential_pain_points: [
      'Legacy system integration',
      'Data migration challenges',
      'Staff training and adoption',
      'Budget constraints'
    ],
    lead_score_factors: [
      'Strong alignment with our solution',
      'Active growth phase',
      'Recent technology investments',
      'Engagement with marketing content'
    ],
    content_length: 15000,
    subpages_analyzed: 4
  }
};

const CompanyAnalysis: React.FC<CompanyAnalysisProps> = ({ leadId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    isEnabled: useMockFeatures,
    useCompanyAnalysisMockData,
    autoTriggerAnalysis
  } = useMockData();
  
  // Function to fetch company analysis data
  const fetchAnalysisData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (useMockFeatures && useCompanyAnalysisMockData) {
        // Use mock data with a delay to simulate loading
        setTimeout(() => {
          setAnalysisData(mockAnalysisData);
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // Real API call
      const response = await fetch(`/api/company-analysis/${leadId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch company analysis');
      }
      
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error('Error fetching company analysis:', err);
      setError('Failed to load company analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to trigger web scraping
  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    
    try {
      if (useMockFeatures && useCompanyAnalysisMockData) {
        // Simulate progress updates
        const interval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + Math.floor(Math.random() * 15);
            if (newProgress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setAnalysisData(mockAnalysisData);
                setIsAnalyzing(false);
              }, 500);
              return 100;
            }
            return newProgress;
          });
        }, 800);
        return;
      }
      
      // Real API call
      const response = await fetch(`/api/company-analysis/${leadId}/trigger`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger web scraping');
      }
      
      // Start polling for status
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/company-analysis/status/${leadId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'pending') {
            setProgress(10);
          } else if (statusData.status === 'in_progress') {
            setProgress(50);
          } else if (statusData.status === 'completed') {
            setProgress(100);
            clearInterval(statusInterval);
            fetchAnalysisData();
            setIsAnalyzing(false);
          } else if (['failed', 'invalid_url', 'no_content'].includes(statusData.status)) {
            setProgress(100);
            clearInterval(statusInterval);
            setError(`Analysis ${statusData.status}: ${statusData.message || 'An error occurred'}`);
            setIsAnalyzing(false);
          }
        } catch (err) {
          console.error('Error checking status:', err);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Error triggering analysis:', err);
      setError('Failed to start analysis. Please try again.');
      setIsAnalyzing(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchAnalysisData();
  }, [leadId, useMockFeatures, useCompanyAnalysisMockData]);
  
  // Auto-trigger analysis if enabled and no data exists
  useEffect(() => {
    if (autoTriggerAnalysis && !isLoading && !isAnalyzing && !analysisData && !error) {
      triggerAnalysis();
    }
  }, [autoTriggerAnalysis, isLoading, isAnalyzing, analysisData, error]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Analysis Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={triggerAnalysis}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render analyzing state
  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Company Website
            </CardTitle>
            <CardDescription>
              This may take a few minutes. We're scraping the company website and analyzing the content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {progress < 30 ? 'Scraping website content...' : 
               progress < 70 ? 'Analyzing content...' : 
               'Finalizing analysis...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If no analysis data is available yet
  if (!analysisData || !analysisData.analysis) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Analysis</CardTitle>
            <CardDescription>
              No analysis available yet. Start the analysis to gather insights about this company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={triggerAnalysis}>
              <Building className="mr-2 h-4 w-4" />
              Analyze Company
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render completed analysis
  const analysis = analysisData.analysis;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Company Analysis</h2>
          <p className="text-muted-foreground">
            Based on content from {analysisData.website_url || 'company website'}
          </p>
        </div>
        <Button variant="outline" onClick={triggerAnalysis}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{analysis.company_summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{analysis.industry}</Badge>
            <Badge variant="outline">{analysis.company_size_estimate}</Badge>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Products & Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.products_services?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              )) || <li>No information available</li>}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Target Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{analysis.target_audience || 'No information available'}</p>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Value Proposition</h4>
              <p>{analysis.value_proposition || 'No information available'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.strengths?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              )) || <li>No information available</li>}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {analysis.opportunities?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              )) || <li>No information available</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Conversion Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{analysis.conversion_strategy || 'No strategy available'}</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Key Topics to Discuss</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.key_topics?.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                )) || <li>No information available</li>}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Potential Pain Points</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysis.potential_pain_points?.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                )) || <li>No information available</li>}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Lead Score Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {analysis.lead_score_factors?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            )) || <li>No information available</li>}
          </ul>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Analysis based on {analysis.content_length?.toLocaleString() || 0} characters of content from {analysis.subpages_analyzed || 0} pages.</p>
            <p>Last updated: {new Date(analysisData.updated_at).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyAnalysis; 