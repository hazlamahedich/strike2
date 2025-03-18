'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { Lead } from '@/lib/types/lead';
import { LeadNote, LeadNoteDialogType, useLeadNotes } from '@/lib/contexts/LeadNotesContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Paperclip, X, FileText, File, Image, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualLeadNoteDialogProps {
  dialogId: string;
  lead: Lead;
  note?: LeadNote;
  dialogType: LeadNoteDialogType;
  handleClose: () => void;
  handleNoteSuccess?: (note: LeadNote) => void;
}

export function ContextualLeadNoteDialog({
  dialogId,
  lead,
  note,
  dialogType,
  handleClose,
  handleNoteSuccess
}: ContextualLeadNoteDialogProps) {
  console.log(`ContextualLeadNoteDialog - Rendering for ${lead.first_name} ${lead.last_name} with type ${dialogType}`);
  
  const { saveNote } = useLeadNotes();
  const [noteContent, setNoteContent] = useState(note?.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  
  const isViewMode = dialogType === LeadNoteDialogType.VIEW;
  const isAddMode = dialogType === LeadNoteDialogType.ADD;
  
  // Position the dialog at center of screen when it mounts
  useEffect(() => {
    // Function to center the dialog
    const centerDialog = () => {
      if (!dialogRef.current) return;
      
      const dialogElement = dialogRef.current.closest('[data-meeting-dialog]');
      if (!dialogElement) return;
      
      // Center horizontally and vertically
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dialogWidth = dialogElement.clientWidth || 600; // Fallback width if not available
      const dialogHeight = dialogElement.clientHeight || 400; // Fallback height if not available
      
      // Calculate positions to center the dialog
      const leftPosition = Math.max(0, (viewportWidth - dialogWidth) / 2);
      
      // Place dialog at 30% from top of screen for best visibility
      const topPosition = viewportHeight * 0.3 - (dialogHeight * 0.3);
      
      console.log('Positioning dialog:', { 
        dialogWidth, 
        dialogHeight, 
        viewportWidth, 
        viewportHeight, 
        leftPosition, 
        topPosition 
      });
      
      // Set position using custom attributes that MeetingDialogContent understands
      (dialogElement as HTMLElement).style.top = `${topPosition}px`;
      (dialogElement as HTMLElement).style.left = `${leftPosition}px`;
      
      // Force this specific dialog to use fixed positioning
      (dialogElement as HTMLElement).style.position = 'fixed';
      (dialogElement as HTMLElement).style.transform = 'none'; // Prevent any transform positioning
      (dialogElement as HTMLElement).style.margin = '0'; // Remove any margin
    };
    
    // Initial positioning with a small delay
    const initialTimer = setTimeout(centerDialog, 50);
    
    // Secondary positioning check after content has likely rendered
    const secondaryTimer = setTimeout(centerDialog, 300);
    
    // Add position recalculation on window resize
    const handleResize = () => centerDialog();
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up all timers and event listeners
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [dialogId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to array
    const fileArray = Array.from(files);
    
    // Check if total files don't exceed 5
    if (attachments.length + fileArray.length > 5) {
      toast.error('Maximum 5 files allowed', {
        description: 'Please remove some files before adding more',
      });
      return;
    }
    
    // Check each file size (max 10MB per file)
    const validFiles = fileArray.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: `${file.name} exceeds the 10MB limit`,
        });
        return false;
      }
      return true;
    });
    
    // Add valid files to attachments
    setAttachments([...attachments, ...validFiles]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newAttachments = [...attachments];
    const removedFile = newAttachments[index];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    toast.info('File removed', {
      description: `Removed ${removedFile.name}`,
    });
  };
  
  const getFileIcon = (file: File) => {
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast.error('Error', {
        description: 'Note content cannot be empty',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const leadId = parseInt(lead.id.toString(), 10);
      
      // Process attachments if any
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          // Convert file to base64 for sending to API
          return new Promise<{name: string, type: string, size: number, data: string}>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );
      
      // Call API with both note content and attachments
      const { data, error } = await saveNote(leadId, noteContent, processedAttachments);
      
      if (error) {
        console.error('Error saving note:', error);
        toast.error('Error', {
          description: 'Failed to save note',
        });
        setIsSaving(false);
        return;
      }
      
      toast.success('Success', {
        description: attachments.length > 0
          ? `Note with ${attachments.length} attachment${attachments.length === 1 ? '' : 's'} saved successfully`
          : 'Note saved successfully',
      });
      
      if (handleNoteSuccess && data) {
        handleNoteSuccess(data);
      }
      
      handleClose();
    } catch (err) {
      console.error('Error saving note:', err);
      toast.error('Error', {
        description: 'Failed to save note',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getDialogTitle = () => {
    switch (dialogType) {
      case LeadNoteDialogType.ADD:
        return 'Add Note';
      case LeadNoteDialogType.VIEW:
        return 'View Note';
      case LeadNoteDialogType.EDIT:
        return 'Edit Note';
      default:
        return 'Lead Note';
    }
  };
  
  return (
    <div ref={dialogRef}>
      <MeetingDialogContent
        dialogId={dialogId}
        dialogType={dialogType as any}
        title={getDialogTitle()}
        onClose={handleClose}
      >
        <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-auto styled-scrollbar p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {lead.first_name} {lead.last_name}
              </h3>
              {note && (
                <div className="text-sm text-muted-foreground">
                  Created: {format(new Date(note.created_at), 'MMM dd, yyyy h:mm a')}
                </div>
              )}
            </div>
            
            <Textarea
              placeholder="Enter note"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              disabled={isViewMode || isSaving}
              className="min-h-[200px]"
            />
            
            {/* File Attachment Section */}
            {!isViewMode && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Attachments</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (Max 5 files, 10MB each)
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isViewMode || isSaving || attachments.length >= 5}
                    className="flex items-center"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    <span>Attach File</span>
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    hidden
                    multiple
                    disabled={isViewMode || isSaving || attachments.length >= 5}
                  />
                  
                  {attachments.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                    </span>
                  )}
                </div>
                
                {attachments.length > 0 && (
                  <div className="border rounded-md p-2 space-y-1">
                    {attachments.map((file, index) => (
                      <div 
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getFileIcon(file)}
                          <span className="text-sm truncate max-w-[280px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)}KB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isSaving}
                          className="h-7 w-7"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Show attachments in view mode */}
            {isViewMode && note?.attachments && note.attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Attachments</span>
                </div>
                
                <div className="border rounded-md p-2 space-y-1">
                  {note.attachments.map((attachment, index) => (
                    <div 
                      key={`${attachment.name}-${index}`}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {attachment.type.startsWith('image/') ? (
                          <Image className="h-4 w-4 text-blue-500" />
                        ) : attachment.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : attachment.type.includes('word') || attachment.type.includes('document') ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : attachment.type.includes('excel') || attachment.type.includes('spreadsheet') ? (
                          <FileText className="h-4 w-4 text-green-500" />
                        ) : (
                          <File className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm truncate max-w-[280px]">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(0)}KB
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="h-7 px-2"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              
              {!isViewMode && (
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !noteContent.trim()}
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Note'
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {isSaving && (
            <div className="mt-4 flex items-center justify-center p-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="text-sm text-muted-foreground">Saving note...</p>
              </div>
            </div>
          )}
        </div>
      </MeetingDialogContent>
    </div>
  );
} 