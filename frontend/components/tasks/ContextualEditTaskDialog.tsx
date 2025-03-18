'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TaskDialogContent } from '@/components/ui/task-dialog';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { updateTask } from '@/lib/api/tasks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Flag, Upload, X, Paperclip } from 'lucide-react';
import supabase from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface ContextualEditTaskDialogProps {
  dialogId: string;
  taskId: number | string;
  task: any; // The task data to edit
  leadId?: number;
  leadName?: string;
  handleClose: () => void;
  handleEditSuccess?: (updatedTask: any) => void;
}

export function ContextualEditTaskDialog({
  dialogId,
  taskId,
  task,
  leadId,
  leadName = 'Edit Task',
  handleClose,
  handleEditSuccess
}: ContextualEditTaskDialogProps) {
  console.log("ContextualEditTaskDialog - Rendering for", task.title, "- dialogId:", dialogId);
  
  // State for form fields
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [assignee, setAssignee] = useState(task.assigned_to || '');
  const [status, setStatus] = useState(task.status || 'pending');
  
  // State for UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    task.attachments || []
  );
  
  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };
  
  // Remove a file from the selection
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove an existing attachment
  const removeAttachment = (url: string) => {
    setExistingAttachments(prev => prev.filter(a => a !== url));
  };
  
  // Upload files to storage
  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) {
      return [];
    }
    
    setIsUploading(true);
    
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const fileName = `tasks/${taskId}/${uuidv4()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, file);
          
          if (error) {
            throw error;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);
          
          return urlData.publicUrl;
        })
      );
      
      setIsUploading(false);
      return uploads;
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
      return [];
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload any new files
      const newAttachmentUrls = await uploadFiles();
      
      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...newAttachmentUrls];
      
      // Prepare task data for update
      const taskData: any = {
        title,
        description,
        due_date: dueDate?.toISOString(),
        priority,
        status,
        assigned_to: assignee,
        attachments: allAttachments.length > 0 ? allAttachments : undefined
      };
      
      // Update the task
      const { data, error } = await updateTask(
        typeof taskId === 'string' ? parseInt(taskId, 10) : taskId,
        taskData
      );
      
      if (error) {
        throw error;
      }
      
      // If lead ID is present, add to timeline
      if (leadId) {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('lead_timeline').insert({
          lead_id: leadId,
          type: 'task_update',
          content: `Updated task: "${title}"`,
          created_at: new Date().toISOString(),
          user_id: userData?.user?.id
        });
      }
      
      toast.success('Task updated successfully');
      
      // Call success callback with updated task data
      if (handleEditSuccess) {
        handleEditSuccess({
          ...task,
          ...taskData
        });
      }
      
      // Close dialog
      handleClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error', {
        description: 'Failed to update the task',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Explicit close handler with logging
  const handleCloseWithLogging = () => {
    console.log("ContextualEditTaskDialog - Closing dialog:", dialogId);
    handleClose();
  };
  
  return (
    <TaskDialogContent
      dialogId={dialogId}
      dialogType={TaskDialogType.EDIT}
      title={leadId ? `Edit Task for ${leadName}` : 'Edit Task'}
      onClose={handleCloseWithLogging}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Enter task description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-due-date">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="task-due-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={setPriority}
              disabled={isSubmitting}
            >
              <SelectTrigger id="task-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center">
                    <Flag className="mr-2 h-4 w-4 text-green-500" />
                    Low
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center">
                    <Flag className="mr-2 h-4 w-4 text-yellow-500" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center">
                    <Flag className="mr-2 h-4 w-4 text-red-500" />
                    High
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-status">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isSubmitting}
            >
              <SelectTrigger id="task-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-assignee">Assignee</Label>
            <Input
              id="task-assignee"
              placeholder="Enter assignee name or ID..."
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Attachments</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {existingAttachments.map((url, index) => (
                <div key={`existing-${index}`} className="flex items-center bg-muted rounded-md p-1">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-[150px]">
                    <Paperclip className="inline-block h-3 w-3 mr-1" />
                    {url.split('/').pop()}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => removeAttachment(url)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {files.map((file, index) => (
                <div key={`new-${index}`} className="flex items-center bg-muted rounded-md p-1">
                  <span className="text-xs truncate max-w-[150px]">
                    <Paperclip className="inline-block h-3 w-3 mr-1" />
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Files
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCloseWithLogging}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <>
                <span className="spinner mr-2"></span>
                {isUploading ? 'Uploading...' : 'Updating...'}
              </>
            ) : 'Update Task'}
          </Button>
        </div>
      </form>
      
      {(isSubmitting || isUploading) && (
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center rounded-md">
          <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isUploading ? 'Uploading files...' : 'Updating task...'}
            </p>
          </div>
        </div>
      )}
    </TaskDialogContent>
  );
} 