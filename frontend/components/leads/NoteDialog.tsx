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
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useAddLeadNote } from '../../lib/hooks/useLeads';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  leadName: string;
  onSuccess?: (noteData?: { content: string; is_private: boolean }) => void;
  isMock?: boolean; // Flag to indicate if we're using mock data
}

export function NoteDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onSuccess,
  isMock = false // Default to false
}: NoteDialogProps) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Only use the hook if we're not in mock mode
  const addLeadNote = !isMock ? useAddLeadNote() : null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isMock) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Mock note added:', {
          leadId,
          content,
          isPrivate,
          timestamp: new Date().toISOString()
        });
        toast.success('Note added successfully');
      } else {
        // Use the real API
        await addLeadNote?.mutateAsync({
          leadId,
          content,
          isPrivate
        });
      }
      
      // Reset form
      setContent('');
      setIsPrivate(false);
      
      // Close dialog
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess({
          content,
          is_private: isPrivate
        });
      }
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Note for {leadName}</DialogTitle>
            <DialogDescription>
              Add a note that will appear in the lead's timeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                placeholder="Enter your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="resize-none"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
              />
              <Label htmlFor="is-private" className="cursor-pointer">
                Mark as private (only visible to you and your team)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Note'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 