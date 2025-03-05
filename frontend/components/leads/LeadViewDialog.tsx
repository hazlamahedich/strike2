import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useGetLead } from '../../hooks/useLeads';
import { formatDate } from '../../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Mail, Phone, Calendar, Edit, Trash } from 'lucide-react';

interface LeadViewDialogProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSendEmail: (id: string) => void;
  onScheduleMeeting: (id: string) => void;
  onCallLead: (id: string) => void;
}

export function LeadViewDialog({
  leadId,
  isOpen,
  onClose,
  onEdit,
  onSendEmail,
  onScheduleMeeting,
  onCallLead,
}: LeadViewDialogProps) {
  const { lead, isLoading, error, fetchLead } = useGetLead();

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLead(leadId);
    }
  }, [isOpen, leadId, fetchLead]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading lead details...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Error loading lead details. Please try again.</p>
          </div>
        ) : lead ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {lead.first_name} {lead.last_name}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {lead.job_title && <span>{lead.job_title}</span>}
                {lead.company_name && (
                  <span>{lead.job_title ? ` at ${lead.company_name}` : lead.company_name}</span>
                )}
              </div>
            </DialogHeader>

            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendEmail(leadId)}
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCallLead(leadId)}
                className="flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onScheduleMeeting(leadId)}
                className="flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Meeting
              </Button>
            </div>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <p>{lead.status || 'New'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                    <p>{lead.source || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                    <p>{lead.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                    <p>{lead.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                    <p>{formatDate(lead.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                    <p>{formatDate(lead.updated_at)}</p>
                  </div>
                </div>
                {lead.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="mt-1 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  No activity recorded yet.
                </div>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  {lead.notes ? (
                    <div className="whitespace-pre-wrap text-left">{lead.notes}</div>
                  ) : (
                    'No notes added yet.'
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onEdit(leadId)} className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Edit Lead
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Lead not found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 