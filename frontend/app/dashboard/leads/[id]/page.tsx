'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  Tag, 
  Clock, 
  FileText, 
  MessageSquare, 
  Activity, 
  BarChart, 
  Trash,
  CheckCircle2,
  XCircle,
  CheckCircle,
  Circle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LeadStatus, LeadSource } from '@/lib/types/lead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MeetingDialog } from '@/components/meetings/MeetingDialog';
import { openMeetingDialog } from '@/lib/utils/dialogUtils';
import { toast } from '@/components/ui/use-toast';
import { EmailDialog } from '@/components/communications/EmailDialog';
import { PhoneDialog } from '@/components/communications/PhoneDialog';

// Task type definition
type Task = {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  assigned_to?: {
    id: string;
    name: string;
  };
};

// Mock lead details data
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
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    tasks: [],
    emails: [],
    calls: [],
    meetings: [],
    notes: [{ id: 1, content: 'Interested in premium plan', created_at: '2023-05-15T10:35:00Z' }],
    activities: [],
    owner: { id: 1, name: 'Jane Doe' },
    timeline: [],
    campaigns: [{ id: 1, name: 'Summer Promotion' }]
  },
  '2': {
    id: 2,
    first_name: 'Sarah',
    last_name: 'Johnson',
    full_name: 'Sarah Johnson',
    email: 'sarah.j@company.co',
    phone: '(555) 987-6543',
    company: 'Johnson Media',
    title: 'Marketing Director',
    source: LeadSource.REFERRAL,
    status: LeadStatus.CONTACTED,
    owner_id: 2,
    team_id: 1,
    custom_fields: {
      address: '456 Market St, San Francisco, CA 94103'
    },
    lead_score: 7.2,
    created_at: '2023-05-10T14:20:00Z',
    updated_at: '2023-05-12T09:15:00Z',
    tasks: [],
    emails: [],
    calls: [],
    meetings: [],
    notes: [{ id: 2, content: 'Follow up next week', created_at: '2023-05-12T09:15:00Z' }],
    activities: [],
    owner: { id: 2, name: 'Mike Wilson' },
    timeline: [],
    campaigns: [{ id: 2, name: 'New Product Launch' }]
  },
  '3': {
    id: 3,
    first_name: 'Michael',
    last_name: 'Brown',
    full_name: 'Michael Brown',
    email: 'mbrown@business.org',
    phone: '(555) 456-7890',
    company: 'Tech Innovations',
    title: 'CTO',
    source: LeadSource.LINKEDIN,
    status: LeadStatus.QUALIFIED,
    owner_id: 1,
    team_id: 2,
    custom_fields: {
      address: '789 Howard St, San Francisco, CA 94103'
    },
    lead_score: 9.1,
    created_at: '2023-05-05T11:45:00Z',
    updated_at: '2023-05-11T16:30:00Z',
    tasks: [],
    emails: [],
    calls: [],
    meetings: [],
    notes: [{ id: 3, content: 'Needs custom solution', created_at: '2023-05-11T16:30:00Z' }],
    activities: [],
    owner: { id: 1, name: 'Jane Doe' },
    timeline: [],
    campaigns: [{ id: 1, name: 'Summer Promotion' }]
  },
  '4': {
    id: 4,
    first_name: 'Emily',
    last_name: 'Davis',
    full_name: 'Emily Davis',
    email: 'emily.davis@tech.io',
    phone: '(555) 234-5678',
    company: 'Davis Tech',
    title: 'Product Manager',
    source: LeadSource.EVENT,
    status: LeadStatus.PROPOSAL,
    owner_id: 3,
    team_id: 2,
    custom_fields: {
      address: '101 California St, San Francisco, CA 94111'
    },
    lead_score: 6.5,
    created_at: '2023-04-28T09:00:00Z',
    updated_at: '2023-05-09T13:45:00Z',
    tasks: [],
    emails: [],
    calls: [],
    meetings: [],
    notes: [{ id: 4, content: 'Sent proposal on 5/9', created_at: '2023-05-09T13:45:00Z' }],
    activities: [],
    owner: { id: 3, name: 'Alex Chen' },
    timeline: [],
    campaigns: [{ id: 3, name: 'Enterprise Outreach' }]
  },
  '5': {
    id: 5,
    first_name: 'David',
    last_name: 'Wilson',
    full_name: 'David Wilson',
    email: 'dwilson@enterprise.net',
    phone: '(555) 876-5432',
    company: 'Wilson Enterprises',
    title: 'VP of Sales',
    source: LeadSource.COLD_CALL,
    status: LeadStatus.NEGOTIATION,
    owner_id: 2,
    team_id: 1,
    custom_fields: {
      address: '555 Mission St, San Francisco, CA 94105'
    },
    lead_score: 8.8,
    created_at: '2023-04-20T15:10:00Z',
    updated_at: '2023-05-08T10:20:00Z',
    tasks: [],
    emails: [],
    calls: [],
    meetings: [],
    notes: [{ id: 5, content: 'Negotiating contract terms', created_at: '2023-05-08T10:20:00Z' }],
    activities: [],
    owner: { id: 2, name: 'Mike Wilson' },
    timeline: [],
    campaigns: [{ id: 2, name: 'New Product Launch' }]
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
    type: 'status_change',
    content: 'Changed status from New to Contacted',
    created_at: '2023-05-14T14:20:00Z',
    user: { id: 1, name: 'Jane Doe' }
  },
  {
    id: 3,
    type: 'email',
    content: 'Sent introduction email',
    created_at: '2023-05-13T09:15:00Z',
    user: { id: 1, name: 'Jane Doe' }
  }
];

