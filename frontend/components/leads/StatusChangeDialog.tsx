'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LeadStatus } from '@/lib/types/lead';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  leadName: string;
  currentStatus: LeadStatus;
  newStatus: LeadStatus;
  onConfirm: (status: LeadStatus, reason: string) => void;
  onCancel?: () => void;
  isMock?: boolean; // Flag to indicate if we're using mock data
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentStatus,
  newStatus,
  onConfirm,
  onCancel,
  isMock = false // Default to false
}: StatusChangeDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format status for display
  const formatStatus = (status: LeadStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the onConfirm callback with the new status and reason
      onConfirm(newStatus, reason);
      
      // Reset form
      setReason('');
      
      // Close dialog
      onOpenChange(false);
      
      // In a real implementation, the toast would be shown by the parent component
      // after the API call succeeds
      if (isMock) {
        toast.success(`Lead status updated to ${formatStatus(newStatus)}`);
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Lead Status</DialogTitle>
            <DialogDescription>
              You are changing the status of {leadName} from <strong>{formatStatus(currentStatus)}</strong> to <strong>{formatStatus(newStatus)}</strong>.
              Please provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status-change-reason">Reason for status change</Label>
              <Textarea
                id="status-change-reason"
                placeholder="Enter the reason for changing the lead status..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                if (onCancel) onCancel();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 