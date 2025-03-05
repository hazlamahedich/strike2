import React from 'react';
import { Lead } from '../../types/lead';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDate } from '../../lib/utils';
import { Mail, Phone, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface LeadKanbanProps {
  leads: Lead[];
  onViewLead: (id: string) => void;
  onEditLead: (id: string) => void;
  onSendEmail: (id: string) => void;
  onScheduleMeeting: (id: string) => void;
  onCallLead: (id: string) => void;
}

export function LeadKanban({
  leads,
  onViewLead,
  onEditLead,
  onSendEmail,
  onScheduleMeeting,
  onCallLead,
}: LeadKanbanProps) {
  // Define the status columns
  const statuses = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Negotiation', 'Won', 'Lost'];

  // Group leads by status
  const leadsByStatus = statuses.reduce((acc, status) => {
    acc[status] = leads.filter(
      (lead) => (lead.status || 'New').toLowerCase() === status.toLowerCase()
    );
    return acc;
  }, {} as Record<string, Lead[]>);

  // Get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get background color for status column
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-50';
      case 'contacted':
        return 'bg-purple-50';
      case 'qualified':
        return 'bg-green-50';
      case 'unqualified':
        return 'bg-red-50';
      case 'negotiation':
        return 'bg-yellow-50';
      case 'won':
        return 'bg-emerald-50';
      case 'lost':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => (
        <div key={status} className="flex-shrink-0 w-80">
          <div className={`p-4 rounded-t-md ${getStatusColor(status)}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{status}</h3>
              <span className="text-sm text-muted-foreground">
                {leadsByStatus[status]?.length || 0}
              </span>
            </div>
          </div>
          <div className={`p-2 rounded-b-md border border-t-0 max-h-[calc(100vh-220px)] overflow-y-auto ${getStatusColor(status)}`}>
            {leadsByStatus[status]?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads in this stage
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leadsByStatus[status]?.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onViewLead(lead.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(lead.first_name, lead.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-sm font-medium">
                            {lead.first_name} {lead.last_name}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    </CardHeader>
                    <CardContent className="p-4 pt-0 pb-2">
                      {lead.company_name && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {lead.company_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(lead.created_at)}
                      </p>
                    </CardContent>
                    <CardFooter className="p-2 flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendEmail(lead.id);
                        }}
                        title="Send Email"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallLead(lead.id);
                        }}
                        title="Call Lead"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleMeeting(lead.id);
                        }}
                        title="Schedule Meeting"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 