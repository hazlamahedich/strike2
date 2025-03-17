'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Trash, 
  User, 
  Building, 
  Tag, 
  Clock, 
  BarChart, 
  Plus,
  FileText,
  Flag,
  UserIcon,
  Activity,
  AlertCircle,
  FileQuestion,
  Loader2,
  RefreshCw,
  PlusCircle,
  Trash2,
  Users,
  PencilIcon,
  XCircle,
  Mic,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LeadStatus, LeadSource } from '@/lib/types/lead';
import { StatusChangeDialog } from '@/components/leads/StatusChangeDialog';
import { NoteDialog } from '@/components/leads/NoteDialog';
import { TaskDialog } from '@/components/leads/TaskDialog';
import { EmailDialog } from '@/components/communications/EmailDialog';
import { PhoneDialog } from '@/components/communications/PhoneDialog';
import { MeetingDialog } from '@/components/meetings/MeetingDialog';
import { MeetingDialogNew } from '@/components/meetings/MeetingDialogNew';
import { LeadEditDialog } from '@/components/leads/LeadEditDialog';
import { TaskActionsMenu } from '@/components/leads/TaskActionsMenu';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { createMeeting } from '@/lib/api/meetings';
import { MeetingStatus, MeetingType } from '@/lib/types/meeting';

// Import API hooks
import { 
  useLead, 
  useUpdateLead, 
  useLeadTimeline, 
  useLeadInsights,
  useAddLeadNote,
  leadKeys,
  useDeleteLead
} from '@/lib/hooks/useLeads';

// Import Supabase client
import supabase from '@/lib/supabase/client';

// Import React Query
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Import getLeadInsights and addLeadNote functions
import { 
  getLeadTimeline, 
  getLeadInsights, 
  addLeadNote, 
  deleteLead 
} from '@/lib/api/leads';

// Dynamically import the InsightsEditor component
const InsightsEditor = dynamic(() => import('./InsightsEditor'), { ssr: false });

// Configuration flag to toggle between mock and real data
// Set this to false to use the API's decision on whether to use mock data
const USE_MOCK_DATA = false;

// Mock lead details data
// This is now just a fallback in case the mockService fails
const mockLeadDetails: Record<string, any> = {
  '1': {
    id: 1,
    first_name: 'John',
    last_name: 'Smith',
    full_name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    company: 'Smith Enterprises',
    title: 'CEO',
    source: LeadSource.WEBSITE,
    status: LeadStatus.NEW,
    owner_id: 1,
    team_id: 1,
    custom_fields: {
      address: '123 Main St, San Francisco, CA 94105'
    },
    lead_score: 8.5,
    conversion_probability: 0.75,
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    tasks: [
      { 
        id: 1, 
        title: 'Follow up call', 
        description: 'Call to discuss the proposal',
        due_date: '2023-05-20T14:00:00Z', 
        completed: false,
        priority: 'high',
        assignee: 'Jane Doe'
      },
      { 
        id: 2, 
        title: 'Send proposal', 
        description: 'Prepare and send the detailed proposal',
        due_date: '2023-05-25T10:00:00Z', 
        completed: false,
        priority: 'medium',
        assignee: 'John Smith'
      }
    ],
    emails: [
      { id: 1, subject: 'Introduction', sent_at: '2023-05-15T11:00:00Z' }
    ],
    calls: [
      { id: 1, duration: 15, notes: 'Initial contact', called_at: '2023-05-16T09:30:00Z' }
    ],
    meetings: [],
    notes: [{ id: 1, content: 'Interested in premium plan', created_at: '2023-05-15T10:35:00Z' }],
    activities: [],
    owner: { id: 1, name: 'Jane Doe' },
    timeline: [],
    campaigns: [{ id: 1, name: 'Summer Promotion' }]
  }
};

// Mock data for development
const mockLeadTimeline = [
  {
    id: 1,
    type: 'note',
    content: 'Added a note about the lead',
    created_at: '2023-06-01T10:00:00Z',
    user: { name: 'John Doe' }
  },
  {
    id: 2,
    type: 'email',
    content: 'Sent an email about the product demo',
    created_at: '2023-06-02T14:30:00Z',
    user: { name: 'Jane Smith' }
  },
  {
    id: 3,
    type: 'call',
    content: 'Had a call to discuss requirements',
    created_at: '2023-06-03T11:15:00Z',
    user: { name: 'John Doe' }
  }
];

const mockInsightsData = {
  score_factors: [
    { factor: "Recent engagement", impact: 1, description: "Opened emails in the last 7 days" },
    { factor: "Website visits", impact: 1, description: "Visited pricing page 3 times" },
    { factor: "Response time", impact: -0.5, description: "Slow response to last outreach" }
  ],
  recommendations: [
    { text: "Schedule a product demo", priority: "high" },
    { text: "Share case study on similar company", priority: "medium" },
    { text: "Follow up on pricing discussion", priority: "medium" }
  ],
  conversion_probability: 0.75
};

// Add import for CompanyAnalysis
import CompanyAnalysis from '@/components/leads/CompanyAnalysis';