// Mock insights data
const mockInsights = {
  engagement_score: 75,
  response_time_avg: '2 hours',
  last_contact: '2023-05-15T10:35:00Z',
  total_interactions: 12,
  conversion_probability: 65,
  recommended_actions: [
    'Schedule a follow-up call',
    'Send product demo',
    'Discuss pricing options'
  ]
};

// Add tasks to mock lead details
mockLeadDetails['1'].tasks = [
  {
    id: '1',
    title: 'Follow up on proposal',
    description: 'Send an email to check if they reviewed the proposal',
    due_date: '2023-06-15T10:00:00Z',
    priority: 'high',
    status: 'pending',
    created_at: '2023-05-20T14:30:00Z',
    assigned_to: { id: '1', name: 'Jane Doe' }
  }
];

mockLeadDetails['2'].tasks = [
  {
    id: '1',
    title: 'Schedule demo',
    description: 'Arrange a product demonstration',
    due_date: '2023-06-10T15:00:00Z',
    priority: 'medium',
    status: 'in_progress',
    created_at: '2023-05-18T09:15:00Z',
    assigned_to: { id: '2', name: 'Mike Wilson' }
  }
];

// Ensure other leads have an empty tasks array
Object.keys(mockLeadDetails).forEach(key => {
  if (!mockLeadDetails[key].tasks) {
    mockLeadDetails[key].tasks = [];
  }
});

// Mock team members for task assignment
const mockTeamMembers = [
  { id: '1', name: 'Jane Doe' },
  { id: '2', name: 'Mike Wilson' },
  { id: '3', name: 'Alex Chen' },
  { id: '4', name: 'Sarah Johnson' }
];

