import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Lead, LeadStatus, LeadSource } from '@/lib/types/lead';
import { formatDate } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { MoreHorizontal, Mail, Phone, Calendar, Clock, Activity, FileText, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useMeetingDialog, MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { ContextualScheduleDialog } from '../meetings/ContextualScheduleDialog';
import { toast } from 'sonner';
import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { useLeadNotes, LeadNoteDialogType } from '@/lib/contexts/LeadNotesContext';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { ContextualTaskDialog } from '@/components/tasks/ContextualTaskDialog';
import { useToast } from '@/components/ui/use-toast';
import { useLeadPhoneDialog } from '@/contexts/LeadPhoneDialogContext';
import { CallLeadButton } from '../communications/CallLeadButton';
import { Lead as DialogLead } from '../../types/lead';
import { ScheduleMeetingDialog } from '../meetings/ScheduleMeetingDialog';
import { EnhancedMeetingForm } from '../meetings/EnhancedMeetingForm';
import { Lead as TypesLead } from '@/types/lead';
import { createMeeting } from '@/lib/api/meetings';
import { ContextualScheduleMeetingDialog } from '../meetings/ContextualScheduleMeetingDialog';

interface TimelineActivity {
  type: string;
  content?: string;
  created_at: string;
}

// Don't extend Lead, define a separate interface with the properties we use
interface ExtendedLead {
  id: string | number;
  name: string;
  company?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  last_contact?: string;
  lead_score?: number;
  conversion_probability?: number;
  timeline?: TimelineActivity[];
  isInLowConversionPipeline?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LeadTableProps {
  leads: ExtendedLead[];
  onViewLead: (id: string) => void;
  onEditLead: (id: string) => void;
  onSendEmail: (id: string) => void;
  onCallLead: (id: string) => void;
}

export default function LeadTable({
  leads,
  onViewLead,
  onEditLead,
  onSendEmail,
  onCallLead,
}: LeadTableProps) {
  console.log("🔍 LeadTable - Component rendered with", leads.length, "leads");
  
  // In development mode, ensure leads with low scores or conversion probability show the low conversion badge
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      leads.forEach(lead => {
        // Set isInLowConversionPipeline for demo purposes if lead has low score or conversion probability
        if (!lead.isInLowConversionPipeline && 
            ((lead.lead_score !== undefined && lead.lead_score < 30) || 
             (lead.conversion_probability !== undefined && lead.conversion_probability < 0.3))) {
          console.log('Demo mode: Setting low conversion flag for lead', lead.id);
          lead.isInLowConversionPipeline = true;
        }
      });
    }
  }, [leads]);
  
  // Helper to safely convert id to string
  const idToString = (id: string | number | undefined): string => {
    if (id === undefined) return '';
    return String(id);
  };
  
  const { openMeetingDialog, closeMeetingDialog } = useMeetingDialog();
  const { openAddNoteDialog } = useLeadNotes();
  const { openTaskDialog, closeTaskDialog } = useTaskDialog();
  const { toast } = useToast();
  const { openPhoneDialog } = useLeadPhoneDialog();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'unqualified':
        return 'bg-red-100 text-red-800';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'won':
        return 'bg-emerald-100 text-emerald-800';
      case 'lost':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConversionProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600';
    if (probability >= 0.4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConversionProbabilityLabel = (probability: number) => {
    if (probability >= 0.7) return 'High';
    if (probability >= 0.4) return 'Medium';
    return 'Low';
  };

  const getTimelineIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-3 w-3 text-blue-500" />;
      case 'call':
        return <Phone className="h-3 w-3 text-green-500" />;
      case 'meeting':
        return <Calendar className="h-3 w-3 text-purple-500" />;
      case 'note':
        return <Activity className="h-3 w-3 text-amber-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleScheduleMeeting = (e: React.MouseEvent, lead: ExtendedLead) => {
    e.preventDefault();
    e.stopPropagation();  // Prevent form submission
    
    console.log(`LeadTable - handleScheduleMeeting called for lead:`, lead);
    
    const dialogId = `schedule-meeting-${lead.id}`;
    console.log(`LeadTable - Calendar button clicked for lead: ${lead.id}`, lead);
    
    // Create dialog content with the ContextualScheduleMeetingDialog component
    const dialogContent = <ContextualScheduleMeetingDialog dialogId={dialogId} />;
    
    const result = openMeetingDialog(
      dialogId,
      MeetingDialogType.SCHEDULE,
      dialogContent,
      { leadId: idToString(lead.id) }
    );
    
    console.log(`LeadTable - Opening meeting dialog result:`, result);
  };

  const handleAddNote = (e: React.MouseEvent, lead: ExtendedLead) => {
    e.stopPropagation();
    console.log("📝 LeadTable - handleAddNote called for lead:", lead);
    console.log("🔍 LeadTable - lead.id type:", typeof lead.id, "value:", lead.id);
    console.log("🔍 LeadTable - lead.name:", lead.name);
    
    // Convert the lead to a format compatible with the notes dialog
    const notesLead = {
      id: typeof lead.id === 'string' ? parseInt(lead.id) : Number(lead.id),
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || lead.company_name || '',
      status: lead.status || '',
      // Add other properties required by Lead type if needed
    };
    
    console.log("🧩 LeadTable - Converted notesLead:", notesLead);
    
    // Open the note dialog via the context
    openAddNoteDialog(notesLead as any);
    
    // Notify user that the note dialog has been opened
    toast({
      title: 'Add note',
      description: `Adding note for ${lead.name || 'lead'}`,
    });
  };

  const handleAddTask = (e: React.MouseEvent, lead: ExtendedLead) => {
    e.stopPropagation();
    console.log("🔧 LeadTable - handleAddTask called for lead:", lead);
    console.log("🔍 LeadTable - lead.id type:", typeof lead.id, "value:", lead.id);
    
    // Create a unique ID for the dialog
    const dialogId = `add-task-${idToString(lead.id)}-${Date.now()}`;
    
    // Convert lead.id to a number for the ContextualTaskDialog
    const leadIdNum = typeof lead.id === 'string' ? parseInt(lead.id, 10) : Number(lead.id);
    console.log("🧩 LeadTable - Converted leadIdNum:", leadIdNum);
    
    // Open the task dialog
    openTaskDialog(
      dialogId,
      TaskDialogType.ADD,
      <ContextualTaskDialog
        dialogId={dialogId}
        leadId={leadIdNum}
        leadName={lead.name || ''}
        handleClose={() => closeTaskDialog(dialogId)}
        handleTaskSuccess={handleTaskCreated}
      />
    );
  };

  const handleTaskCreated = (taskData: any) => {
    console.log("✅ LeadTable - Task created successfully:", taskData);
    
    // Show success notification
    toast({
      title: "Task Created",
      description: `Task "${taskData.title}" was created successfully`,
    });
  };

  return (
    <>
      {leads.map((lead) => (
        <TableRow key={lead.id} onClick={() => onViewLead(idToString(lead.id))} className="cursor-pointer hover:bg-muted/50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <span>{lead.name}</span>
              {lead.isInLowConversionPipeline && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                  Low Conversion
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell>{lead.company_name || '-'}</TableCell>
          <TableCell>{lead.email || '-'}</TableCell>
          <TableCell>{lead.phone || '-'}</TableCell>
          <TableCell>
            <Badge className={getStatusColor(lead.status || 'new')}>
              {lead.status || 'New'}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center">
              <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, (lead.lead_score || 0) * 10))}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{lead.lead_score || 'N/A'}</span>
            </div>
          </TableCell>
          <TableCell>
            {lead.conversion_probability !== undefined ? (
              <div className="flex items-center">
                <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      (lead.conversion_probability || 0) >= 0.7 ? 'bg-green-500' : 
                      (lead.conversion_probability || 0) >= 0.4 ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (lead.conversion_probability || 0) * 100))}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${getConversionProbabilityColor(lead.conversion_probability || 0)}`}>
                  {Math.round((lead.conversion_probability || 0) * 100)}%
                  <span className="text-xs ml-1 text-muted-foreground">
                    ({getConversionProbabilityLabel(lead.conversion_probability || 0)})
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">N/A</span>
            )}
          </TableCell>
          <TableCell>{lead.created_at ? formatDate(lead.created_at) : 'N/A'}</TableCell>
          <TableCell>{lead.last_contact ? formatDate(lead.last_contact) : 'Never'}</TableCell>
          <TableCell>
            {lead.timeline && lead.timeline.length > 0 ? (
              <div className="flex flex-col gap-1">
                {lead.timeline.slice(0, 3).map((activity, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs">
                          {getTimelineIcon(activity.type)}
                          <span className="ml-1 truncate max-w-[120px]">
                            {activity.content || activity.type}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{activity.created_at ? formatDate(activity.created_at) : 'N/A'}</p>
                        <p>{activity.content || `${activity.type} activity`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No activities</span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendEmail(idToString(lead.id));
                }}
                title="Send Email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <CallLeadButton
                leadId={idToString(lead.id)}
                leadName={lead.name || 'Lead'}
                phone={lead.phone}
                email={lead.email}
                size="icon"
                variant="ghost" 
                className="h-8 w-8"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleScheduleMeeting(e, lead)}
                title="Schedule Meeting"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleAddNote(e, lead)}
                title="Add Note"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleAddTask(e, lead)}
                title="Add Task"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onViewLead(idToString(lead.id));
                  }}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEditLead(idToString(lead.id));
                  }}>
                    Edit Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleAddNote(e, lead);
                  }}>
                    Add Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
} 