import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

// Types for workflow settings
export interface WorkflowStage {
  id: number;
  name: string;
  description: string;
  durationDays: number;
  startDay: number;
  endDay: number;
}

export interface WorkflowType {
  id: number;
  name: string;
  active: boolean;
  duration: number;
  stages: number;
  stageDetails?: WorkflowStage[];
}

export interface EntryCondition {
  id: number;
  name: string;
  type: 'score' | 'activity' | 'behavior';
  value: number | string;
  operator: '<' | '>' | '=' | '<=' | '>=';
}

export interface ExitCondition {
  id: number;
  name: string;
  type: 'score' | 'activity' | 'time' | 'conversion';
  value: number | string;
  operator: '<' | '>' | '=' | '<=' | '>=';
}

export interface EmailTemplate {
  id: number;
  name: string;
  description: string;
  type: 'educational' | 'industry' | 'casestudy' | 'product';
}

export interface DeliverySchedule {
  id: number;
  day: number;
  templateId: number;
  templateName: string;
  condition?: string;
}

export interface AdvancedSettings {
  automaticLeadTransitions: boolean;
  dynamicScoreUpdates: boolean;
  salesTeamAlerts: boolean;
  primarySuccessMetric: string;
  targetValue: number;
  abTesting: string;
  retentionPeriod: string;
  detailedLogging: boolean;
}

export interface WorkflowSettingsData {
  workflowTypes: WorkflowType[];
  entryConditions: EntryCondition[];
  exitConditions: ExitCondition[];
  emailTemplates: {
    educational: EmailTemplate[];
    industry: EmailTemplate[];
    casestudy: EmailTemplate[];
    product: EmailTemplate[];
  };
  deliverySchedules: {
    educational: DeliverySchedule[];
    industry: DeliverySchedule[];
    casestudy: DeliverySchedule[];
    product: DeliverySchedule[];
  };
  advancedSettings: AdvancedSettings;
}

// Mock data (will be replaced by API calls)
const mockWorkflowSettings: WorkflowSettingsData = {
  workflowTypes: [
    { 
      id: 1, 
      name: 'Educational Nurture', 
      active: true, 
      duration: 90, 
      stages: 4,
      stageDetails: [
        { id: 1, name: 'Initial Contact', description: 'Introduction and problem identification', durationDays: 7, startDay: 1, endDay: 7 },
        { id: 2, name: 'Education Phase', description: 'Industry insights and best practices', durationDays: 23, startDay: 8, endDay: 30 },
        { id: 3, name: 'Solution Alignment', description: 'Potential solutions and case studies', durationDays: 30, startDay: 31, endDay: 60 },
        { id: 4, name: 'Re-engagement', description: 'Value proposition and direct offers', durationDays: 30, startDay: 61, endDay: 90 }
      ]
    },
    { id: 2, name: 'Industry Focus', active: true, duration: 120, stages: 5 },
    { id: 3, name: 'Case Study Series', active: true, duration: 60, stages: 3 },
    { id: 4, name: 'Product Update', active: false, duration: 45, stages: 2 },
  ],
  entryConditions: [
    { id: 1, name: 'Lead Score Below 20', type: 'score', value: 20, operator: '<' },
    { id: 2, name: 'No Activity in 30 Days', type: 'activity', value: 30, operator: '>' },
    { id: 3, name: 'Visited Pricing Page', type: 'behavior', value: 'pricing_page_visit', operator: '=' },
  ],
  exitConditions: [
    { id: 1, name: 'Lead Score Rises Above 40', type: 'score', value: 40, operator: '>' },
    { id: 2, name: 'Replies to Email', type: 'activity', value: 'email_reply', operator: '=' },
    { id: 3, name: 'Maximum Duration Reached', type: 'time', value: 120, operator: '>' },
    { id: 4, name: 'Requests Demo', type: 'conversion', value: 'demo_request', operator: '=' },
  ],
  emailTemplates: {
    educational: [
      { id: 1, name: 'Industry Trends Report', description: 'Initial educational content with industry insights', type: 'educational' },
      { id: 2, name: 'Best Practices Guide', description: 'Follow-up with actionable best practices', type: 'educational' },
      { id: 3, name: 'Expert Interview', description: 'Interview content with industry expert', type: 'educational' },
    ],
    industry: [],
    casestudy: [],
    product: []
  },
  deliverySchedules: {
    educational: [
      { id: 1, day: 1, templateId: 1, templateName: 'Industry Trends Report' },
      { id: 2, day: 14, templateId: 2, templateName: 'Best Practices Guide', condition: 'if no engagement' },
      { id: 3, day: 30, templateId: 3, templateName: 'Expert Interview' },
    ],
    industry: [],
    casestudy: [],
    product: []
  },
  advancedSettings: {
    automaticLeadTransitions: true,
    dynamicScoreUpdates: true,
    salesTeamAlerts: true,
    primarySuccessMetric: 'reengagement',
    targetValue: 15,
    abTesting: 'disabled',
    retentionPeriod: '365',
    detailedLogging: true
  }
};

