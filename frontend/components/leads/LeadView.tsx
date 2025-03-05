import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import LeadDetail from './LeadDetail';
import { LeadForm } from './LeadForm';
import { useDeleteLead, useLead, useUpdateLead } from '../../lib/hooks/useLeads';
import { useToast } from '../../components/ui/use-toast';
import { Lead as LibLead, LeadUpdate } from '../../lib/types/lead';
import { LeadFormValues, Lead as AppLead } from '../../types/lead';

interface LeadViewProps {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

const LeadView: React.FC<LeadViewProps> = ({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: lead, isLoading, error, refetch } = useLead(leadId) as {
    data: LibLead | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleUpdateLead = async (data: LeadFormValues) => {
    try {
      const updateData: LeadUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company_name,
        title: data.job_title,
        source: data.source as any,
        status: data.status as any,
        custom_fields: data.custom_fields || {},
      };
      
      await updateLeadMutation.mutateAsync({ 
        leadId, 
        leadData: updateData 
      });
      
      toast({
        title: 'Lead Updated',
        description: 'The lead has been successfully updated.',
      });
      setIsEditing(false);
      refetch();
      if (onLeadUpdated) onLeadUpdated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLeadMutation.mutateAsync(leadId);
        
        toast({
          title: 'Lead Deleted',
          description: 'The lead has been successfully deleted.',
        });
        onClose();
        if (onLeadUpdated) onLeadUpdated();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete lead. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleSendEmail = () => {
    router.push(`/email?leadId=${leadId}`);
  };
  
  const handleCall = () => {
    router.push(`/call?leadId=${leadId}`);
  };
  
  const handleScheduleMeeting = () => {
    router.push(`/calendar?leadId=${leadId}`);
  };
  
  const handleAddToCampaign = () => {
    router.push(`/campaigns?leadId=${leadId}`);
  };
  
  const handleAddNote = () => {
    router.push(`/notes/new?leadId=${leadId}`);
  };
  
  const handleAddTask = () => {
    router.push(`/tasks/new?leadId=${leadId}`);
  };
  
  if (!isOpen) return null;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading lead: {error.message}</div>;
  }

  const formLead: AppLead = {
    id: lead?.id.toString() || '',
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email,
    phone: lead?.phone,
    company_name: lead?.company,
    job_title: lead?.title,
    status: lead?.status as string,
    source: lead?.source as string,
    owner_id: lead?.owner_id?.toString(),
    custom_fields: lead?.custom_fields || {},
    created_at: lead?.created_at || '',
    updated_at: lead?.updated_at || ''
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle>
            {isEditing ? 'Edit Lead' : 'Lead Details'}
          </DialogTitle>
        </DialogHeader>
        
        {isEditing ? (
          <LeadForm 
            lead={formLead}
            onSubmit={handleUpdateLead}
            onCancel={handleCancelEdit}
            isSubmitting={updateLeadMutation.isPending}
          />
        ) : (
          <LeadDetail
            leadId={leadId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSendEmail={handleSendEmail}
            onCall={handleCall}
            onScheduleMeeting={handleScheduleMeeting}
            onAddToCampaign={handleAddToCampaign}
            onAddNote={handleAddNote}
            onAddTask={handleAddTask}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadView; 