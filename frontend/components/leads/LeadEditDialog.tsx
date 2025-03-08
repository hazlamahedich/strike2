import React, { useEffect, useRef } from 'react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeadEditDialog({
  leadId,
  open,
  onOpenChange,
  onSuccess,
}: LeadEditDialogProps) {
  // If leadId is empty or undefined, use a default value
  const effectiveLeadId = leadId || '1';
  
  // Use a ref to track which lead ID we've already fetched
  const fetchedLeadIdRef = useRef<string | null>(null);
  
  const { lead, isLoading, error, fetchLead } = useGetLead();
  const { updateLead, isSubmitting } = useUpdateLead();
  const { toast } = useToast();

  // Add debugging
  console.log('LeadEditDialog - leadId:', leadId);
  console.log('LeadEditDialog - effectiveLeadId:', effectiveLeadId);
  console.log('LeadEditDialog - open:', open);
  console.log('LeadEditDialog - lead:', lead);
  console.log('LeadEditDialog - isLoading:', isLoading);
  console.log('LeadEditDialog - error:', error);
  console.log('LeadEditDialog - fetchedLeadId:', fetchedLeadIdRef.current);

  // Fetch lead data when dialog opens or leadId changes
  useEffect(() => {
    if (open && effectiveLeadId) {
      // Only fetch if we haven't fetched yet or if the leadId has changed
      if (!fetchedLeadIdRef.current || fetchedLeadIdRef.current !== effectiveLeadId) {
        console.log('LeadEditDialog - Fetching lead with ID:', effectiveLeadId);
        fetchedLeadIdRef.current = effectiveLeadId;
        fetchLead(effectiveLeadId);
      }
    }
    
    // Reset the ref when dialog closes
    if (!open) {
      fetchedLeadIdRef.current = null;
    }
  }, [open, effectiveLeadId, fetchLead]);

  // If the dialog is open but we've been trying to load for more than 3 seconds, show an error
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (open && isLoading && fetchedLeadIdRef.current) {
      timeoutId = setTimeout(() => {
        if (isLoading && !lead) {
          console.error('LeadEditDialog - Lead not found after timeout');
          toast({
            title: 'Error',
            description: 'Could not find lead details. Please try again.',
            variant: 'destructive',
          });
          onOpenChange(false);
        }
      }, 3000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [open, isLoading, lead, toast, onOpenChange, fetchedLeadIdRef]);

  const handleUpdateLead = async (data: any) => {
    console.log('LeadEditDialog - Updating lead with data:', data);
    try {
      const result = await updateLead(effectiveLeadId, data);
      
      console.log('LeadEditDialog - Update result:', result);
      
      if (result) {
        toast({
          title: 'Lead updated',
          description: 'The lead has been updated successfully.',
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error('LeadEditDialog - Update error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
            onCancel={() => onOpenChange(false)}
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