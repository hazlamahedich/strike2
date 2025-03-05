import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useCreateLead } from '../../hooks/useLeads';
import { useToast } from '../ui/use-toast';
import { LeadForm } from './LeadForm';

interface LeadCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeadCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: LeadCreateDialogProps) {
  const { createLead, isSubmitting } = useCreateLead();
  const { toast } = useToast();

  const handleCreateLead = async (data: any) => {
    try {
      const result = await createLead(data);
      
      if (result) {
        toast({
          title: 'Lead created',
          description: 'The lead has been created successfully.',
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
        </DialogHeader>
        
        <LeadForm
          onSubmit={handleCreateLead}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
} 