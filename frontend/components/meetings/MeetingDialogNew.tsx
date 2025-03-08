'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { MeetingForm } from './MeetingForm';
import { Lead } from '@/lib/types/lead';

interface MeetingDialogNewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MeetingDialogNew({
  open,
  onOpenChange,
  lead,
  onSuccess,
  onCancel,
}: MeetingDialogNewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Schedule a meeting with {lead?.full_name || 'the lead'}.
          </DialogDescription>
        </DialogHeader>
        
        <MeetingForm 
          lead={lead}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onOpenChange(false);
          }} 
          onCancel={() => {
            if (onCancel) onCancel();
            onOpenChange(false);
          }} 
        />
      </DialogContent>
    </Dialog>
  );
} 