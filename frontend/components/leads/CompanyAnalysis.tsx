import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, CheckCircle, RefreshCw, Building, Target, Users, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useMockData } from '../../hooks/useMockData';
import { useLLM, useLLMInfo } from '../../contexts/LLMContext';
import { toast } from 'sonner';

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
  
  const { settings, loading: llmLoading, error: llmError } = useLLM();
  const { modelName, provider } = useLLMInfo();
  
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
  
  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    
    try {
      // Handle mock data scenario
      if (useMockFeatures && useCompanyAnalysisMockData) {
        // Simulate analysis process with delays
        setProgress(10);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        setAnalysisData(mockAnalysisData);
        setIsAnalyzing(false);
        return;
      }
      
      // Check if we have a model configured
      if (llmLoading) {
        toast.info('Loading LLM settings...');
        setProgress(5);
        
        // Wait for settings to load
        let attempt = 0;
        while (llmLoading && attempt < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempt++;
        }
        
        if (llmLoading || llmError) {
          throw new Error('LLM settings could not be loaded. Please try again.');
        }
      }
      
      if (!settings?.defaultModel) {
        throw new Error('No LLM model configured. Please set up a default model in settings.');
      }
      
      // Get lead information including website URL
      const leadResponse = await fetch(`/api/leads/${leadId}`);
      if (!leadResponse.ok) {
        throw new Error('Failed to fetch lead information');
      }
      
      const leadData = await leadResponse.json();
      const websiteUrl = leadData.website || leadData.company_website;
      
      if (!websiteUrl) {
        throw new Error('No website URL available for analysis');
      }
      
      // Start the analysis using centralized LLM service
      setProgress(10);
      
      // Prepare a comprehensive, structured prompt for company analysis
      const analysisPrompt = `
You are a business analyst tasked with analyzing a company's website and providing structured insights for a sales team.

WEBSITE URL: ${websiteUrl}

Please analyze this company thoroughly and provide a structured analysis with the following components:

1. Company Summary: A 2-3 sentence overview of what the company does
2. Industry: The primary industry the company operates in
3. Products/Services: A list of their main products or services (at least 3-5)
4. Value Proposition: Their core value proposition to customers
5. Target Audience: Description of their ideal customer profile
6. Company Size Estimate: Small/Medium/Large (with employee range if detectable)
7. Strengths: List 3-5 competitive advantages or strengths
8. Opportunities: List 3-5 potential opportunities for our solutions
9. Conversion Strategy: Brief strategy on how to approach selling to this company
10. Key Topics: List 3-5 topics that matter to this company
11. Potential Pain Points: List 3-5 business challenges they might face
12. Lead Score Factors: List 3-5 reasons this company would or wouldn't be a good fit

Format your response as a clean JSON object with these exact keys:
{
  "company_summary": "string",
  "industry": "string",
  "products_services": ["string", "string"],
  "value_proposition": "string",
  "target_audience": "string",
  "company_size_estimate": "string",
  "strengths": ["string", "string"],
  "opportunities": ["string", "string"],
  "conversion_strategy": "string",
  "key_topics": ["string", "string"],
  "potential_pain_points": ["string", "string"],
  "lead_score_factors": ["string", "string"]
}`;

      const analysisResponse = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          feature_name: 'company_analysis',
          response_format: { type: "json_object" },
          temperature: 0.2,
          model_name: settings?.defaultModel?.model_name,
        }),
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'Failed to start company analysis');
      }
      
      // Get the analyzed text
      const analysisResult = await analysisResponse.json();
      setProgress(50);
      
      // Process the analysis result
      try {
        // Convert the LLM response into structured data
        let processedData;
        
        // Try to parse the response as JSON first
        try {
          let cleanResponse = analysisResult.text.trim();
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json|```/g, '').trim();
          }
          processedData = JSON.parse(cleanResponse);
        } catch (parseError) {
          // If not JSON, process it as text
          console.warn('Analysis result is not valid JSON, processing as text', parseError);
          
          const analysisText = analysisResult.text;
          
          // Extract sections using regex patterns
          const extractSection = (section: string, text: string): string => {
            const regex = new RegExp(`${section}[:\\s]*(.*?)(?=\\n\\n|$)`, 's');
            const match = text.match(regex);
            return match ? match[1].trim() : '';
          };
          
          const extractListItems = (section: string, text: string): string[] => {
            const sectionText = extractSection(section, text);
            if (!sectionText) return [];
            
            // Split by lines and filter out empty lines and bullet points
            return sectionText.split('\n')
              .map((line: string) => line.replace(/^[-*•]/, '').trim())
              .filter((line: string) => line.length > 0);
          };
          
          processedData = {
            company_summary: extractSection('company summary|summary', analysisText),
            industry: extractSection('industry', analysisText),
            products_services: extractListItems('products|services|products_services|products and services', analysisText),
            value_proposition: extractSection('value proposition|value_proposition', analysisText),
            target_audience: extractSection('target audience|target_audience', analysisText),
            company_size_estimate: extractSection('company size|size|company_size', analysisText),
            strengths: extractListItems('strengths', analysisText),
            opportunities: extractListItems('opportunities', analysisText),
            conversion_strategy: extractSection('conversion strategy|conversion_strategy', analysisText),
            key_topics: extractListItems('key topics|key_topics', analysisText), 
            potential_pain_points: extractListItems('pain points|pain_points|potential pain points', analysisText),
            lead_score_factors: extractListItems('lead score factors|lead_score_factors', analysisText),
          };
        }
        
        // Save analysis to the backend
        const saveResponse = await fetch(`/api/company-analysis/${leadId}`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysis: processedData,
            website_url: websiteUrl,
            model_info: {
              provider: provider || settings?.defaultModel?.provider,
              model_name: modelName || settings?.defaultModel?.model_name,
              tokens: analysisResult.usage?.total_tokens || 0
            }
          }),
        });
        
        if (!saveResponse.ok) {
          console.warn('Failed to save analysis results, but continuing to display results');
        }
        
        // Update the analysis data with the processed results
        setAnalysisData({
          status: 'completed',
          website_url: websiteUrl,
          updated_at: new Date().toISOString(),
          analysis: processedData,
          model_info: {
            provider: provider || settings?.defaultModel?.provider,
            model_name: modelName || settings?.defaultModel?.model_name,
            tokens: analysisResult.usage?.total_tokens || 0
          }
        });
        
        setProgress(100);
        setIsAnalyzing(false);
      } catch (processingError) {
        console.error('Error processing analysis result:', processingError);
        throw new Error('Failed to process analysis result. Please try again.');
      }
      
    } catch (err: unknown) {
      console.error('Error triggering analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start analysis: ${errorMessage}`);
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