// Add import for EmailDialogProvider and useEmailDialog
import { EmailDialogProvider, useEmailDialog } from '@/contexts/EmailDialogContext';
import { LeadPhoneDialogProvider, useLeadPhoneDialog } from '@/contexts/LeadPhoneDialogContext';

export default function LeadDetailPage() {
  // Wrap the entire component with our providers
  return (
    <EmailDialogProvider>
      <LeadPhoneDialogProvider>
        <LeadDetailContent />
      </LeadPhoneDialogProvider>
    </EmailDialogProvider>
  );
}

// Create a new component for the actual lead detail content
function LeadDetailContent() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id ? safeParseInt(params.id as string) : 0;
  const queryClient = useQueryClient();
  
  // Get the context hooks
  const { openEmailDialog } = useEmailDialog();
  const { openPhoneDialog } = useLeadPhoneDialog();
  
  // State for lead data
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineFilters, setTimelineFilters] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddToCampaign, setShowAddToCampaign] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [showInsightsEditor, setShowInsightsEditor] = useState(false);
  
  // State for dialogs - remove email and call dialogs as they'll be handled by contexts
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToChange, setStatusToChange] = useState<LeadStatus | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Initialize mock service if using mock data
  useEffect(() => {
    if (USE_MOCK_DATA && typeof window !== 'undefined') {
      // Set up a mock user to trigger the mockService
      localStorage.setItem('strike_app_user', JSON.stringify({
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'admin'
      }));
    }
    
    // Redirect if leadId is invalid
    if (!USE_MOCK_DATA && (leadId === -1 || isNaN(leadId))) {
      toast.error('Invalid lead ID');
      router.push('/dashboard/leads');
    }
  }, [leadId, router]);
  
  // API hooks for real data - only run when not using mock data
  const { 
    data: apiLead, 
    isLoading: isLoadingLead, 
    isError: isErrorLead,
    error: leadError
  } = useLead(USE_MOCK_DATA ? -1 : leadId, true);
  
  const { 
    data: apiTimeline, 
    isLoading: isLoadingTimeline 
  } = useLeadTimeline(USE_MOCK_DATA ? -1 : leadId);
  
  const { 
    data: apiInsights, 
    isLoading: isLoadingInsights 
  } = useLeadInsights(USE_MOCK_DATA ? -1 : leadId);
  
  const updateLeadMutation = useUpdateLead();
  const addLeadNoteMutation = useAddLeadNote();
  
  // Use mock or API data based on configuration
  const leadData = USE_MOCK_DATA ? mockLeadDetails[params.id as string] : apiLead;
  const timeline = USE_MOCK_DATA ? mockLeadTimeline : apiTimeline;
  const insights = USE_MOCK_DATA ? mockInsightsData : apiInsights;
  
  const isLoading = USE_MOCK_DATA ? false : isLoadingLead;
  const isError = USE_MOCK_DATA ? false : isErrorLead;
  
  // Mock data for development
  const mockLead = mockLeadDetails[params.id as string];
  
  // Set lead data
  useEffect(() => {
    if (leadData) {
      console.log("Setting lead data:", leadData);
      console.log("Lead status:", leadData.status);
      
      // Ensure lead status is a valid LeadStatus enum value
      if (leadData.status && !Object.values(LeadStatus).includes(leadData.status)) {
        console.warn("Invalid lead status:", leadData.status);
        // Set a default status if the current one is invalid
        const updatedLeadData = {
          ...leadData,
          status: LeadStatus.NEW
        };
        setLead(updatedLeadData);
      } else {
        setLead(leadData);
      }
      
      setLoading(false);
    }
  }, [leadData]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading lead details...</span>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error Loading Lead</h2>
        <p className="text-center text-muted-foreground">
          {leadError instanceof Error 
            ? leadError.message 
            : "There was a problem loading the lead details. Please try again."}
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Try Again
        </Button>
        <Button 
          onClick={() => window.history.back()}
          variant="ghost"
        >
          Go Back
        </Button>
      </div>
    );
  }
  
  // Show not found state if no lead data
  if (!leadData) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Lead Not Found</h2>
        <p className="text-center text-muted-foreground">
          The lead you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button 
          onClick={() => window.history.back()}
          variant="outline"
        >
          Go Back to Leads
        </Button>
      </div>
    );
  }
  
  // Handle status change
  const handleStatusChange = (status: LeadStatus, reason?: string) => {
    if (USE_MOCK_DATA) {
      // Mock data implementation
      const lead = mockLeadDetails[leadId];
      if (lead) {
        // Update the mock data
        const previousStatus = lead.status;
        lead.status = status;
        lead.updated_at = new Date().toISOString();
        
        // Add a note about the status change
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const previousStatusLabel = previousStatus.charAt(0).toUpperCase() + previousStatus.slice(1);
        let noteContent = `Status changed to ${statusLabel}`;
        
        // Add reason if provided
        if (reason) {
          noteContent += `: "${reason}"`;
        }
        
        if (lead.notes && lead.notes.length > 0) {
          lead.notes.unshift({ 
            id: lead.notes.length + 1, 
            content: noteContent, 
            created_at: new Date().toISOString() 
          });
        } else {
          lead.notes = [{ 
            id: 1, 
            content: noteContent, 
            created_at: new Date().toISOString() 
          }];
        }
        
        // Add to timeline
        const timelineEntry = {
          id: mockLeadTimeline.length + 1,
          type: 'status_change',
          content: `Changed status from ${previousStatusLabel} to ${statusLabel}${reason ? `: "${reason}"` : ''}`,
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'Jane Doe' }
        };
        
        // Add to the beginning of the timeline
        mockLeadTimeline.unshift(timelineEntry);
        
        // Force re-render
        router.refresh();
      }
    } else {
      // Real implementation with Supabase
      const updateStatusMutation = useMutation({
        mutationFn: async () => {
          // Get the current status to record the change
          const { data: currentLead } = await supabase
            .from('leads')
            .select('status')
            .eq('id', leadId)
            .single();
            
          const previousStatus = currentLead?.status || '';
          const previousStatusLabel = previousStatus.charAt(0).toUpperCase() + previousStatus.slice(1);
          const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
          
          // Update the lead status
          const { data, error } = await supabase
            .from('leads')
            .update({ 
              status, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', leadId)
            .select()
            .single();
            
          if (error) throw error;
          
          // Add to timeline
          const timelineContent = `Changed status from ${previousStatusLabel} to ${statusLabel}${reason ? `: "${reason}"` : ''}`;
          
          await supabase.from('lead_timeline').insert({
            lead_id: leadId,
            type: 'status_change',
            content: timelineContent,
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
          
          // Add a note if reason is provided
          if (reason) {
            await supabase.from('lead_notes').insert({
              lead_id: leadId,
              content: `Status changed to ${statusLabel}: "${reason}"`,
              created_at: new Date().toISOString(),
              created_by: (await supabase.auth.getUser()).data.user?.id
            });
          }
          
          return data;
        },
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success(`Lead status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
        },
        onError: (error) => {
          console.error('Failed to update lead status:', error);
          toast.error('Failed to update lead status');
        }
      });
      
      updateStatusMutation.mutate();
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format status for display
  const formatStatus = (status: LeadStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };
  
  // Get status color
  const getStatusColor = (status: LeadStatus): string => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case LeadStatus.PROPOSAL:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case LeadStatus.WON:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  // Handle task completion toggle
  const handleToggleTaskComplete = (taskId: number, completed: boolean) => {
    if (USE_MOCK_DATA) {
      // Mock data implementation
      const lead = mockLeadDetails[leadId];
      if (lead && lead.tasks) {
        // Find the task
        const taskIndex = lead.tasks.findIndex((t: any) => t.id === taskId);
        if (taskIndex !== -1) {
          // Update the task
          lead.tasks[taskIndex].completed = completed;
          lead.updated_at = new Date().toISOString();
          
          // Add to timeline
          const timelineEntry = {
            id: mockLeadTimeline.length + 1,
            type: 'task_update',
            content: `${completed ? 'Completed' : 'Reopened'} task: "${lead.tasks[taskIndex].title}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockLeadTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success(`Task ${completed ? 'completed' : 'reopened'}`);
        }
      }
    } else {
      // Real API implementation
      const updateTaskMutation = useMutation({
        mutationFn: async () => {
          const { data, error } = await supabase
            .from('lead_tasks')
            .update({ completed, updated_at: new Date().toISOString() })
            .eq('id', taskId)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        },
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success(`Task ${completed ? 'completed' : 'reopened'}`);
        },
        onError: (error) => {
          console.error('Failed to update task:', error);
          toast.error('Failed to update task status');
        }
      });
      
      updateTaskMutation.mutate();
    }
  };
  
  // Handle task edit
  const handleEditTask = (task: any) => {
    setCurrentTask(task);
    setIsEditingTask(true);
    setShowTaskDialog(true);
  };
  
  // Handle task delete
  const handleDeleteTask = (taskId: number) => {
    if (USE_MOCK_DATA) {
      // Mock data implementation
      const lead = mockLeadDetails[leadId];
      if (lead && lead.tasks) {
        // Find the task
        const taskIndex = lead.tasks.findIndex((t: any) => t.id === taskId);
        if (taskIndex !== -1) {
          // Get task title for the timeline
          const taskTitle = lead.tasks[taskIndex].title;
          
          // Remove the task
          lead.tasks.splice(taskIndex, 1);
          lead.updated_at = new Date().toISOString();
          
          // Add to timeline
          const timelineEntry = {
            id: mockLeadTimeline.length + 1,
            type: 'task_delete',
            content: `Deleted task: "${taskTitle}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockLeadTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success('Task deleted');
        }
      }
    } else {
      // Real API implementation
      const deleteTaskMutation = useMutation({
        mutationFn: async () => {
          // First get the task to record its title for the timeline
          const { data: task } = await supabase
            .from('lead_tasks')
            .select('title')
            .eq('id', taskId)
            .single();
          
          // Delete the task
          const { error } = await supabase
            .from('lead_tasks')
            .delete()
            .eq('id', taskId);
          
          if (error) throw error;
          
          // Add to timeline
          if (task) {
            await supabase.from('lead_timeline').insert({
              lead_id: leadId,
              type: 'task_delete',
              content: `Deleted task: "${task.title}"`,
              created_at: new Date().toISOString(),
              user_id: (await supabase.auth.getUser()).data.user?.id
            });
          }
          
          return { success: true };
        },
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success('Task deleted');
        },
        onError: (error) => {
          console.error('Failed to delete task:', error);
          toast.error('Failed to delete task');
        }
      });
      
      deleteTaskMutation.mutate();
    }
  };
  
  // Handle task update
  const handleTaskUpdate = (updatedTask: any) => {
    if (USE_MOCK_DATA) {
      // Mock data implementation
      const lead = mockLeadDetails[leadId];
      if (lead && lead.tasks) {
        // Find the task
        const taskIndex = lead.tasks.findIndex((t: any) => t.id === updatedTask.id);
        if (taskIndex !== -1) {
          // Update the task
          lead.tasks[taskIndex] = {
            ...lead.tasks[taskIndex],
            ...updatedTask,
            updated_at: new Date().toISOString()
          };
          
          // Add to timeline
          const timelineEntry = {
            id: mockLeadTimeline.length + 1,
            type: 'task_update',
            content: `Updated task: "${updatedTask.title}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockLeadTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success('Task updated');
        }
      }
    } else {
      // Real API implementation
      const updateTaskMutation = useMutation({
        mutationFn: async () => {
          const taskData = {
            ...updatedTask,
            updated_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('lead_tasks')
            .update(taskData)
            .eq('id', updatedTask.id)
            .select()
            .single();
          
          if (error) throw error;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: leadId,
            type: 'task_update',
            content: `Updated task: "${updatedTask.title}"`,
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
          
          return data;
        },
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success('Task updated');
        },
        onError: (error) => {
          console.error('Failed to update task:', error);
          toast.error('Failed to update task');
        }
      });
      
      updateTaskMutation.mutate();
    }
  };
  
  // Handle task creation
  const handleTaskCreate = (newTask: any) => {
    if (USE_MOCK_DATA) {
      // Mock data implementation
      const lead = mockLeadDetails[leadId];
      if (lead) {
        // Initialize tasks array if it doesn't exist
        if (!lead.tasks) {
          lead.tasks = [];
        }
        
        // Create a new task with a unique ID
        const taskId = lead.tasks.length > 0 
          ? Math.max(...lead.tasks.map((t: any) => t.id)) + 1 
          : 1;
        
        const task = {
          id: taskId,
          ...newTask,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Add the task to the lead
        lead.tasks.push(task);
        lead.updated_at = new Date().toISOString();
        
        // Add to timeline
        const timelineEntry = {
          id: mockLeadTimeline.length + 1,
          type: 'task_create',
          content: `Created task: "${task.title}"`,
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'Jane Doe' }
        };
        
        // Add to the beginning of the timeline
        mockLeadTimeline.unshift(timelineEntry);
        
        // Force re-render
        router.refresh();
        
        // Show toast
        toast.success('Task created');
      }
    } else {
      // Real API implementation
      const createTaskMutation = useMutation({
        mutationFn: async () => {
          const taskData = {
            ...newTask,
            lead_id: leadId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          };
          
          const { data, error } = await supabase
            .from('lead_tasks')
            .insert(taskData)
            .select()
            .single();
          
          if (error) throw error;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: leadId,
            type: 'task_create',
            content: `Created task: "${newTask.title}"`,
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
          
          return data;
        },
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success('Task created');
        },
        onError: (error) => {
          console.error('Failed to create task:', error);
          toast.error('Failed to create task');
        }
      });
      
      createTaskMutation.mutate();
    }
  };
  
  // Get conversion probability label based on threshold
  const getConversionProbabilityLabel = (probability: number): { label: string; color: string } => {
    if (probability >= 0.7) {
      return { label: 'High', color: 'text-green-500 dark:text-green-400' };
    } else if (probability >= 0.4) {
      return { label: 'Medium', color: 'text-amber-500 dark:text-amber-400' };
    } else {
      return { label: 'Low', color: 'text-red-500 dark:text-red-400' };
    }
  };
  
  // Handle lead deletion
  const handleDeleteLead = () => {
    if (USE_MOCK_DATA) {
      // Mock implementation
      if (confirm('Are you sure you want to delete this lead?')) {
        toast.success('Lead deleted');
        router.push('/dashboard/leads');
      }
    } else {
      // Real implementation with Supabase
      const deleteLeadMutation = useMutation({
        mutationFn: async () => {
          // First get the lead to record its name for the toast
          const { data: lead } = await supabase
            .from('leads')
            .select('first_name, last_name')
            .eq('id', leadId)
            .single();
          
          // Delete the lead
          const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);
          
          if (error) throw error;
          
          return { success: true, lead };
        },
        onSuccess: (data) => {
          // Show toast
          const leadName = data.lead ? `${data.lead.first_name} ${data.lead.last_name}` : 'Lead';
          toast.success(`${leadName} deleted successfully`);
          
          // Navigate back to leads list
          router.push('/dashboard/leads');
        },
        onError: (error) => {
          console.error('Failed to delete lead:', error);
          toast.error('Failed to delete lead');
        }
      });
      
      if (confirm('Are you sure you want to delete this lead?')) {
        deleteLeadMutation.mutate();
      }
    }
  };
  
  // Handle adding lead to campaign
  const handleAddToCampaign = (campaignId: number) => {
    if (USE_MOCK_DATA) {
      // Mock implementation
      toast.info('Add to campaign functionality will be implemented');
    } else {
      // Real implementation with Supabase
      const addToCampaignMutation = useMutation({
        mutationFn: async () => {
          // Get campaign details
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('name')
            .eq('id', campaignId)
            .single();
            
          if (!campaign) {
            throw new Error('Campaign not found');
          }
          
          // Add lead to campaign
          const { data, error } = await supabase
            .from('lead_campaigns')
            .insert({
              lead_id: leadId,
              campaign_id: campaignId,
              status: 'added',
              added_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              added_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();
            
          if (error) throw error;
          
          // Add to timeline
          await supabase.from('lead_timeline').insert({
            lead_id: leadId,
            type: 'campaign',
            content: `Added to campaign: "${campaign.name}"`,
            created_at: new Date().toISOString(),
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
          
          return { success: true, campaign };
        },
        onSuccess: (data) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.campaigns(leadId) });
          
          // Show toast
          toast.success(`Lead added to campaign: ${data.campaign?.name || 'Unknown'}`);
        },
        onError: (error) => {
          console.error('Failed to add lead to campaign:', error);
          toast.error('Failed to add lead to campaign');
        }
      });
      
      addToCampaignMutation.mutate();
    }
  };
  
  // Handle adding a note
  const handleAddNote = (content: string, isPrivate: boolean = false) => {
    if (USE_MOCK_DATA) {
      // Mock implementation
      const lead = mockLeadDetails[leadId];
      
      // Create a new note
      const newNote = {
        id: lead.notes.length + 1,
        body: content,
        is_private: isPrivate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 1
      };
      
      // Add to lead's notes
      lead.notes.push(newNote);
      
      // Add to timeline
      const timelineEntry = {
        id: mockLeadTimeline.length + 1,
        type: 'note',
        content: `Added note: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        created_at: new Date().toISOString(),
        user: { name: 'Demo User' }
      };
      
      // Add to the beginning of the timeline
      mockLeadTimeline.unshift(timelineEntry);
      
      // Force re-render
      setShowNoteDialog(false);
      toast.success('Note added successfully');
    } else {
      // Real implementation with Supabase
      addLeadNoteMutation.mutate({
        leadId: leadId,
        content,
        isPrivate
      }, {
        onSuccess: () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
          queryClient.invalidateQueries({ queryKey: leadKeys.timeline(leadId) });
          
          // Show toast
          toast.success('Note added successfully');
          
          // Close dialog
          setShowNoteDialog(false);
        },
        onError: (error: Error) => {
          console.error('Error adding note:', error);
          toast.error('Failed to add note');
        }
      });
    }
  };
  
  // Modified handleSendEmail function to use our context
  const handleSendEmail = () => {
    if (lead) {
      // Create a lead object for the email dialog context
      const emailLead = {
        id: lead.id.toString(),
        name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`,
        email: lead.email || '',
        phone: lead.phone || ''
      };
      
      // Open the email dialog using our context
      openEmailDialog(emailLead);
    }
  };
  
  // Modified handleCall function to use our context
  const handleCall = () => {
    if (lead) {
      // Create a lead object for the phone dialog context
      const phoneLead = {
        id: lead.id.toString(),
        name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`,
        email: lead.email || '',
        phone: lead.phone || ''
      };
      
      // Open the phone dialog using our context
      openPhoneDialog(phoneLead);
    }
  };
  
  // Handle scheduling a meeting
  const handleScheduleMeeting = async (meetingData: any) => {
    try {
      if (USE_MOCK_DATA) {
        // Mock implementation
        toast.success('Meeting scheduled successfully');
        
        // In mock mode, we don't need to update the timeline as it will be refreshed
        // when the page is reloaded
      } else {
        // Real implementation with Supabase
        // Prepare the meeting data
        const meetingCreateData = {
          lead_id: leadId,
          title: meetingData.title,
          description: meetingData.description || '',
          start_time: meetingData.start_time,
          end_time: meetingData.end_time,
          location: meetingData.location || 'Virtual',
          status: MeetingStatus.SCHEDULED,
          meeting_type: meetingData.meeting_type as MeetingType || MeetingType.OTHER,
          lead_email: leadData?.email || '',
          notes: meetingData.notes || `Meeting scheduled from lead details page for lead ${leadId}`
        };
        
        // Call the API to create the meeting
        const response = await createMeeting(meetingCreateData);
        
        if (response.error) {
          throw new Error(response.error.message || 'Failed to schedule meeting');
        }
        
        // Show success toast
        toast.success('Meeting scheduled successfully');
        
        // Refresh the page to show the updated timeline
        router.refresh();
      }
    } catch (error: any) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Helper function to get timeline icon based on type
  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'email':
        return <Mail className="h-5 w-5 text-green-500" />;
      case 'call':
      case 'calls':
        return <Phone className="h-5 w-5 text-purple-500" />;
      case 'call_recording':
        return <Mic className="h-5 w-5 text-red-500" />;
      case 'call_transcription':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'transcript_viewed':
        return <Eye className="h-5 w-5 text-teal-500" />;
      case 'status_change':
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
      case 'task_create':
        return <PlusCircle className="h-5 w-5 text-emerald-500" />;
      case 'task_update':
        return <Edit className="h-5 w-5 text-indigo-500" />;
      case 'task_delete':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-cyan-500" />;
      case 'campaign':
        return <Users className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Function to refresh insights data
  const refreshInsights = async () => {
    if (lead) {
      try {
        const insightsData = await getLeadInsights(lead.id);
        setLead({
          ...lead,
          insights: insightsData
        });
      } catch (error) {
        console.error('Error refreshing insights:', error);
      }
    }
  };
  
  // Render the lead detail page with modern layout
  return (
    <div className="flex h-full flex-col">
      {/* Loading state */}
      {loading && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading lead details...</p>
        </div>
      )}

      {/* Error state */}
      {isError && !loading && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-full bg-red-100 p-3">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-lg font-medium">Error loading lead details</p>
          <p className="text-gray-500">Please try again later or contact support.</p>
          <Button onClick={() => router.push('/dashboard/leads')}>
            Back to Leads
          </Button>
        </div>
      )}

      {/* Main content */}
      {!loading && !isError && lead && (
        <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
          {/* Status change dialog */}
          {showStatusDialog && lead && statusToChange && (
            <StatusChangeDialog
              open={showStatusDialog}
              onOpenChange={setShowStatusDialog}
              leadId={leadId}
              leadName={lead.full_name || ''}
              currentStatus={lead.status || LeadStatus.NEW}
              newStatus={statusToChange}
              onConfirm={(status, reason) => handleStatusChange(status, reason)}
              isMock={USE_MOCK_DATA}
            />
          )}
          
          {/* Rest of the dialogs */}
          {/* ... */}
          
          {/* Lead header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push('/dashboard/leads')} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">{lead.full_name}</h1>
              <Badge className={`ml-3 ${getStatusColor(lead.status)}`}>
                {formatStatus(lead.status)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteLead}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          {/* Lead summary card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lead info */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{lead.full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{lead.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Company info */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{lead.company || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Title</p>
                      <p className="font-medium">{lead.title || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{lead.source}</p>
                    </div>
                  </div>
                </div>
                
                {/* Lead metrics */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <BarChart className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Score</p>
                      <p className="font-medium">{lead.lead_score || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Add Conversion Probability */}
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Probability</p>
                      <div className="flex items-center">
                        {(lead.conversion_probability !== undefined || (insights && insights.conversion_probability !== undefined)) ? (
                          <>
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  (lead.conversion_probability || insights?.conversion_probability || 0) >= 0.7 ? 'bg-green-500' : 
                                  (lead.conversion_probability || insights?.conversion_probability || 0) >= 0.4 ? 'bg-amber-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, (lead.conversion_probability || insights?.conversion_probability || 0) * 100))}%` }}
                              ></div>
                            </div>
                            <p className="font-medium">
                              <span className="mr-1">{Math.round((lead.conversion_probability || insights?.conversion_probability || 0) * 100)}%</span>
                              <span className={getConversionProbabilityLabel(lead.conversion_probability || insights?.conversion_probability || 0).color}>
                                ({getConversionProbabilityLabel(lead.conversion_probability || insights?.conversion_probability || 0).label})
                              </span>
                            </p>
                          </>
                        ) : (
                          <p className="font-medium">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <p className="font-medium">{lead.owner?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
            <Button onClick={handleCall}>
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            <Button onClick={() => setShowMeetingDialog(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button onClick={() => setShowNoteDialog(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Note
            </Button>
            <Button onClick={() => setShowTaskDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          {/* Status change section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Lead Status</CardTitle>
              <CardDescription>Update the lead's position in your sales pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {Object.values(LeadStatus).map((status) => {
                    // More robust comparison that handles case sensitivity and string/enum differences
                    const isCurrentStatus = 
                      lead.status === status || 
                      (typeof lead.status === 'string' && typeof status === 'string' && 
                       lead.status.toLowerCase() === status.toLowerCase());
                    
                    console.log(`Comparing status: ${status} with lead.status: ${lead.status}, equal: ${isCurrentStatus}`);
                    
                    return (
                    <div key={status} className="w-40">
                      <div className={`p-3 rounded-md ${isCurrentStatus ? getStatusColor(status) : 'bg-gray-100 dark:bg-gray-800 bg-opacity-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-sm">{formatStatus(status)}</h3>
                        </div>
                        {isCurrentStatus ? (
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-md border dark:border-gray-600 shadow-sm">
                            <div className="flex items-center gap-2 p-2">
                              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                                {lead.first_name?.[0]}{lead.last_name?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{lead.full_name}</p>
                                {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="p-4 border dark:border-gray-600 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => {
                              if (!isCurrentStatus) {
                                setStatusToChange(status);
                                setShowStatusDialog(true);
                              }
                            }}
                          >
                            <p className="text-xs text-muted-foreground">Move here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid grid-cols-6 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="company-analysis">Company Analysis</TabsTrigger>
            </TabsList>
            
            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline && timeline.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group activities by parent_activity_id or group_id */}
                      {(() => {
                        // Process timeline to group related activities
                        const groupedTimeline: { [key: string]: any[] } = {};
                        
                        // First pass: organize items by their group
                        timeline.forEach((item: any) => {
                          // Create a unique key for grouping
                          const groupKey = item.parent_activity_id 
                            ? `parent_${item.parent_activity_id}` 
                            : (item.group_id ? `group_${item.group_id}` : `item_${item.id}`);
                          
                          if (!groupedTimeline[groupKey]) {
                            groupedTimeline[groupKey] = [];
                          }
                          
                          groupedTimeline[groupKey].push(item);
                        });
                        
                        // Sort groups by the most recent activity in each group
                        const sortedGroups = Object.values(groupedTimeline).sort((a, b) => {
                          const aDate = new Date(a[0].created_at);
                          const bDate = new Date(b[0].created_at);
                          return bDate.getTime() - aDate.getTime();
                        });
                        
                        // Render each group
                        return sortedGroups.map((group, groupIndex) => {
                          // Sort items within the group by created_at
                          const sortedItems = [...group].sort((a, b) => {
                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                          });
                          
                          // The parent activity (or first item if no parent)
                          const mainItem = sortedItems[0];
                          // Child activities (if any)
                          const childItems = sortedItems.slice(1);
                          
                          return (
                            <div key={`group-${groupIndex}`} className="border rounded-lg p-4 bg-card">
                              {/* Main activity */}
                              <div className="flex gap-4 pb-4 border-b border-border">
                                <div className="mt-1">
                                  {getTimelineIcon(mainItem.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        {mainItem.user ? `${mainItem.user.name} ` : ''}
                                        <span className="text-foreground font-medium">
                                          {getTimelineAction(mainItem.type)}
                                        </span>
                                      </p>
                                      <p className="mt-1">{mainItem.content}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(mainItem.created_at), { addSuffix: true })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Child activities */}
                              {childItems.length > 0 && (
                                <div className="mt-2 pl-8 space-y-3">
                                  {childItems.map((item, index) => (
                                    <div key={`child-${index}`} className="flex gap-3 pt-2">
                                      <div className="mt-1">
                                        {getTimelineIcon(item.type)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              <span className="text-foreground font-medium">
                                                {getTimelineAction(item.type)}
                                              </span>
                                            </p>
                                            <p className="mt-1 text-sm">{item.content}</p>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No activity recorded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tasks</CardTitle>
                  <Button size="sm" onClick={() => {
                    setCurrentTask(null);
                    setIsEditingTask(false);
                    setShowTaskDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent>
                  {lead.tasks && lead.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {lead.tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-auto"
                              onClick={() => handleToggleTaskComplete(task.id, !task.completed)}
                            >
                              <CheckCircle 
                                className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} 
                              />
                            </Button>
                            <div>
                              <p className={task.completed ? 'line-through text-muted-foreground' : ''}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: {formatDate(task.due_date)}
                                </span>
                                {task.priority && (
                                  <span className={`flex items-center ${
                                    task.priority === 'high' ? 'text-red-500' : 
                                    task.priority === 'medium' ? 'text-amber-500' : 
                                    'text-green-500'
                                  }`}>
                                    <Flag className="h-3 w-3 mr-1" />
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                )}
                                {task.assignee && (
                                  <span className="flex items-center">
                                    <UserIcon className="h-3 w-3 mr-1" />
                                    {typeof task.assignee === 'string' ? task.assignee : task.assignee.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <TaskActionsMenu 
                            task={task}
                            onMarkComplete={handleToggleTaskComplete}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tasks yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Notes</CardTitle>
                  <Button size="sm" onClick={() => setShowNoteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </CardHeader>
                <CardContent>
                  {lead.notes && lead.notes.length > 0 ? (
                    <div className="space-y-4">
                      {lead.notes.map((note: any) => (
                        <div key={note.id} className="p-4 border rounded-md">
                          <p>{note.body || note.content}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notes yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Campaigns</CardTitle>
                  <Button size="sm" onClick={() => setShowAddToCampaign(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Campaign
                  </Button>
                </CardHeader>
                <CardContent>
                  {lead.campaigns && lead.campaigns.length > 0 ? (
                    <div className="space-y-4">
                      {lead.campaigns.map((campaign: any) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p>{campaign.name}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleAddToCampaign(campaign.id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not part of any campaigns yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Insights</CardTitle>
                  <CardDescription>AI-powered insights about this lead</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Lead Insights</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowInsightsEditor(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Insights
                    </Button>
                  </div>
                  
                  {/* Modal for insights editor */}
                  {showInsightsEditor && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
                        <InsightsEditor 
                          leadId={lead.id} 
                          onClose={() => setShowInsightsEditor(false)}
                          onUpdate={() => {
                            refreshInsights();
                            setShowInsightsEditor(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Rest of the insights tab content */}
                  {USE_MOCK_DATA ? (
                    <div className="space-y-6">
                      {/* Score Factors */}
                      <div>
                        <h3 className="text-lg font-medium mb-2">Score Factors</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">+</span>
                            <span>Engaged with 3 emails in the past week</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">+</span>
                            <span>Visited pricing page multiple times</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-red-500 mr-2">-</span>
                            <span>No scheduled meetings yet</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Recommendations */}
                      <div>
                        <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>Schedule a product demo call</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>Send case study for their industry</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>Follow up within 3 days</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Conversion Probability */}
                      <div>
                        <h3 className="text-lg font-medium mb-2">Conversion Probability</h3>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-primary h-4 rounded-full" 
                            style={{ width: '65%' }}
                          ></div>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This lead has a <span className="font-bold">65%</span> probability of converting
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {insights ? (
                        <div className="space-y-6">
                          {/* Score Factors */}
                          {insights.score_factors && (
                            <div>
                              <h3 className="text-lg font-medium mb-2">Score Factors</h3>
                              <ul className="space-y-2">
                                {insights.score_factors.map((factor: any, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className={factor.impact > 0 ? "text-green-500 mr-2" : "text-red-500 mr-2"}>
                                      {factor.impact > 0 ? '+' : '-'}
                                    </span>
                                    <span>{factor.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Recommendations */}
                          {insights.recommendations && (
                            <div>
                              <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                              <ul className="space-y-2">
                                {insights.recommendations.map((recommendation: any, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    <span>{recommendation.text || recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Conversion Probability */}
                          {insights.conversion_probability !== undefined && (
                            <div>
                              <h3 className="text-lg font-medium mb-2">Conversion Probability</h3>
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                  className="bg-primary h-4 rounded-full" 
                                  style={{ width: `${Math.min(100, Math.max(0, insights.conversion_probability * 100))}%` }}
                                ></div>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                This lead has a <span className="font-bold">{(insights.conversion_probability * 100).toFixed(1)}%</span> probability of converting
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No insights available</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Company Analysis Tab */}
            <TabsContent value="company-analysis" className="space-y-4">
              <CompanyAnalysis leadId={parseInt(params.id as string)} />
            </TabsContent>
          </Tabs>
          
          {/* Dialog Components */}
          {showNoteDialog && lead && (
            <NoteDialog
              open={showNoteDialog}
              onOpenChange={setShowNoteDialog}
              leadId={leadId}
              leadName={lead.full_name || ''}
              isMock={USE_MOCK_DATA}
              onSuccess={(noteData) => {
                if (noteData && noteData.content) {
                  handleAddNote(noteData.content, noteData.is_private);
                }
              }}
            />
          )}
          
          {showTaskDialog && lead && (
            <TaskDialog
              open={showTaskDialog}
              onOpenChange={setShowTaskDialog}
              leadId={leadId}
              leadName={lead.full_name || ''}
              isMock={USE_MOCK_DATA}
              onSuccess={(taskData) => {
                if (isEditingTask && currentTask && taskData) {
                  // Handle task update
                  handleTaskUpdate({
                    ...currentTask,
                    ...taskData
                  });
                } else if (taskData) {
                  // Handle task creation
                  handleTaskCreate(taskData);
                }
              }}
              task={isEditingTask ? currentTask : undefined}
              isEditing={isEditingTask}
            />
          )}
          
          {showMeetingDialog && lead && (
            <MeetingDialogNew
              open={showMeetingDialog}
              onOpenChange={setShowMeetingDialog}
              lead={lead}
              onSuccess={(meetingData) => {
                if (meetingData) {
                  handleScheduleMeeting(meetingData);
                }
              }}
            />
          )}
          
          {showEditDialog && lead && (
            <LeadEditDialog
              leadId={leadId.toString()}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              onSuccess={() => router.refresh()}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to safely parse integers
const safeParseInt = (value: string): number => {
  try {
    const parsed = parseInt(value);
    return isNaN(parsed) ? -1 : parsed;
  } catch (error) {
    console.error(`Error parsing lead ID: ${value}`, error);
    return -1;
  }
};

// Helper function to get timeline action based on type
const getTimelineAction = (type: string): string => {
  switch (type) {
    case 'note':
      return 'Added note';
    case 'email':
      return 'Sent email';
    case 'call':
    case 'calls':
      return 'Made a call';
    case 'call_recording':
      return 'Recording available';
    case 'call_transcription':
      return 'Transcription completed';
    case 'transcript_viewed':
      return 'Viewed transcript';
    case 'status_change':
      return 'Changed status';
    case 'task_create':
      return 'Created task';
    case 'task_update':
      return 'Updated task';
    case 'task_delete':
      return 'Deleted task';
    case 'campaign':
      return 'Added to campaign';
    default:
      return 'Unknown activity';
  }
}; 