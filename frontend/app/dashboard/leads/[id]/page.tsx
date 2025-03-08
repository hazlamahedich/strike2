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
  Activity
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

// Import API hooks
import { 
  useLead, 
  useUpdateLead, 
  useLeadTimeline, 
  useLeadInsights,
  useAddLeadNote
} from '@/lib/hooks/useLeads';

// Configuration flag to toggle between mock and real data
// Set to true to use mock data, false to use real API data
const USE_MOCK_DATA = true;

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
    conversion_probability: 0.65,
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

// Mock timeline data
const mockTimeline = [
  {
    id: 1,
    type: 'note',
    content: 'Added a note',
    created_at: '2023-05-15T10:35:00Z',
    user: { id: 1, name: 'Jane Doe' }
  },
  {
    id: 2,
    type: 'email',
    content: 'Sent introduction email',
    created_at: '2023-05-15T11:00:00Z',
    user: { id: 1, name: 'Jane Doe' }
  },
  {
    id: 3,
    type: 'call',
    content: 'Made initial contact call (15 min)',
    created_at: '2023-05-16T09:30:00Z',
    user: { id: 1, name: 'Jane Doe' }
  }
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  
  // Set up mock user in localStorage for development
  useEffect(() => {
    if (USE_MOCK_DATA && typeof window !== 'undefined') {
      // Check if we already have a mock user
      if (!localStorage.getItem('strike_app_user')) {
        // Set up a mock user to trigger the mockService
        localStorage.setItem('strike_app_user', JSON.stringify({
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }));
      }
    }
  }, []);
  
  // State for dialogs
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusToChange, setStatusToChange] = useState<LeadStatus | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  
  // API hooks for real data - only run when not using mock data
  const { 
    data: apiLead, 
    isLoading: isLoadingLead, 
    isError: isErrorLead 
  } = useLead(USE_MOCK_DATA ? -1 : parseInt(leadId), true);
  
  const { 
    data: apiTimeline, 
    isLoading: isLoadingTimeline 
  } = useLeadTimeline(USE_MOCK_DATA ? -1 : parseInt(leadId));
  
  const { 
    data: apiInsights, 
    isLoading: isLoadingInsights 
  } = useLeadInsights(USE_MOCK_DATA ? -1 : parseInt(leadId));
  
  const updateLeadMutation = useUpdateLead();
  
  // Get the lead data based on the configuration flag
  const lead = USE_MOCK_DATA ? mockLeadDetails[leadId] : apiLead;
  const timeline = USE_MOCK_DATA ? mockTimeline : apiTimeline;
  const isLoading = !USE_MOCK_DATA && (isLoadingLead || isLoadingTimeline || isLoadingInsights);
  const isError = !USE_MOCK_DATA && isErrorLead;
  
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
          id: mockTimeline.length + 1,
          type: 'status_change',
          content: `Changed status from ${previousStatusLabel} to ${statusLabel}${reason ? `: "${reason}"` : ''}`,
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'Jane Doe' }
        };
        
        // Add to the beginning of the timeline
        mockTimeline.unshift(timelineEntry);
        
        // Force re-render
        router.refresh();
      }
    } else {
      // Real API implementation
      updateLeadMutation.mutate(
        { 
          leadId: parseInt(leadId), 
          leadData: { 
            status, 
            status_change_notes: reason 
          } 
        },
        {
          onSuccess: () => {
            toast.success(`Lead status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}`);
          },
          onError: (error) => {
            console.error('Failed to update lead status:', error);
            toast.error('Failed to update lead status');
          }
        }
      );
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
            id: mockTimeline.length + 1,
            type: 'task_update',
            content: `${completed ? 'Completed' : 'Reopened'} task: "${lead.tasks[taskIndex].title}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success(`Task ${completed ? 'completed' : 'reopened'}`);
        }
      }
    } else {
      // Real API implementation would go here
      toast.success(`Task ${completed ? 'completed' : 'reopened'}`);
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
            id: mockTimeline.length + 1,
            type: 'task_delete',
            content: `Deleted task: "${taskTitle}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success('Task deleted');
        }
      }
    } else {
      // Real API implementation would go here
      toast.success('Task deleted');
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
            id: mockTimeline.length + 1,
            type: 'task_update',
            content: `Updated task: "${updatedTask.title}"`,
            created_at: new Date().toISOString(),
            user: { id: 1, name: 'Jane Doe' }
          };
          
          // Add to the beginning of the timeline
          mockTimeline.unshift(timelineEntry);
          
          // Force re-render
          router.refresh();
          
          // Show toast
          toast.success('Task updated');
        }
      }
    } else {
      // Real API implementation would go here
      toast.success('Task updated');
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
          id: mockTimeline.length + 1,
          type: 'task_create',
          content: `Created task: "${task.title}"`,
          created_at: new Date().toISOString(),
          user: { id: 1, name: 'Jane Doe' }
        };
        
        // Add to the beginning of the timeline
        mockTimeline.unshift(timelineEntry);
        
        // Force re-render
        router.refresh();
        
        // Show toast
        toast.success('Task created');
      }
    } else {
      // Real API implementation would go here
      toast.success('Task created');
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
  
  // If loading or error, show appropriate UI
  if (!USE_MOCK_DATA && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading lead data...</p>
        </div>
      </div>
    );
  }
  
  if (!USE_MOCK_DATA && isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Lead</h2>
          <p className="text-muted-foreground mb-4">There was a problem loading the lead data.</p>
          <Button onClick={() => router.push('/dashboard/leads')}>
            Return to Leads
          </Button>
        </div>
      </div>
    );
  }
  
  // If lead not found, show appropriate UI
  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-amber-500 text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Lead Not Found</h2>
          <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard/leads')}>
            Return to Leads
          </Button>
        </div>
      </div>
    );
  }
  
  // Render the lead detail page with modern layout
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Status Change Dialog */}
      {statusToChange && (
        <StatusChangeDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          leadId={parseInt(leadId)}
          leadName={lead.full_name}
          currentStatus={lead.status}
          newStatus={statusToChange}
          onConfirm={(status, reason) => handleStatusChange(status, reason)}
          isMock={USE_MOCK_DATA}
        />
      )}
      
      {/* Header with back button and lead name */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => router.push('/dashboard/leads')}
          >
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
            onClick={() => {
              if (confirm('Are you sure you want to delete this lead?')) {
                toast.success('Lead deleted');
                router.push('/dashboard/leads');
              }
            }}
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
                    {lead.conversion_probability !== undefined ? (
                      <>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              lead.conversion_probability >= 0.7 ? 'bg-green-500' : 
                              lead.conversion_probability >= 0.4 ? 'bg-amber-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, lead.conversion_probability * 100))}%` }}
                          ></div>
                        </div>
                        <p className="font-medium">
                          <span className="mr-1">{Math.round(lead.conversion_probability * 100)}%</span>
                          <span className={getConversionProbabilityLabel(lead.conversion_probability).color}>
                            ({getConversionProbabilityLabel(lead.conversion_probability).label})
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
        <Button onClick={() => setShowEmailDialog(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </Button>
        <Button onClick={() => setShowCallDialog(true)}>
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
      
      {/* Dialog Components */}
      {showEmailDialog && (
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={lead.email || ''}
          leadName={lead.full_name || ''}
        />
      )}
      
      {showCallDialog && (
        <PhoneDialog
          open={showCallDialog}
          onOpenChange={setShowCallDialog}
          leadPhone={lead.phone || ''}
          leadName={lead.full_name || ''}
        />
      )}
      
      {showNoteDialog && (
        <NoteDialog
          open={showNoteDialog}
          onOpenChange={setShowNoteDialog}
          leadId={parseInt(leadId)}
          leadName={lead.full_name || ''}
          isMock={USE_MOCK_DATA}
          onSuccess={() => router.refresh()}
        />
      )}
      
      {/* Task Dialog */}
      {showTaskDialog && (
        <TaskDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          leadId={parseInt(leadId)}
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
            router.refresh();
          }}
          task={isEditingTask ? currentTask : undefined}
          isEditing={isEditingTask}
        />
      )}
      
      {/* Meeting Dialog */}
      {showMeetingDialog && (
        <MeetingDialogNew
          open={showMeetingDialog}
          onOpenChange={setShowMeetingDialog}
          lead={lead}
          onSuccess={() => router.refresh()}
        />
      )}
      
      {/* Edit Dialog */}
      {showEditDialog && (
        <LeadEditDialog
          leadId={leadId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => router.refresh()}
        />
      )}
      
      {/* Status change section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lead Status</CardTitle>
          <CardDescription>Update the lead's position in your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {Object.values(LeadStatus).map((status) => (
                <div key={status} className="w-40">
                  <div className={`p-3 rounded-md ${lead.status === status ? getStatusColor(status) : 'bg-gray-100 dark:bg-gray-800 bg-opacity-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm">{formatStatus(status)}</h3>
                    </div>
                    {lead.status === status ? (
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
                          if (lead.status !== status) {
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
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
                  {timeline.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border-b last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        {item.type === 'note' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                        {item.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                        {item.type === 'call' && <Phone className="h-5 w-5 text-purple-500" />}
                        {item.type === 'status_change' && <Tag className="h-5 w-5 text-amber-500" />}
                      </div>
                      <div className="flex-1">
                        <p>{item.content}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()} by {item.user.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No activity yet.</p>
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
                      <p>{note.content}</p>
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
              <Button size="sm" onClick={() => toast.info('Add to campaign functionality will be implemented')}>
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
                      <Button variant="ghost" size="sm" onClick={() => toast.info('Campaign actions will be implemented')}>
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
                  {apiInsights ? (
                    <div className="space-y-6">
                      {/* Score Factors */}
                      {apiInsights.score_factors && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Score Factors</h3>
                          <ul className="space-y-2">
                            {apiInsights.score_factors.map((factor: any, index: number) => (
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
                      {apiInsights.recommendations && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                          <ul className="space-y-2">
                            {apiInsights.recommendations.map((recommendation: any, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Conversion Probability */}
                      {apiInsights.conversion_probability !== undefined && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Conversion Probability</h3>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-primary h-4 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, apiInsights.conversion_probability * 100))}%` }}
                            ></div>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            This lead has a <span className="font-bold">{(apiInsights.conversion_probability * 100).toFixed(1)}%</span> probability of converting
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
      </Tabs>
    </div>
  );
} 