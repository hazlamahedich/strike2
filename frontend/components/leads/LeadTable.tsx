import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Lead } from '../../types/lead';
import { formatDate } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { MoreHorizontal, Mail, Phone, Calendar, Clock, Activity } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface LeadTableProps {
  leads: Lead[];
  onViewLead: (id: string) => void;
  onEditLead: (id: string) => void;
  onSendEmail: (id: string) => void;
  onScheduleMeeting: (id: string) => void;
  onCallLead: (id: string) => void;
}

export default function LeadTable({
  leads,
  onViewLead,
  onEditLead,
  onSendEmail,
  onScheduleMeeting,
  onCallLead,
}: LeadTableProps) {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lead Score</TableHead>
            <TableHead>Conv. Probability</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Recent Activities</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                No leads found. Create your first lead to get started.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id} onClick={() => onViewLead(lead.id)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  {lead.first_name} {lead.last_name}
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
                      {lead.timeline.length === 0 && (
                        <span className="text-xs text-muted-foreground">No recent activities</span>
                      )}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleMeeting(lead.id);
                      }}
                      title="Schedule Meeting"
                    >
                      <Calendar className="h-4 w-4" />
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 