export function useWorkflowSettings() {
  const [data, setData] = useState<WorkflowSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchWorkflowSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace this with actual API call when endpoint is available
        // const response = await fetch('/api/workflows/settings/low-conversion', {
        //   headers: {
        //     Authorization: `Bearer ${session?.user?.token}`,
        //   },
        // });
        
        // if (!response.ok) {
        //   throw new Error(`Error fetching workflow settings: ${response.statusText}`);
        // }
        
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Using mock data for now
        setData(mockWorkflowSettings);
      } catch (err: any) {
        console.error('Failed to fetch workflow settings:', err);
        setError(err.message || 'Failed to fetch workflow settings');
        toast({
          title: 'Error',
          description: 'Failed to load workflow settings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflowSettings();
  }, [session]);

  return { data, isLoading, error };
}

// Hook for saving workflow settings
export function useSaveWorkflowSettings() {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const saveSettings = async (settings: Partial<WorkflowSettingsData>) => {
    setIsSaving(true);

    try {
      // TODO: Replace with actual API call when endpoint is available
      // const response = await fetch('/api/workflows/settings/low-conversion', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${session?.user?.token}`,
      //   },
      //   body: JSON.stringify(settings),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Error saving workflow settings: ${response.statusText}`);
      // }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings Saved',
        description: 'Workflow settings have been saved successfully',
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to save workflow settings:', err);
      toast({
        title: 'Save Failed',
        description: err.message || 'Failed to save workflow settings',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSettings, isSaving };
}

// Hook for managing workflow types
export function useManageWorkflows() {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const createWorkflow = async (workflow: Omit<WorkflowType, 'id'>) => {
    setIsProcessing(true);

    try {
      // TODO: Replace with actual API call when endpoint is available
      // const response = await fetch('/api/workflows/types/low-conversion', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${session?.user?.token}`,
      //   },
      //   body: JSON.stringify(workflow),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Error creating workflow: ${response.statusText}`);
      // }
      
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Workflow Created',
        description: 'New workflow has been created successfully',
      });
      
      // Return a fake ID for now
      return { ...workflow, id: Math.floor(Math.random() * 1000) };
    } catch (err: any) {
      console.error('Failed to create workflow:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create workflow',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateWorkflow = async (id: number, changes: Partial<WorkflowType>) => {
    setIsProcessing(true);

    try {
      // TODO: Replace with actual API call when endpoint is available
      // const response = await fetch(`/api/workflows/types/low-conversion/${id}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${session?.user?.token}`,
      //   },
      //   body: JSON.stringify(changes),
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Error updating workflow: ${response.statusText}`);
      // }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Workflow Updated',
        description: 'Workflow has been updated successfully',
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to update workflow:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update workflow',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteWorkflow = async (id: number) => {
    setIsProcessing(true);

    try {
      // TODO: Replace with actual API call when endpoint is available
      // const response = await fetch(`/api/workflows/types/low-conversion/${id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     Authorization: `Bearer ${session?.user?.token}`,
      //   },
      // });
      
      // if (!response.ok) {
      //   throw new Error(`Error deleting workflow: ${response.statusText}`);
      // }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Workflow Deleted',
        description: 'Workflow has been deleted successfully',
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to delete workflow:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete workflow',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { createWorkflow, updateWorkflow, deleteWorkflow, isProcessing };
} 