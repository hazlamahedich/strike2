import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from '@/components/ui/use-toast';
import { ArrowUpRight, Bell, Clock, Filter, MoreHorizontal, RefreshCw, UserRound, BarChart3, Wand2, Copy, Lightbulb, Send, Calendar, ArrowRight, ArrowRight as ArrowRightIcon, Workflow } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import apiClient from '@/lib/api/client';
// import { getLowConversionLeads } from '@/lib/api/leads';
import { 
  analyzeLowConversionPipeline, 
  generateLowConversionContent, 
  runLowConversionWorkflow 
} from '@/lib/api/llm';
import { 
  logActivity, 
  ActivityType, 
  ActivitySource, 
  getLeadActivities
} from '@/lib/api/activity';
import { sendEmail, scheduleEmail } from '@/lib/api/email';
import {
  WorkflowType,
  PipelineStage,
  moveLeadToStage,
  changeLeadWorkflow,
  evaluateLeadForTransition,
  runWorkflowTransitions,
  clientEvaluateTransition
} from '@/lib/api/workflow';
import AdminWorkflowControls from './AdminWorkflowControls';
import type { ApiResponse, ApiError } from '@/lib/api/client';
import { mapStageToLeadStatus, shouldUpdateLeadStatus } from '../../lib/utils/pipeline-utils';
import { LeadStatus } from '../../lib/types/lead';
import { ExitDecisionDialog } from './ExitDecisionDialog';

// Types for API responses
interface AnalysisResponse {
  summary: string;
  key_metrics: string[];
  successful_patterns: string[];
  recommendations: string[];
  content_suggestions: string[];
  experimental_ideas: string[];
  next_steps: string[];
  analysis_date: string;
  campaign_id: number;
  data_period_days: number;
}

interface ContentResponse {
  subject: string;
  content: string;
  template_type: string;
  lead_id: number;
  success: boolean;
}

// Mock implementations of remaining API functions until they're ready
const agentIntervene = async (leadId: number, action: string = 'manual_takeover') => {
  console.log(`Mock agent intervention on lead: ${leadId}, action: ${action}`);
  return { 
    data: { success: true },
    error: null
  };
};

// Mock implementation of getLowConversionLeads until we implement it
const getLowConversionLeads = async (options?: any) => {
  console.log(`Mock get low conversion leads with options:`, options);
  return {
    data: [],
    error: null
  };
};

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
  conversion_probability: number;
  workflow_name: string;
  days_in_pipeline: number;
  last_activity: string;
  avatar_url?: string;
  campaign_id: number;
  campaign_name: string;
  current_stage: string;
  days_in_stage: number;
  last_activity_date?: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  leads: Lead[];
}

