import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useGetLead, useUpdateLead } from '../../hooks/useLeads';
import { useToast } from '../ui/use-toast';
import { LeadForm } from './LeadForm';

interface LeadEditDialogProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadEditDialog({
  leadId,
  isOpen,
  onClose,
  onSuccess,
}: LeadEditDialogProps) {
  const { lead, isLoading, error, fetchLead } = useGetLead();
  const { updateLead, isSubmitting } = useUpdateLead();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLead(leadId);
    }
  }, [isOpen, leadId, fetchLead]);

  const handleUpdateLead = async (data: any) => {
    try {
      const result = await updateLead(leadId, data);
      
      if (result) {
        toast({
          title: 'Lead updated',
          description: 'The lead has been updated successfully.',
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading lead details...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Error loading lead details. Please try again.</p>
          </div>
        ) : lead ? (
          <LeadForm
            lead={lead}
            onSubmit={handleUpdateLead}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Lead not found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 