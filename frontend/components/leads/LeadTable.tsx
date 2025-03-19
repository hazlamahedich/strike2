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
import { ContextualRescheduleDialog } from '../meetings/ContextualRescheduleDialog';
import { toast } from 'sonner';
import { Meeting, MeetingStatus, MeetingType } from '@/lib/types/meeting';
import { useLeadNotes, LeadNoteDialogType } from '@/lib/contexts/LeadNotesContext';
import { useTaskDialog } from '@/contexts/TaskDialogContext';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { ContextualTaskDialog } from '@/components/tasks/ContextualTaskDialog';
import { useToast } from '@/components/ui/use-toast';

interface TimelineActivity {
  type: string;
  content?: string;
  created_at: string;
}

interface ExtendedLead extends Lead {
  company_name?: string;
  last_contact?: string;
  lead_score?: number;
  conversion_probability?: number;
  timeline?: TimelineActivity[];
  isInLowConversionPipeline?: boolean;
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
  
  const { openMeetingDialog, closeMeetingDialog } = useMeetingDialog();
  const { openAddNoteDialog } = useLeadNotes();
  const { openTaskDialog, closeTaskDialog } = useTaskDialog();
  const { toast } = useToast();

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
    e.stopPropagation();
    console.log("🎯 LeadTable - handleScheduleMeeting called for lead:", lead);

    const dialogId = `schedule-meeting-${lead.id}-${Date.now()}`;
    console.log("📝 LeadTable - Generated dialogId:", dialogId);

    const baseMeeting = {
      id: `temp-${Date.now()}`,
      title: `Meeting with ${lead.first_name} ${lead.last_name}`,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
      status: MeetingStatus.SCHEDULED,
      meeting_type: MeetingType.INITIAL_CALL,
      lead_id: lead.id,
      lead: lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log("📅 LeadTable - Created baseMeeting:", baseMeeting);

    const dialogContent = (
      <ContextualRescheduleDialog
        dialogId={dialogId}
        meeting={baseMeeting}
        handleClose={() => {
          console.log("❌ LeadTable - Dialog close handler called");
          closeMeetingDialog(dialogId);
        }}
        handleRescheduleSuccess={() => {
          console.log("✅ LeadTable - Meeting scheduled successfully");
          toast({
            title: 'Success',
            description: 'Meeting scheduled successfully',
          });
          closeMeetingDialog(dialogId);
        }}
      />
    );
    console.log("🎨 LeadTable - Created dialog content");

    console.log("🚀 LeadTable - Opening meeting dialog with type:", MeetingDialogType.RESCHEDULE);
    openMeetingDialog(dialogId, MeetingDialogType.RESCHEDULE, dialogContent, { lead });
  };

  const handleAddNote = (e: React.MouseEvent, lead: ExtendedLead) => {
    e.stopPropagation();
    console.log("📝 LeadTable - handleAddNote called for lead:", lead);
    
    // Open the note dialog via the context
    openAddNoteDialog(lead);
    
    // Notify user that the note dialog has been opened
    toast({
      title: 'Add note',
      description: `Adding note for ${lead.first_name} ${lead.last_name}`,
    });
  };

  const handleAddTask = (e: React.MouseEvent, lead: ExtendedLead) => {
    e.stopPropagation();
    
    // Create a unique ID for the dialog
    const dialogId = `add-task-${lead.id}-${Date.now()}`;
    
    // Open the task dialog
    openTaskDialog(
      dialogId,
      TaskDialogType.ADD,
      <ContextualTaskDialog
        dialogId={dialogId}
        leadId={parseInt(lead.id)}
        leadName={`${lead.first_name} ${lead.last_name}`}
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
        <TableRow key={lead.id} onClick={() => onViewLead(lead.id)} className="cursor-pointer hover:bg-muted/50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <span>{lead.first_name} {lead.last_name}</span>
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
          <TableCell>{formatDate(lead.created_at)}</TableCell>
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
                        <p className="text-xs">{formatDate(activity.created_at)}</p>
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
                  onSendEmail(lead.id);
                }}
                title="Send Email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onCallLead(lead.id);
                }}
                title="Call Lead"
              >
                <Phone className="h-4 w-4" />
              </Button>
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
                    onViewLead(lead.id);
                  }}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEditLead(lead.id);
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