const workflowColors: Record<string, string> = {
  'Hibernating': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Re-engagement': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Education': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Long-term': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

const daysSeverity = (days: number) => {
  if (days < 30) return 'text-green-500 dark:text-green-400';
  if (days < 60) return 'text-amber-500 dark:text-amber-400';
  if (days < 90) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-500 dark:text-red-400';
};

// Define email templates
const EMAIL_TEMPLATES = {
  'educational': 'Providing valuable industry insights and educational content',
  'social_proof': 'Sharing success stories and testimonials',
  'pain_point': 'Addressing specific pain points with helpful resources',
  're_engagement': 'Checking in after a period of no engagement'
};

// Mock implementations that can be used as fallbacks during development
// These are not used directly now but kept for reference or fallback
const analyzeLowConversionPipelineMock = async (days: number = 30) => {
  console.log(`Mock analysis request with days: ${days}`);
  return { 
    data: {
      summary: "The low conversion pipeline shows a 15% improvement in engagement rates with personalized content.",
      key_metrics: [
        "18.5% conversion rate (up from 15.3% last month)",
        "Average lead time in pipeline: 45 days",
        "Email open rate: 28.7% (industry average: 21.5%)",
        "Response rate: 5.2% (up from 3.8% last quarter)"
      ],
      successful_patterns: [
        "Educational content receives highest engagement in early stages",
        "Leads from technology sector respond better to social proof",
        "Personalized subject lines increase open rates by 32%",
        "Case studies get higher click-through rates than general resources"
      ],
      recommendations: [
        "Increase educational content frequency in early nurture stage",
        "Add more industry-specific case studies to value proposition emails",
        "Segment leads by industry for more targeted messaging",
        "Reduce time between emails in re-engagement stage",
        "Consider adding video content for higher engagement"
      ],
      content_suggestions: [
        "Create an industry trends report for educational stage",
        "Develop ROI calculator tools for value proposition stage",
        "Add customer success stories from similar companies",
        "Create FAQ content addressing common objections"
      ],
      experimental_ideas: [
        "Test interactive assessments to boost engagement",
        "Try conversational AI for targeted follow-ups",
        "Use micro-surveys to gather lead preferences"
      ],
      next_steps: [
        "Review the recommendations and prioritize implementation based on effort vs. impact",
        "A/B test new content variations based on the content suggestions",
        "Adjust email timing and sequencing based on engagement patterns",
        "Refine lead segmentation to better target content to specific lead groups",
        "Schedule a follow-up analysis in 30 days to measure improvements"
      ],
      analysis_date: new Date().toISOString(),
      campaign_id: 123,
      data_period_days: days
    },
    error: null
  };
};

const generateLowConversionContentMock = async (leadId: number, templateType: string, cycle: number = 0) => {
  console.log(`Mock content generation for lead: ${leadId}, template: ${templateType}, cycle: ${cycle}`);
  return {
    data: {
      subject: `Resources that might help your ${templateType === 'pain_point' ? 'challenges' : 'plans'} at ${Math.random().toString(36).substring(7)}`,
      content: `Dear [Lead Name],\n\nI hope this email finds you well. I wanted to share some resources that might be helpful for your current initiatives.\n\n[Personalized content would appear here based on lead data and selected template]\n\nLet me know if you'd like to discuss any of these topics further.\n\nBest regards,\nThe Team`,
      template_type: templateType,
      lead_id: leadId,
      success: true
    },
    error: null
  };
};

const LowConversionPipeline: React.FC = () => {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterWorkflow, setFilterWorkflow] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<{id: number, name: string}[]>([]);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState<boolean>(false);
  const [showContentDialog, setShowContentDialog] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<ContentResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('educational');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [showActivitiesDialog, setShowActivitiesDialog] = useState<boolean>(false);
  const { theme } = useTheme();
  const [isRunningWorkflows, setIsRunningWorkflows] = useState<boolean>(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState<boolean>(false);
  const [transitionSummary, setTransitionSummary] = useState<{
    processedLeads: number;
    transitionedLeads: number;
    transitions: Array<{
      leadId: number;
      leadName: string;
      previousStage: string;
      newStage: string;
      previousWorkflow?: string;
      newWorkflow?: string;
    }>;
  } | null>(null);
  const [showStageTransitionDialog, setShowStageTransitionDialog] = useState<boolean>(false);
  const [showWorkflowTransitionDialog, setShowWorkflowTransitionDialog] = useState<boolean>(false);
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [recommendedTransition, setRecommendedTransition] = useState<{
    shouldTransition: boolean;
    recommendedStage?: PipelineStage;
    reason?: string;
  } | null>(null);
  const [showExitDecisionDialog, setShowExitDecisionDialog] = useState<boolean>(false);
  
  useEffect(() => {
    // Fetch campaigns data
    const fetchCampaigns = async () => {
      try {
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        const mockCampaigns = [
          { id: 1, name: 'Q4 Outreach Campaign' },
          { id: 2, name: 'Product Launch Nurture' },
          { id: 3, name: 'Re-engagement Campaign' },
          { id: 4, name: 'New Lead Onboarding' },
          { id: 5, name: 'Enterprise Accounts' },
        ];
        
        setCampaigns(mockCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
    
    fetchCampaigns();
  }, []);
  
  useEffect(() => {
    const fetchLowConversionLeads = async () => {
      setIsLoading(true);
      
      // Define mock data upfront
      const mockStages: WorkflowStage[] = [
        {
          id: 'early_nurture',
          name: 'Early Nurture',
          leads: [
            {
              id: 1,
              name: 'John Smith',
              email: 'john@example.com',
              company: 'Acme Corp',
              status: 'Contacted',
              conversion_probability: 0.25,
              workflow_name: 'Hibernating',
              days_in_pipeline: 15,
              last_activity: new Date().toISOString(),
              campaign_id: 1,
              campaign_name: 'Campaign 1',
              current_stage: 'early_nurture',
              days_in_stage: 15,
              last_activity_date: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'Jane Doe',
              email: 'jane@example.com',
              company: 'XYZ Inc',
              status: 'New',
              conversion_probability: 0.15,
              workflow_name: 'Long-term',
              days_in_pipeline: 5,
              last_activity: new Date().toISOString(),
              campaign_id: 1,
              campaign_name: 'Campaign 1',
              current_stage: 'early_nurture',
              days_in_stage: 5,
              last_activity_date: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'education',
          name: 'Education',
          leads: [
            {
              id: 3,
              name: 'Mike Johnson',
              email: 'mike@example.com',
              company: 'Tech Solutions',
              status: 'Engaged',
              conversion_probability: 0.35,
              workflow_name: 'Education',
              days_in_pipeline: 45,
              last_activity: new Date().toISOString(),
              campaign_id: 2,
              campaign_name: 'Campaign 2',
              current_stage: 'education',
              days_in_stage: 45,
              last_activity_date: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'value_proposition',
          name: 'Value Proposition',
          leads: [
            {
              id: 4,
              name: 'Sarah Williams',
              email: 'sarah@example.com',
              company: 'Global Services',
              status: 'Qualified',
              conversion_probability: 0.30,
              workflow_name: 'Re-engagement',
              days_in_pipeline: 75,
              last_activity: new Date().toISOString(),
              campaign_id: 3,
              campaign_name: 'Campaign 3',
              current_stage: 'value_proposition',
              days_in_stage: 75,
              last_activity_date: new Date().toISOString(),
            },
          ],
        },
        {
          id: 're_engagement',
          name: 'Re-engagement',
          leads: [
            {
              id: 5,
              name: 'Robert Brown',
              email: 'robert@example.com',
              company: 'Innovative LLC',
              status: 'Contacted',
              conversion_probability: 0.20,
              workflow_name: 'Hibernating',
              days_in_pipeline: 95,
              last_activity: new Date().toISOString(),
              campaign_id: 4,
              campaign_name: 'Campaign 4',
              current_stage: 're_engagement',
              days_in_stage: 95,
              last_activity_date: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'exit_decision',
          name: 'Exit Decision',
          leads: [
            {
              id: 6,
              name: 'Lisa Anderson',
              email: 'lisa@example.com',
              company: 'Future Corp',
              status: 'Stalled',
              conversion_probability: 0.10,
              workflow_name: 'Long-term',
              days_in_pipeline: 120,
              last_activity: new Date().toISOString(),
              campaign_id: 5,
              campaign_name: 'Campaign 5',
              current_stage: 'exit_decision',
              days_in_stage: 120,
              last_activity_date: new Date().toISOString(),
            },
          ],
        },
      ];
      
      try {
        // In development, use mock data immediately instead of trying to reach the API
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode - using mock data without API call');
          setStages(mockStages);
          setIsLoading(false);
          return;
        }
        
        console.log('Attempting to fetch real data from API...');
        
        // Use a Promise race with a timeout instead of AbortController
        const fetchWithTimeout = async () => {
          // Add the campaign filter to the URL if it exists
          let url = '/api/leads/low-conversion';
          if (filterCampaign) {
            url += `?campaign_id=${filterCampaign}`;
          }
          
          const fetchPromise = fetch(url);
          
          // Create a timeout promise that rejects after 3 seconds (reduced from 5)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), 3000)
          );
          
          try {
            // Race the fetch against the timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
            
            if (response.ok) {
              const data = await response.json();
              
              if (Array.isArray(data) && data.length > 0) {
                console.log('Successfully fetched real data from API');
                
                // Process the real data
                // Group leads by their current stage in the workflow
                const stageMap: Record<string, WorkflowStage> = {
                  'early_nurture': { id: 'early_nurture', name: 'Early Nurture', leads: [] },
                  'education': { id: 'education', name: 'Education', leads: [] },
                  'value_proposition': { id: 'value_proposition', name: 'Value Proposition', leads: [] },
                  're_engagement': { id: 're_engagement', name: 'Re-engagement', leads: [] },
                  'exit_decision': { id: 'exit_decision', name: 'Exit Decision', leads: [] },
                };
                
                data.forEach((lead: any) => {
                  // Map API lead to our lead structure
                  const mappedLead: Lead = {
                    id: lead.id,
                    name: lead.name,
                    email: lead.email,
                    company: lead.company || '',
                    status: lead.status,
                    conversion_probability: lead.conversion_probability,
                    workflow_name: lead.workflow_name,
                    days_in_pipeline: lead.days_in_pipeline || 
                      Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
                    last_activity: lead.last_activity,
                    avatar_url: lead.avatar_url,
                    campaign_id: lead.campaign_id,
                    campaign_name: lead.campaign_name,
                    current_stage: lead.workflow_stage,
                    days_in_stage: lead.days_in_pipeline || 
                      Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
                    last_activity_date: lead.last_activity,
                  };
                  
                  // Add to appropriate stage
                  if (stageMap[lead.workflow_stage]) {
                    stageMap[lead.workflow_stage].leads.push(mappedLead);
                  } else {
                    // Default to early nurture if stage is unknown
                    stageMap.early_nurture.leads.push(mappedLead);
                  }
                });
                
                // Convert map to array and sort leads within each stage
                const stagesArray = Object.values(stageMap).map(stage => ({
                  ...stage,
                  leads: stage.leads.sort((a, b) => b.conversion_probability - a.conversion_probability)
                }));
                
                setStages(stagesArray);
                setIsLoading(false);
                return;
              } else {
                console.log('API returned empty or invalid data, falling back to mock data');
                setStages(mockStages);
              }
            } else {
              console.log('API response not OK, falling back to mock data:', response.status);
              setStages(mockStages);
            }
          } catch (error) {
            console.error('Fetch operation failed:', error);
            // If timeout or fetch error, use mock data
            setStages(mockStages);
            
            toast({
              title: 'Using Mock Data',
              description: 'Showing sample data due to API timeout or connectivity issues',
              variant: 'default',
            });
          }
        };
        
        await fetchWithTimeout();
      } catch (error) {
        console.error('Error fetching low conversion leads:', error);
        setStages(mockStages);
        
        toast({
          title: 'Using Mock Data',
          description: 'Showing sample data due to API connectivity issues',
          variant: 'default',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLowConversionLeads();
  }, [filterCampaign]); // Include filterCampaign as dependency
  
  // Handle agent intervention
  const handleAgentIntervention = async (leadId: number) => {
    try {
      toast({
        title: 'Success',
        description: 'You have taken over this lead from automation',
      });
      
      // Uncomment when API is ready
      /*
      const response = await apiClient.post(`/api/leads/${leadId}/intervene`, {
        action: 'manual_takeover'
      });
      
      if (response.error) {
        toast({
          title: 'Error',
          description: 'Failed to intervene on this lead',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'You have taken over this lead from automation',
      });
      */
      
      // Update local state to reflect the change
      setStages(currentStages => 
        currentStages.map(stage => ({
          ...stage,
          leads: stage.leads.filter(lead => lead.id !== leadId)
        }))
      );
    } catch (error) {
      console.error('Error intervening on lead:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Handle pipeline analysis
  const handleAnalyzePipeline = async () => {
    setIsAnalyzing(true);
    try {
      // Use the imported API function
      const response = await analyzeLowConversionPipeline(30);
      
      if ('error' in response && response.error) {
        toast({
          title: 'Error',
          description: 'Failed to analyze pipeline',
          variant: 'destructive',
        });
        return;
      }
      
      // Type guard to ensure we're working with ApiResponse<AnalysisResponse>
      if ('data' in response) {
        setAnalysisResults(response.data);
        setShowAnalysisDialog(true);
      }
    } catch (error) {
      console.error('Error analyzing pipeline:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle content generation for a specific lead
  const handleGenerateContent = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowContentDialog(true);
  };
  
  // Fetch activities for a lead
  const fetchLeadActivities = async (leadId: number) => {
    try {
      const activityList = await getLeadActivities(leadId);
      setActivities(activityList);
      return activityList;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };

  // Handle sending email
  const handleSendEmail = async () => {
    if (!selectedLead || !generatedContent) return;

    setIsSendingEmail(true);
    try {
      // Check if we need to update the lead status (if it's NEW, update to CONTACTED)
      const updateStatus = selectedLead.status === LeadStatus.NEW;
      
      const result = await sendEmail({
        to: selectedLead.email,
        from: 'marketing@yourdomain.com', // This should come from settings or current user
        subject: generatedContent.subject,
        content: generatedContent.content,
        leadId: selectedLead.id.toString(),
        campaignId: selectedLead.campaign_id.toString(),
        updateLeadStatus: updateStatus ? LeadStatus.CONTACTED : undefined
      });

      if (result.success) {
        // Log the activity
        await logActivity({
          leadId: selectedLead.id,
          activityType: ActivityType.EMAIL_SENT,
          source: ActivitySource.USER,
          payload: {
            subject: generatedContent.subject,
            template: selectedTemplate,
            statusUpdated: updateStatus
          }
        });

        // Show appropriate toast message
        toast({
          title: 'Email sent successfully',
          description: `Email has been sent to ${selectedLead.name}${updateStatus ? ' and status updated to Contacted' : ''}`,
        });

        // Refresh activities if activities dialog is open
        if (showActivitiesDialog) {
          await fetchLeadActivities(selectedLead.id);
        }

        // Refresh lead data to show updated status if needed
        if (updateStatus) {
          refreshLeads();
        }

        // Close the content dialog
        setShowContentDialog(false);
      } else {
        toast({
          title: 'Error sending email',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while sending email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle scheduling email
  const handleScheduleEmail = async () => {
    if (!selectedLead || !generatedContent || !scheduledDate) return;

    setIsSendingEmail(true);
    try {
      const result = await scheduleEmail({
        to: selectedLead.email,
        from: 'marketing@yourdomain.com', // This should come from settings or current user
        subject: generatedContent.subject,
        content: generatedContent.content,
        leadId: selectedLead.id.toString(),
        campaignId: selectedLead.campaign_id.toString(),
        scheduledDate: scheduledDate
      });

      if (result.success) {
        // Log the activity
        await logActivity({
          leadId: selectedLead.id,
          activityType: ActivityType.EMAIL_SCHEDULED,
          source: ActivitySource.USER,
          payload: {
            subject: generatedContent.subject,
            scheduledDate,
            template: selectedTemplate,
            scheduledId: result.scheduledId
          }
        });

        toast({
          title: 'Email scheduled successfully',
          description: `Email has been scheduled to ${selectedLead.name}`,
        });

        // Refresh activities if activities dialog is open
        if (showActivitiesDialog) {
          await fetchLeadActivities(selectedLead.id);
        }

        // Close dialogs
        setShowScheduleDialog(false);
        setShowContentDialog(false);
      } else {
        toast({
          title: 'Error scheduling email',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scheduling email:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while scheduling email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Show activities dialog
  const showActivities = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowActivitiesDialog(true);
    await fetchLeadActivities(lead.id);
  };

  // Generate personalized content for the selected lead
  const generatePersonalizedContent = async () => {
    if (!selectedLead) return;
    
    setIsGeneratingContent(true);
    try {
      // Use the imported API function
      const response = await generateLowConversionContent(
        selectedLead.id, 
        selectedTemplate,
        0 // Assuming first cycle
      );
      
      if ('error' in response && response.error) {
        toast({
          title: 'Error',
          description: 'Failed to generate content',
          variant: 'destructive',
        });
        return;
      }
      
      // Type guard to ensure we're working with ApiResponse<ContentResponse>
      if ('data' in response) {
        setGeneratedContent({
          subject: response.data.subject,
          content: response.data.content,
          template_type: response.data.template_type,
          lead_id: response.data.lead_id,
          success: response.data.success
        });

        // Log activity for content generation
        await logActivity({
          leadId: selectedLead.id,
          activityType: ActivityType.CONTENT_GENERATED,
          source: ActivitySource.USER,
          payload: {
            template: selectedTemplate
          }
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };
  
  // Copy generated content to clipboard
  const copyContentToClipboard = () => {
    if (!generatedContent) return;
    
    const fullContent = `Subject: ${generatedContent.subject}\n\n${generatedContent.content}`;
    navigator.clipboard.writeText(fullContent).then(() => {
      toast({
        title: 'Copied to clipboard',
        description: 'The content has been copied to your clipboard',
      });
    });
  };
  
  const filteredStages = stages.map(stage => ({
    ...stage,
    leads: stage.leads.filter(lead => 
      // Apply workflow filter if set
      (!filterWorkflow || lead.workflow_name === filterWorkflow) && 
      // Apply campaign filter if set
      (!filterCampaign || lead.campaign_id === filterCampaign)
    )
  }));
  
  // Get unique workflow names for filtering
  const workflowNames = Array.from(
    new Set(stages.flatMap(stage => stage.leads.map(lead => lead.workflow_name)))
  );
  
  // Function to refresh leads data
  const refreshLeads = async () => {
    setIsLoading(true);
    try {
      // Add the campaign filter to the URL if it exists
      let url = '/api/leads/low-conversion';
      if (filterCampaign) {
        url += `?campaign_id=${filterCampaign}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        // Process the updated data
        const stageMap: Record<string, WorkflowStage> = {
          'early_nurture': { id: 'early_nurture', name: 'Early Nurture', leads: [] },
          'education': { id: 'education', name: 'Education', leads: [] },
          'value_proposition': { id: 'value_proposition', name: 'Value Proposition', leads: [] },
          're_engagement': { id: 're_engagement', name: 'Re-engagement', leads: [] },
          'exit_decision': { id: 'exit_decision', name: 'Exit Decision', leads: [] },
        };
        
        data.forEach((lead: any) => {
          const mappedLead: Lead = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            company: lead.company || '',
            status: lead.status,
            conversion_probability: lead.conversion_probability,
            workflow_name: lead.workflow_name,
            days_in_pipeline: lead.days_in_pipeline || 
              Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
            last_activity: lead.last_activity,
            avatar_url: lead.avatar_url,
            campaign_id: lead.campaign_id,
            campaign_name: lead.campaign_name,
            current_stage: lead.workflow_stage,
            days_in_stage: lead.days_in_pipeline || 
              Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
            last_activity_date: lead.last_activity,
          };
          
          if (stageMap[lead.workflow_stage]) {
            stageMap[lead.workflow_stage].leads.push(mappedLead);
          } else {
            stageMap.early_nurture.leads.push(mappedLead);
          }
        });
        
        const stagesArray = Object.values(stageMap).map(stage => ({
          ...stage,
          leads: stage.leads.sort((a, b) => b.conversion_probability - a.conversion_probability)
        }));
        
        setStages(stagesArray);
      }
    } catch (error) {
      console.error('Error refreshing leads data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh leads data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle manual stage transition for a lead
  const handleLeadStageTransition = async (lead: Lead, newStage: PipelineStage) => {
    if (!lead) return;
    
    setSelectedLead(lead);
    setTransitionReason('');
    setShowStageTransitionDialog(true);
    
    try {
      // Get recommendation for the transition
      const evaluation = await evaluateLeadForTransition(
        lead.id,
        lead.workflow_name,
        lead.current_stage,
        lead.days_in_stage,
        lead.conversion_probability,
        lead.last_activity_date
      );
      
      setRecommendedTransition(evaluation);
    } catch (error) {
      console.error('Error evaluating transition:', error);
      setRecommendedTransition(null);
    }
  };

  // Confirm stage transition
  const confirmStageTransition = async (newStage: PipelineStage) => {
    if (!selectedLead || !transitionReason) {
      toast({
        title: 'Input Required',
        description: 'Please provide a reason for this transition',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Determine if lead status needs to be updated based on the stage transition
      const currentStatus = selectedLead.status as unknown as LeadStatus;
      const updateStatus = shouldUpdateLeadStatus(currentStatus, newStage);
      const newStatus = updateStatus ? mapStageToLeadStatus(newStage) : currentStatus;
      
      // Call the API to move the lead and update status if needed
      const success = await moveLeadToStage(
        selectedLead.id,
        newStage,
        selectedLead.current_stage as PipelineStage,
        transitionReason,
        updateStatus ? newStatus : undefined
      );
      
      if (success) {
        toast({
          title: 'Lead Moved',
          description: `Successfully moved lead to ${newStage} stage${updateStatus ? ` and updated status to ${newStatus}` : ''}`,
        });
        
        // Refresh the data
        refreshLeads();
        
        // Show activities if dialog is open
        if (showActivitiesDialog) {
          await fetchLeadActivities(selectedLead.id);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to move the lead to the new stage',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error moving lead:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setShowStageTransitionDialog(false);
    }
  };

  // Handle workflow change for a lead
  const handleWorkflowChange = async (lead: Lead) => {
    setSelectedLead(lead);
    setTransitionReason('');
    setShowWorkflowTransitionDialog(true);
  };

  // Confirm workflow change
  const confirmWorkflowChange = async (newWorkflow: WorkflowType) => {
    if (!selectedLead || !transitionReason) {
      toast({
        title: 'Input Required',
        description: 'Please provide a reason for changing the workflow',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const success = await changeLeadWorkflow(
        selectedLead.id,
        newWorkflow,
        selectedLead.workflow_name,
        transitionReason
      );
      
      if (success) {
        toast({
          title: 'Workflow Changed',
          description: `Lead workflow changed to ${newWorkflow}`,
        });
        
        // Refresh the data
        refreshLeads();
        
        // Show activities if dialog is open
        if (showActivitiesDialog) {
          await fetchLeadActivities(selectedLead.id);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to change the lead workflow',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error changing workflow:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setShowWorkflowTransitionDialog(false);
    }
  };

  // Run automated workflow transitions for all leads
  const handleRunWorkflowTransitions = async () => {
    setIsRunningWorkflows(true);
    try {
      const result = await runWorkflowTransitions();
      
      setTransitionSummary({
        processedLeads: result.processedLeads,
        transitionedLeads: result.transitionedLeads,
        transitions: [] // In a real implementation, this would come from the API
      });
      
      setShowTransitionDialog(true);
      
      // Refresh the data
      refreshLeads();
    } catch (error) {
      console.error('Error running workflow transitions:', error);
      toast({
        title: 'Error',
        description: 'Failed to run workflow transitions',
        variant: 'destructive',
      });
    } finally {
      setIsRunningWorkflows(false);
    }
  };

  // Return a badge color based on workflow stage
  const stageBadgeColor = (stage: string) => {
    switch(stage) {
      case PipelineStage.EARLY_NURTURE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case PipelineStage.EDUCATION:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case PipelineStage.VALUE_PROPOSITION:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case PipelineStage.REENGAGEMENT:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case PipelineStage.EXIT_DECISION:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  // Handle exit decision for a lead in the Exit Decision stage
  const handleExitDecision = (lead: Lead) => {
    setSelectedLead(lead);
    setShowExitDecisionDialog(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading low conversion pipeline...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold mb-1">Low Conversion Pipeline</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage leads with low conversion probability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunWorkflowTransitions}
            disabled={isRunningWorkflows || isLoading}
          >
            {isRunningWorkflows ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Running Workflows
              </>
            ) : (
              <>
                <Workflow className="mr-2 h-4 w-4" /> Run Workflow Transitions
              </>
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshLeads} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setView('kanban')}>
                Kanban View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('list')}>
                List View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-1 dark:bg-background/30 rounded-lg">
          {filteredStages.map((stage) => (
            <div key={stage.id} className="flex flex-col">
              <div className="bg-muted p-3 rounded-t-md">
                <h3 className="font-medium">{stage.name}</h3>
                <p className="text-sm text-muted-foreground">{stage.leads.length} leads</p>
              </div>
              
              <div className="bg-card p-2 rounded-b-md flex-1 min-h-[300px] overflow-y-auto border border-border dark:bg-background/50">
                {stage.leads.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="mb-3 cursor-pointer hover:shadow-md transition-shadow dark:border-border dark:hover:border-primary-900 dark:shadow-none dark:hover:bg-card/80"
                  >
                    <CardHeader className="p-3 pb-0 dark:bg-card/90">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            <AvatarImage src={lead.avatar_url} />
                            <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-1 space-x-1">
                          <Badge className={stageBadgeColor(lead.current_stage)}>
                            {lead.current_stage}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ArrowRightIcon className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleLeadStageTransition(lead, PipelineStage.EARLY_NURTURE)}
                                disabled={lead.current_stage === PipelineStage.EARLY_NURTURE}
                              >
                                Move to Early Nurture
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleLeadStageTransition(lead, PipelineStage.EDUCATION)}
                                disabled={lead.current_stage === PipelineStage.EDUCATION}
                              >
                                Move to Education
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleLeadStageTransition(lead, PipelineStage.VALUE_PROPOSITION)}
                                disabled={lead.current_stage === PipelineStage.VALUE_PROPOSITION}
                              >
                                Move to Value Proposition
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleLeadStageTransition(lead, PipelineStage.REENGAGEMENT)}
                                disabled={lead.current_stage === PipelineStage.REENGAGEMENT}
                              >
                                Move to Re-engagement
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleLeadStageTransition(lead, PipelineStage.EXIT_DECISION)}
                                disabled={lead.current_stage === PipelineStage.EXIT_DECISION}
                              >
                                Move to Exit Decision
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 dark:bg-card/70">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Conversion</p>
                          <p className="font-medium dark:text-slate-200">
                            {(lead.conversion_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Days</p>
                          <p className={`font-medium ${daysSeverity(lead.days_in_pipeline)}`}>
                            {lead.days_in_pipeline}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                          {lead.campaign_name}
                        </span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-2 flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {new Date(lead.last_activity).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showActivities(lead);
                                }}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Activities</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateContent(lead);
                                }}
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate personalized content</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleWorkflowChange(lead);
                                  }}>
                                    Change Workflow
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadStageTransition(lead, lead.current_stage as PipelineStage);
                                  }}>
                                    Evaluate for Transition
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>More options</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {lead.current_stage === PipelineStage.EXIT_DECISION && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExitDecision(lead);
                            }}
                          >
                            Exit Decision
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                
                {stage.leads.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No leads in this stage</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-md shadow overflow-hidden border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Days in Pipeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredStages.flatMap(stage => 
                stage.leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage src={lead.avatar_url} />
                          <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stage.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={workflowColors[lead.workflow_name] || 'bg-muted'}>
                        {lead.workflow_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.campaign_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(lead.conversion_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={daysSeverity(lead.days_in_pipeline)}>
                        {lead.days_in_pipeline} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(lead.last_activity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm flex justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          showActivities(lead);
                        }}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Activities
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateContent(lead);
                        }}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        Generate
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 dark:hover:text-primary-300"
                          >
                            <Workflow className="w-3 h-3 mr-1" />
                            Workflow
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleWorkflowChange(lead);
                          }}>
                            Change Workflow
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleLeadStageTransition(lead, lead.current_stage as PipelineStage);
                          }}>
                            Evaluate for Transition
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {lead.current_stage === PipelineStage.EXIT_DECISION && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExitDecision(lead);
                          }}
                        >
                          Exit Decision
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              
              {filteredStages.flatMap(stage => stage.leads).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Analysis Results Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pipeline Analysis Results</DialogTitle>
            <DialogDescription>
              AI-generated insights and recommendations for your low conversion pipeline
            </DialogDescription>
          </DialogHeader>
          
          {analysisResults && (
            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                  Summary
                </h3>
                <p>{analysisResults.summary}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Key Metrics</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.key_metrics.map((metric: string, index: number) => (
                    <li key={index}>{metric}</li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-md p-4">
                  <h3 className="font-medium text-lg mb-2">Successful Patterns</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResults.successful_patterns.map((pattern: string, index: number) => (
                      <li key={index}>{pattern}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="border border-border rounded-md p-4">
                  <h3 className="font-medium text-lg mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResults.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Content Suggestions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.content_suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <h3 className="font-medium text-lg mb-2">Experimental Ideas</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.experimental_ideas.map((idea: string, index: number) => (
                    <li key={index}>{idea}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Next Steps</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  {analysisResults.next_steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalysisDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Content Generation Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Personalized Content</DialogTitle>
            <DialogDescription>
              Create AI-powered content for {selectedLead?.name} from {selectedLead?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Content Template</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(EMAIL_TEMPLATES).map((template) => (
                  <Badge 
                    key={template}
                    variant={selectedTemplate === template ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {template.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={generatePersonalizedContent} 
              disabled={isGeneratingContent || !selectedTemplate}
              className="w-full"
            >
              {isGeneratingContent ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Generate Personalized Content
            </Button>
            
            {generatedContent && (
              <div className="border border-border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Generated Email</h3>
                  <Button variant="ghost" size="sm" onClick={copyContentToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <h4 className="font-medium text-sm">Subject:</h4>
                  <p>{generatedContent.subject}</p>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-2">Body:</h4>
                  <p className="whitespace-pre-line">{generatedContent.content}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={!generatedContent || isSendingEmail}
                    onClick={() => setShowScheduleDialog(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Schedule
                  </Button>
                  <Button 
                    disabled={!generatedContent || isSendingEmail}
                    onClick={handleSendEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContentDialog(false);
                  setSelectedLead(null);
                  setGeneratedContent(null);
                }}
              >
                Cancel
              </Button>
              <Button disabled={!generatedContent} onClick={copyContentToClipboard}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                disabled={!generatedContent || isSendingEmail}
                onClick={() => setShowScheduleDialog(true)}
              >
                <Calendar className="mr-2 h-4 w-4" /> Schedule
              </Button>
              <Button 
                disabled={!generatedContent || isSendingEmail}
                onClick={handleSendEmail}
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Now
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the schedule dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Email</DialogTitle>
            <DialogDescription>
              Choose when to send this email to {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Date and Time</label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Email Preview</h4>
              <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                <p className="font-semibold">{generatedContent?.subject}</p>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="whitespace-pre-line line-clamp-3">{generatedContent?.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {generatedContent?.content.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              disabled={!scheduledDate || isSendingEmail} 
              onClick={handleScheduleEmail}
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Scheduling
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" /> Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the activities dialog */}
      <Dialog open={showActivitiesDialog} onOpenChange={setShowActivitiesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activities for {selectedLead?.name}</DialogTitle>
            <DialogDescription>
              Recent activities and interactions for this lead
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No activities found for this lead</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {activity.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      {activity.type === ActivityType.EMAIL_SENT && (
                        <div>
                          <p><strong>Subject:</strong> {activity.details?.subject}</p>
                          <p><strong>Template:</strong> {activity.details?.template}</p>
                        </div>
                      )}
                      {activity.type === ActivityType.EMAIL_SCHEDULED && (
                        <div>
                          <p><strong>Subject:</strong> {activity.details?.subject}</p>
                          <p><strong>Template:</strong> {activity.details?.template}</p>
                          <p><strong>Scheduled for:</strong> {new Date(activity.details?.scheduledDate).toLocaleString()}</p>
                        </div>
                      )}
                      {activity.type === ActivityType.CONTENT_GENERATED && (
                        <div>
                          <p><strong>Template:</strong> {activity.details?.template}</p>
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        Source: {activity.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowActivitiesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add stage transition dialog */}
      <Dialog open={showStageTransitionDialog} onOpenChange={setShowStageTransitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stage Transition</DialogTitle>
            <DialogDescription>
              Move {selectedLead?.name} to a different stage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {recommendedTransition && recommendedTransition.shouldTransition && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="font-medium">Recommended Transition</p>
                <p className="text-sm mt-1">
                  {recommendedTransition.reason}
                </p>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => confirmStageTransition(recommendedTransition.recommendedStage!)}
                    disabled={!transitionReason}
                  >
                    Apply Recommendation
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Stage:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PipelineStage).map((stage) => (
                  <Button
                    key={stage}
                    variant="outline"
                    className={`justify-start ${
                      selectedLead?.current_stage === stage ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => confirmStageTransition(stage as PipelineStage)}
                    disabled={!transitionReason || selectedLead?.current_stage === stage}
                  >
                    <div className={`w-3 h-3 rounded-full mr-2 ${stageBadgeColor(stage)}`} />
                    {stage}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Transition:</label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Why is this lead being moved to a different stage?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowStageTransitionDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add workflow change dialog */}
      <Dialog open={showWorkflowTransitionDialog} onOpenChange={setShowWorkflowTransitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Workflow</DialogTitle>
            <DialogDescription>
              Move {selectedLead?.name} to a different workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Workflow:</label>
              <div className="p-2 border rounded-md bg-muted">
                <span className={`inline-block px-2 py-1 rounded-md ${
                  workflowColors[selectedLead?.workflow_name || ''] || 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedLead?.workflow_name}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Workflow:</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(WorkflowType).map((workflow) => (
                  <Button
                    key={workflow}
                    variant="outline"
                    className={`justify-start ${
                      selectedLead?.workflow_name === workflow ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => confirmWorkflowChange(workflow)}
                    disabled={!transitionReason || selectedLead?.workflow_name === workflow}
                  >
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      workflowColors[workflow] || 'bg-gray-100'
                    }`} />
                    {workflow}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Change:</label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="Why is this lead being moved to a different workflow?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWorkflowTransitionDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add workflow transition summary dialog */}
      <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Transitions</DialogTitle>
            <DialogDescription>
              Summary of automated workflow transitions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-md text-center">
                <p className="text-lg font-medium">{transitionSummary?.processedLeads || 0}</p>
                <p className="text-sm text-muted-foreground">Leads Processed</p>
              </div>
              <div className="p-4 bg-muted rounded-md text-center">
                <p className="text-lg font-medium">{transitionSummary?.transitionedLeads || 0}</p>
                <p className="text-sm text-muted-foreground">Leads Transitioned</p>
              </div>
            </div>
            
            {transitionSummary?.transitions && transitionSummary.transitions.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Lead</th>
                      <th className="px-4 py-2 text-left">From</th>
                      <th className="px-4 py-2 text-left">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitionSummary.transitions.map((transition, index) => (
                      <tr key={index} className={index % 2 === 0 ? '' : 'bg-muted/30'}>
                        <td className="px-4 py-2">{transition.leadName}</td>
                        <td className="px-4 py-2">
                          {transition.previousWorkflow ? (
                            <span className="text-xs bg-muted rounded-md px-2 py-1 mr-1">
                              {transition.previousWorkflow}
                            </span>
                          ) : null}
                          <span className="text-xs bg-muted rounded-md px-2 py-1">
                            {transition.previousStage}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {transition.newWorkflow ? (
                            <span className="text-xs bg-muted rounded-md px-2 py-1 mr-1">
                              {transition.newWorkflow}
                            </span>
                          ) : null}
                          <span className="text-xs bg-muted rounded-md px-2 py-1">
                            {transition.newStage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transitions were made during this run.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTransitionDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Decision Dialog */}
      <ExitDecisionDialog
        lead={selectedLead}
        open={showExitDecisionDialog}
        onOpenChange={setShowExitDecisionDialog}
        onDecisionProcessed={refreshLeads}
      />
    </div>
  );
};

export default LowConversionPipeline; 