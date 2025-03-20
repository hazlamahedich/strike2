'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MeetingDialogContent } from '@/components/ui/meeting-dialog';
import { Lead } from '@/lib/types/lead';
import { LeadNote, LeadNoteDialogType, useLeadNotes } from '@/lib/contexts/LeadNotesContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Paperclip, X, FileText, File, Image, AlertCircle, Minus } from 'lucide-react';
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
  // Use a safe approach to access lead properties that works with different lead object structures
  const leadName = (lead as any).first_name && (lead as any).last_name
    ? `${(lead as any).first_name} ${(lead as any).last_name}`
    : lead?.name || `Lead #${lead?.id}`;
  
  console.log(`ContextualLeadNoteDialog - Rendering for ${leadName} with type ${dialogType}`);
  
  const { saveNote, minimizeDialog } = useLeadNotes();
  const [noteContent, setNoteContent] = useState(note?.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // State for dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, dialogX: 0, dialogY: 0 });
  
  const isViewMode = dialogType === LeadNoteDialogType.VIEW;
  const isAddMode = dialogType === LeadNoteDialogType.ADD;
  
  useEffect(() => {
    console.log(`ContextualLeadNoteDialog - Component mounted for dialog ${dialogId}`);
    
    const timer = setTimeout(() => {
      console.log(`ContextualLeadNoteDialog - Setting visible for dialog ${dialogId}`);
      setIsVisible(true);
    }, 50);
    
    return () => {
      console.log(`ContextualLeadNoteDialog - Component unmounted for dialog ${dialogId}`);
      clearTimeout(timer);
    };
  }, [dialogId]);
  
  useEffect(() => {
    const centerDialog = () => {
      if (!dialogRef.current) return;
      
      // Try multiple ways to find the dialog element
      let dialogElement = dialogRef.current.closest('[data-meeting-dialog]');
      
      // If not found by data attribute, try by the parent element with dialog CSS class
      if (!dialogElement) {
        const parentElement = dialogRef.current.parentElement;
        if (parentElement) {
          dialogElement = parentElement.closest('.lead-note-dialog-wrapper');
        }
      }
      
      // If still not found, try getting the direct parent
      if (!dialogElement && dialogRef.current.parentElement) {
        dialogElement = dialogRef.current.parentElement;
      }
      
      if (!dialogElement) {
        console.log('ContextualLeadNoteDialog - Dialog element not found for positioning, using current element as fallback');
        dialogElement = dialogRef.current;
      }
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dialogWidth = dialogElement.clientWidth || 600;
      const dialogHeight = dialogElement.clientHeight || 400;
      
      const leftPosition = Math.max(0, (viewportWidth - dialogWidth) / 2);
      
      const topPosition = viewportHeight * 0.3 - (dialogHeight * 0.3);
      
      console.log('ContextualLeadNoteDialog - Positioning dialog:', { 
        dialogId,
        dialogWidth, 
        dialogHeight, 
        viewportWidth, 
        viewportHeight, 
        leftPosition, 
        topPosition 
      });
      
      try {
        (dialogElement as HTMLElement).style.top = `${topPosition}px`;
        (dialogElement as HTMLElement).style.left = `${leftPosition}px`;
        
        (dialogElement as HTMLElement).style.position = 'fixed';
        (dialogElement as HTMLElement).style.transform = 'none';
        (dialogElement as HTMLElement).style.margin = '0';
        (dialogElement as HTMLElement).style.zIndex = '1000'; // Ensure it's on top
        
        console.log('ContextualLeadNoteDialog - Successfully positioned dialog', dialogId);
      } catch (error) {
        console.error('ContextualLeadNoteDialog - Error positioning dialog:', error);
      }
    };
    
    const initialTimer = setTimeout(centerDialog, 50);
    
    const secondaryTimer = setTimeout(centerDialog, 300);
    
    const finalTimer = setTimeout(centerDialog, 1000);
    
    const handleResize = () => centerDialog();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(secondaryTimer);
      clearTimeout(finalTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [dialogId, isVisible]);

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header/title bar
    if (!(e.target as HTMLElement).closest('.dialog-header')) return;
    
    setIsDragging(true);
    
    // Store initial mouse position
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      dialogX: position.x,
      dialogY: position.y
    };
    
    // Prevent text selection while dragging
    e.preventDefault();
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new position
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setPosition({
      x: dragStartRef.current.dialogX + dx,
      y: dragStartRef.current.dialogY + dy
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    if (attachments.length + fileArray.length > 5) {
      toast.error('Maximum 5 files allowed', {
        description: 'Please remove some files before adding more',
      });
      return;
    }
    
    const validFiles = fileArray.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: `${file.name} exceeds the 10MB limit`,
        });
        return false;
      }
      return true;
    });
    
    setAttachments([...attachments, ...validFiles]);
    
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
      // Safely convert lead.id to number
      const leadIdStr = typeof lead.id === 'undefined' ? '' : String(lead.id);
      const leadId = leadIdStr ? parseInt(leadIdStr, 10) : 0;
      
      if (!leadId) {
        throw new Error('Invalid lead ID');
      }
      
      console.log(`ContextualLeadNoteDialog - Saving note for lead ID: ${leadId}`);
      
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
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
    // Handle different lead object structures
    const leadName = (lead as any).first_name && (lead as any).last_name
      ? `${(lead as any).first_name} ${(lead as any).last_name}`
      : lead.name || `Lead #${lead.id}`;
    
    switch (dialogType) {
      case LeadNoteDialogType.ADD:
        return `Adding Note to ${leadName}`;
      case LeadNoteDialogType.VIEW:
        return `Viewing Note for ${leadName}`;
      case LeadNoteDialogType.EDIT:
        return `Editing Note for ${leadName}`;
      default:
        return `Lead Note for ${leadName}`;
    }
  };
  
  const handleMinimize = () => {
    console.log(`ContextualLeadNoteDialog - Minimize button clicked for dialog ${dialogId}`);
    minimizeDialog(dialogId, true);
  };
  
  return (
    <div 
      ref={dialogRef} 
      className={cn(
        "lead-note-dialog", 
        "fixed bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col",
        "min-w-[400px] max-w-[90vw] min-h-[200px] max-h-[80vh]",
        {"opacity-0": !isVisible, "opacity-100 transition-opacity duration-200": isVisible}
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 dialog-header cursor-grab">
          <h2 className="text-xl font-semibold select-none">{getDialogTitle()}</h2>
          <div className="flex items-center">
            <button
              onClick={handleMinimize}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
              aria-label="Minimize"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                console.log(`ContextualLeadNoteDialog - Close button clicked for dialog ${dialogId}`);
                handleClose();
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {isViewMode ? (
          // View mode content
          <div className="space-y-4 flex-grow overflow-auto">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{noteContent}</p>
            </div>
            
            {note?.created_at && (
              <div className="text-sm text-gray-500 flex gap-2 items-center">
                <span>Created on {format(new Date(note.created_at), 'MMMM d, yyyy h:mm a')}</span>
              </div>
            )}
            
            {note?.attachments && note.attachments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Attachments</h3>
                <div className="space-y-2">
                  {note.attachments.map((attachment) => (
                    <div 
                      key={attachment.id}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded"
                    >
                      {attachment.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm truncate">{attachment.name}</span>
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-blue-500 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Add/Edit mode content
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <Textarea 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here..."
                className="w-full h-[200px] resize-none"
                disabled={isSaving}
              />
              
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    disabled={isSaving}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || attachments.length >= 5}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>Attach Files</span>
                  </Button>
                  
                  <span className="text-xs text-gray-500">
                    {attachments.length}/5 files (max 10MB each)
                  </span>
                </div>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded"
                    >
                      {getFileIcon(file)}
                      <span className="text-sm truncate flex-grow">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log(`ContextualLeadNoteDialog - Close button clicked for dialog ${dialogId}`);
                  handleClose();
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !noteContent.trim()}
                className={cn(isSaving && "opacity-70 cursor-not-allowed")}
              >
                {isSaving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 