// Simple Tooltip Component
const SimpleTooltip = ({ 
  children, 
  content 
}: { 
  children: React.ReactNode, 
  content: string 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

// Lead Pipeline Component
const LeadPipeline = ({ 
  currentStatus, 
  onStatusChange 
}: { 
  currentStatus: LeadStatus, 
  onStatusChange: (status: LeadStatus) => void 
}) => {
  // Define pipeline stages in order
  const pipelineStages = [
    { status: LeadStatus.NEW, label: 'New' },
    { status: LeadStatus.CONTACTED, label: 'Contacted' },
    { status: LeadStatus.QUALIFIED, label: 'Qualified' },
    { status: LeadStatus.PROPOSAL, label: 'Proposal' },
    { status: LeadStatus.NEGOTIATION, label: 'Negotiation' },
    { status: LeadStatus.WON, label: 'Won' },
    { status: LeadStatus.LOST, label: 'Lost' }
  ];
  
  // Find current stage index
  const currentStageIndex = pipelineStages.findIndex(stage => stage.status === currentStatus);
  
  // Get status color
  const getStatusColor = (status: LeadStatus, isActive: boolean) => {
    if (!isActive) return 'bg-gray-200 text-gray-500';
    
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-500 text-white';
      case LeadStatus.CONTACTED:
        return 'bg-purple-500 text-white';
      case LeadStatus.QUALIFIED:
        return 'bg-green-500 text-white';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-500 text-white';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-500 text-white';
      case LeadStatus.WON:
        return 'bg-emerald-500 text-white';
      case LeadStatus.LOST:
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Handle moving to next stage
  const handleMoveToNextStage = () => {
    if (currentStageIndex < pipelineStages.length - 2) { // Don't auto-advance to Won/Lost
      onStatusChange(pipelineStages[currentStageIndex + 1].status);
    }
  };
  
  // Handle moving to previous stage
  const handleMoveToPreviousStage = () => {
    if (currentStageIndex > 0) {
      onStatusChange(pipelineStages[currentStageIndex - 1].status);
    }
  };
  
  // Handle marking as won
  const handleMarkAsWon = () => {
    onStatusChange(LeadStatus.WON);
  };
  
  // Handle marking as lost
  const handleMarkAsLost = () => {
    onStatusChange(LeadStatus.LOST);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Lead Pipeline</CardTitle>
        <CardDescription>
          Track and update this lead's progress through your sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline visualization */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {pipelineStages.slice(0, -2).map((stage, index) => (
              <SimpleTooltip key={stage.status} content={stage.label}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                    index <= currentStageIndex ? getStatusColor(stage.status, true) : 'bg-gray-200 text-gray-500'
                  }`}
                  onClick={() => onStatusChange(stage.status)}
                >
                  {index + 1}
                </div>
              </SimpleTooltip>
            ))}
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-gray-200 absolute top-5 left-5 right-5 -z-10 rounded-full">
            <div 
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, Math.max(0, (currentStageIndex / (pipelineStages.length - 3)) * 100))}%` 
              }}
            ></div>
          </div>
          
          {/* Stage labels */}
          <div className="flex justify-between mt-2">
            {pipelineStages.slice(0, -2).map((stage, index) => (
              <div key={stage.status} className="text-xs text-center w-10">
                {stage.label}
              </div>
            ))}
          </div>
        </div>
        
        {/* Current stage info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Current Stage</h3>
              <div className="flex items-center mt-1">
                <Badge className={getStatusColor(currentStatus, true)}>
                  {pipelineStages.find(stage => stage.status === currentStatus)?.label || 'Unknown'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {currentStatus !== LeadStatus.WON && currentStatus !== LeadStatus.LOST && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMoveToPreviousStage}
                    disabled={currentStageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMoveToNextStage}
                    disabled={currentStageIndex >= pipelineStages.length - 3}
                  >
                    Next
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Outcome buttons */}
        {currentStatus !== LeadStatus.WON && currentStatus !== LeadStatus.LOST && (
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={handleMarkAsWon}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Mark as Won
            </Button>
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={handleMarkAsLost}
            >
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Mark as Lost
            </Button>
          </div>
        )}
        
        {/* Reset button if already won/lost */}
        {(currentStatus === LeadStatus.WON || currentStatus === LeadStatus.LOST) && (
          <Button 
            variant="outline" 
            onClick={() => onStatusChange(LeadStatus.NEGOTIATION)}
            className="w-full"
          >
            Reopen Lead
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Task Item Component
const TaskItem = ({ 
  task, 
  onStatusChange, 
  onEdit, 
  onDelete 
}: { 
  task: Task, 
  onStatusChange: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void,
  onEdit: (task: Task) => void,
  onDelete: (taskId: string) => void
}) => {
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => onStatusChange(
              task.id, 
              task.status === 'completed' ? 'pending' : 'completed'
            )}
            className="mt-0.5 flex-shrink-0"
          >
            {task.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300" />
            )}
          </button>
          
          <div>
            <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(task.due_date)}
              </span>
              <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              {task.assigned_to && (
                <span className="text-xs text-gray-600">
                  Assigned to {task.assigned_to.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Custom Lead Detail component that doesn't rely on hooks
const CustomLeadDetail = ({
  leadId,
  onEdit,
  onDelete,
  onSendEmail,
  onCall,
  onScheduleMeeting,
  onAddToCampaign,
  onAddNote,
  onAddTask,
  onStatusChange,
  activeTab,
  setActiveTab,
  setEditingTask
}: {
  leadId: string;
  onEdit: () => void;
  onDelete: () => void;
  onSendEmail: () => void;
  onCall: () => void;
  onScheduleMeeting: () => void;
  onAddToCampaign: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
  onStatusChange: (status: LeadStatus) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setEditingTask: (task: Task | null) => void;
}) => {
  const lead = mockLeadDetails[leadId];
  
  if (!lead) {
    return <div className="flex justify-center p-8 text-red-500">Lead not found</div>;
  }
  
  // Get status badge color
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800';
      case LeadStatus.WON:
        return 'bg-green-100 text-green-800';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get source badge color
  const getSourceColor = (source: LeadSource) => {
    switch (source) {
      case LeadSource.WEBSITE:
        return 'bg-indigo-100 text-indigo-800';
      case LeadSource.REFERRAL:
        return 'bg-green-100 text-green-800';
      case LeadSource.LINKEDIN:
        return 'bg-blue-100 text-blue-800';
      case LeadSource.COLD_CALL:
        return 'bg-gray-100 text-gray-800';
      case LeadSource.EMAIL_CAMPAIGN:
        return 'bg-yellow-100 text-yellow-800';
      case LeadSource.EVENT:
        return 'bg-purple-100 text-purple-800';
      case LeadSource.OTHER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6" id="lead-detail">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{lead.full_name}</h1>
          {lead.title && lead.company && (
            <p className="text-muted-foreground">
              {lead.title} at {lead.company}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge className={getSourceColor(lead.source)}>
              {lead.source.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, lead.lead_score * 10))}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold">{lead.lead_score.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(lead.created_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(lead.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {lead.owner ? (
                <span>{lead.owner.name}</span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lead Pipeline - Now positioned below the cards */}
      <LeadPipeline 
        currentStatus={lead.status} 
        onStatusChange={onStatusChange} 
      />
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSendEmail}>
          <Mail className="mr-2 h-4 w-4" /> Send Email
        </Button>
        <Button onClick={onCall}>
          <Phone className="mr-2 h-4 w-4" /> Call
        </Button>
        <Button onClick={onScheduleMeeting}>
          <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
        <Button onClick={onAddToCampaign}>
          <Tag className="mr-2 h-4 w-4" /> Add to Campaign
        </Button>
        <Button variant="outline" onClick={onAddNote}>
          <MessageSquare className="mr-2 h-4 w-4" /> Add Note
        </Button>
        <Button variant="outline" onClick={onAddTask}>
          <FileText className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{lead.email || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                <p>{lead.phone || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                <p>{lead.company || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Job Title</h3>
                <p>{lead.title || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p>{lead.custom_fields?.address || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.notes && lead.notes.length > 0 ? (
                <div className="space-y-4">
                  {lead.notes.map((note: any) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <p>{note.content}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {formatDate(note.created_at)}
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
        
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {mockTimeline.length > 0 ? (
                <div className="space-y-4">
                  {mockTimeline.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border-b last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {item.type === 'note' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                        {item.type === 'status_change' && <Activity className="h-4 w-4 text-blue-600" />}
                        {item.type === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div>
                        <p>{item.content}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.created_at)} by {item.user.name}
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
        
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <Button onClick={onAddTask}>
              <FileText className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
          
          {lead.tasks && lead.tasks.length > 0 ? (
            <div className="space-y-3">
              {lead.tasks.map((task: Task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onStatusChange={(taskId, status) => {
                    // This will be handled by the parent component
                    // We're just passing the event up
                    const taskIndex = lead.tasks.findIndex((t: Task) => t.id === taskId);
                    if (taskIndex !== -1) {
                      lead.tasks[taskIndex].status = status;
                      // Force re-render
                      setActiveTab('tasks');
                    }
                  }}
                  onEdit={(task) => {
                    // Set the editing task and open the dialog
                    setEditingTask(task);
                    onAddTask();
                  }}
                  onDelete={(taskId) => {
                    // This will be handled by the parent component
                    const taskIndex = lead.tasks.findIndex((t: Task) => t.id === taskId);
                    if (taskIndex !== -1) {
                      lead.tasks.splice(taskIndex, 1);
                      // Force re-render
                      setActiveTab('tasks');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No tasks yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new task for this lead.
                  </p>
                  <div className="mt-6">
                    <Button onClick={onAddTask}>
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.campaigns && lead.campaigns.length > 0 ? (
                <div className="space-y-4">
                  {lead.campaigns.map((campaign: any) => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium">{campaign.name}</h3>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Not assigned to any campaigns.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Engagement Score</h3>
                <p className="text-2xl font-bold">{mockInsights.engagement_score}%</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Avg. Response Time</h3>
                <p className="text-2xl font-bold">{mockInsights.response_time_avg}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Conversion Probability</h3>
                <p className="text-2xl font-bold">{mockInsights.conversion_probability}%</p>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {mockInsights.recommended_actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Meeting dialog */}
      <MeetingDialog 
        id={`lead-meeting-dialog-${leadId}`} 
        lead={lead}
        onSuccess={() => {
          toast({
            title: "Meeting scheduled",
            description: "The meeting has been successfully scheduled.",
          });
        }}
      />
    </div>
  );
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editedLead, setEditedLead] = useState<any>(null);
  
  // State for task dialog
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    assigned_to: undefined
  });
  
  // Mock campaigns for dropdown
  const mockCampaigns = [
    { id: '1', name: 'Summer Promotion' },
    { id: '2', name: 'New Product Launch' },
    { id: '3', name: 'Enterprise Outreach' }
  ];

  // Check for openTask query parameter
  useEffect(() => {
    // Get the current URL
    const url = new URL(window.location.href);
    const openTask = url.searchParams.get('openTask');
    
    // If openTask parameter is present, open the task dialog and set active tab to tasks
    if (openTask === 'true') {
      setShowTaskDialog(true);
      setActiveTab('tasks');
      
      // Remove the query parameter to prevent reopening the dialog on refresh
      router.replace(`/dashboard/leads/${leadId}`, { scroll: false });
    }
  }, [leadId, router]);

  // Initialize edited lead when dialog opens
  useEffect(() => {
    if (showEditDialog) {
      const lead = mockLeadDetails[leadId];
      if (lead) {
        setEditedLead({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          status: lead.status,
          source: lead.source,
          lead_score: lead.lead_score,
          address: lead.custom_fields?.address || '',
          campaign_id: lead.campaigns && lead.campaigns.length > 0 ? lead.campaigns[0].id : '',
          notes: lead.notes && lead.notes.length > 0 ? lead.notes[0].content : ''
        });
      }
    }
  }, [showEditDialog, leadId]);
  
  // Initialize task when editing
  useEffect(() => {
    if (editingTask) {
      setNewTask({
        title: editingTask.title,
        description: editingTask.description || '',
        due_date: editingTask.due_date || '',
        priority: editingTask.priority,
        status: editingTask.status,
        assigned_to: editingTask.assigned_to
      });
      setShowTaskDialog(true);
    }
  }, [editingTask]);
  
  // Reset task form when dialog closes
  useEffect(() => {
    if (!showTaskDialog) {
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'pending',
        assigned_to: undefined
      });
    }
  }, [showTaskDialog]);

  // Handle actions
  const handleEdit = () => {
    setShowEditDialog(true);
  };
  
  const handleSaveEdit = () => {
    // In a real app, call API to update lead
    const lead = mockLeadDetails[leadId];
    if (lead && editedLead) {
      // Update the mock data
      lead.first_name = editedLead.first_name;
      lead.last_name = editedLead.last_name;
      lead.full_name = `${editedLead.first_name} ${editedLead.last_name}`;
      lead.email = editedLead.email;
      lead.phone = editedLead.phone;
      lead.company = editedLead.company;
      lead.title = editedLead.title;
      lead.status = editedLead.status;
      lead.source = editedLead.source;
      lead.lead_score = parseFloat(editedLead.lead_score);
      lead.custom_fields = { ...lead.custom_fields, address: editedLead.address };
      
      // Update campaign
      const selectedCampaign = mockCampaigns.find(c => c.id === editedLead.campaign_id);
      if (selectedCampaign) {
        lead.campaigns = [{ id: selectedCampaign.id, name: selectedCampaign.name }];
      }
      
      // Update notes
      if (lead.notes && lead.notes.length > 0) {
        lead.notes[0].content = editedLead.notes;
      } else {
        lead.notes = [{ 
          id: 1, 
          content: editedLead.notes, 
          created_at: new Date().toISOString() 
        }];
      }
      
      lead.updated_at = new Date().toISOString();
      
      // Close dialog
      setShowEditDialog(false);
      
      // Force re-render
      router.refresh();
    }
  };
  
  // Handle status change
  const handleStatusChange = (status: LeadStatus) => {
    // In a real app, call API to update lead status
    const lead = mockLeadDetails[leadId];
    if (lead) {
      // Update the mock data
      lead.status = status;
      lead.updated_at = new Date().toISOString();
      
      // Add a note about the status change
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      const noteContent = `Status changed to ${statusLabel}`;
      
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
      
      // Force re-render
      router.refresh();
    }
  };
  
  // Handle adding a task
  const handleAddTask = () => {
    // Reset editing task when adding a new task
    setEditingTask(null);
    setShowTaskDialog(true);
  };
  
  // Handle saving a task
  const handleSaveTask = () => {
    const lead = mockLeadDetails[leadId];
    if (lead && newTask.title) {
      if (editingTask) {
        // Update existing task
        const taskIndex = lead.tasks.findIndex((t: Task) => t.id === editingTask.id);
        if (taskIndex !== -1) {
          lead.tasks[taskIndex] = {
            ...lead.tasks[taskIndex],
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.due_date,
            priority: newTask.priority as 'low' | 'medium' | 'high',
            status: newTask.status as 'pending' | 'in_progress' | 'completed',
            assigned_to: newTask.assigned_to
          };
        }
      } else {
        // Add new task
        const newTaskWithId: Task = {
          id: `task-${Date.now()}`,
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date,
          priority: newTask.priority as 'low' | 'medium' | 'high',
          status: newTask.status as 'pending' | 'in_progress' | 'completed',
          created_at: new Date().toISOString(),
          assigned_to: newTask.assigned_to
        };
        
        lead.tasks.push(newTaskWithId);
      }
      
      // Update lead's last updated timestamp
      lead.updated_at = new Date().toISOString();
      
      // Close dialog
      setShowTaskDialog(false);
      
      // Set active tab to tasks
      setActiveTab('tasks');
      
      // Force re-render
      router.refresh();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this lead?')) {
      // In a real app, call API to delete lead
      alert(`Deleted lead ${leadId}`);
      router.push('/dashboard/leads');
    }
  };

  // State for email dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  const handleSendEmail = () => {
    const lead = mockLeadDetails[leadId];
    if (lead?.email) {
      setShowEmailDialog(true);
    }
  };

  // State for phone dialog
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  
  const handleCall = () => {
    const lead = mockLeadDetails[leadId];
    if (lead?.phone) {
      setShowPhoneDialog(true);
    }
  };

  const handleScheduleMeeting = () => {
    // Open the meeting dialog
    console.log('Opening meeting dialog for lead:', leadId);
    openMeetingDialog(`lead-meeting-dialog-${leadId}`);
  };

  const handleAddToCampaign = () => {
    // In a real app, open campaign selection dialog
    alert(`Adding lead ${leadId} to campaign`);
  };

  const handleAddNote = () => {
    // In a real app, open note dialog
    alert(`Adding note for lead ${leadId}`);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => router.push('/dashboard/leads')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
      </div>
      
      <CustomLeadDetail 
        leadId={leadId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSendEmail={handleSendEmail}
        onCall={handleCall}
        onScheduleMeeting={handleScheduleMeeting}
        onAddToCampaign={handleAddToCampaign}
        onAddNote={handleAddNote}
        onAddTask={handleAddTask}
        onStatusChange={handleStatusChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setEditingTask={setEditingTask}
      />
      
      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          {editedLead && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editedLead.first_name}
                    onChange={(e) => setEditedLead({...editedLead, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editedLead.last_name}
                    onChange={(e) => setEditedLead({...editedLead, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedLead.email}
                    onChange={(e) => setEditedLead({...editedLead, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editedLead.phone}
                    onChange={(e) => setEditedLead({...editedLead, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={editedLead.company}
                    onChange={(e) => setEditedLead({...editedLead, company: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={editedLead.title}
                    onChange={(e) => setEditedLead({...editedLead, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editedLead.status} 
                    onValueChange={(value) => setEditedLead({...editedLead, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                      <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
                      <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
                      <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
                      <SelectItem value={LeadStatus.NEGOTIATION}>Negotiation</SelectItem>
                      <SelectItem value={LeadStatus.WON}>Won</SelectItem>
                      <SelectItem value={LeadStatus.LOST}>Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select 
                    value={editedLead.source} 
                    onValueChange={(value) => setEditedLead({...editedLead, source: value})}
                  >
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeadSource.WEBSITE}>Website</SelectItem>
                      <SelectItem value={LeadSource.REFERRAL}>Referral</SelectItem>
                      <SelectItem value={LeadSource.LINKEDIN}>LinkedIn</SelectItem>
                      <SelectItem value={LeadSource.COLD_CALL}>Cold Call</SelectItem>
                      <SelectItem value={LeadSource.EMAIL_CAMPAIGN}>Email Campaign</SelectItem>
                      <SelectItem value={LeadSource.EVENT}>Event</SelectItem>
                      <SelectItem value={LeadSource.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lead_score">Lead Score (1-10)</Label>
                  <Input
                    id="lead_score"
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={editedLead.lead_score}
                    onChange={(e) => setEditedLead({...editedLead, lead_score: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="campaign">Campaign</Label>
                  <Select 
                    value={editedLead.campaign_id} 
                    onValueChange={(value) => setEditedLead({...editedLead, campaign_id: value})}
                  >
                    <SelectTrigger id="campaign">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {mockCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editedLead.address}
                    onChange={(e) => setEditedLead({...editedLead, address: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editedLead.notes}
                    onChange={(e) => setEditedLead({...editedLead, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
            <DialogDescription>
              {editingTask 
                ? "Update the task details. Click save when you're done."
                : "Create a new task for this lead. Click save when you're done."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Follow up with client"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Additional details about the task"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Due Date (Optional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date ? new Date(newTask.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setNewTask({
                      ...newTask, 
                      due_date: date ? date.toISOString() : ''
                    });
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(value) => setNewTask({...newTask, priority: value as 'low' | 'medium' | 'high'})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newTask.status} 
                  onValueChange={(value) => setNewTask({...newTask, status: value as 'pending' | 'in_progress' | 'completed'})}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assigned_to">Assigned To (Optional)</Label>
                <Select 
                  value={newTask.assigned_to?.id || 'unassigned'} 
                  onValueChange={(value) => {
                    const teamMember = mockTeamMembers.find(m => m.id === value);
                    setNewTask({
                      ...newTask, 
                      assigned_to: value !== 'unassigned' ? { id: value, name: teamMember?.name || '' } : undefined
                    });
                  }}
                >
                  <SelectTrigger id="assigned_to">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {mockTeamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} disabled={!newTask.title}>
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add the EmailDialog component */}
      {leadId && mockLeadDetails[leadId] && (
        <EmailDialog 
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={mockLeadDetails[leadId].email}
          leadName={`${mockLeadDetails[leadId].first_name} ${mockLeadDetails[leadId].last_name}`}
        />
      )}

      {/* Add the PhoneDialog component */}
      {mockLeadDetails[leadId] && (
        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={(open) => setShowPhoneDialog(open)}
          leadPhone={mockLeadDetails[leadId].phone}
          leadName={mockLeadDetails[leadId].full_name}
        />
      )}
    </div>
  );
} 