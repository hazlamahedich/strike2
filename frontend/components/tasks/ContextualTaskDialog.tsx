'use client';

import React, { useState, useRef } from 'react';
import { TaskDialogContent } from '@/components/ui/task-dialog';
import { TaskDialogType } from '@/contexts/TaskDialogContext';
import { createTask } from '@/lib/api/tasks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface ContextualTaskDialogProps {
  dialogId: string;
  leadId?: number;
  leadName?: string;
  handleClose: () => void;
  handleTaskSuccess?: (taskData: any) => void;
}

export function ContextualTaskDialog({
  dialogId,
  leadId,
  leadName = 'New Task',
  handleClose,
  handleTaskSuccess
}: ContextualTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load users for assignee dropdown
  React.useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('User')
        .select('id, name')
        .order('name');
        
      if (data) {
        setUsers(data);
      }
    }
    
    loadUsers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    const fileUrls: string[] = [];
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `task-attachments/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);
          
        if (error) {
          console.error('Error uploading file:', error);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
          
        fileUrls.push(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error during file upload:', error);
    }
    
    setIsUploading(false);
    return fileUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload files first
      const attachmentUrls = await uploadFiles();
      
      // Prepare task data
      const taskData: any = {
        title,
        description,
        due_date: dueDate?.toISOString(),
        priority,
        status: 'pending',
        assigned_to: assignee,
        lead_id: leadId,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
      };
      
      // Get current user for created_by field
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        taskData.created_by = userData.user.id;
      }
      
      // Create the task
      const { data, error } = await createTask(taskData);
      
      if (error) {
        throw error;
      }
      
      // If lead ID is present, add to timeline
      if (leadId) {
        await supabase.from('lead_timeline').insert({
          lead_id: leadId,
          type: 'task_create',
          content: `Created task: "${title}"${attachmentUrls.length > 0 ? ' with attachments' : ''}`,
          created_at: new Date().toISOString(),
          user_id: userData?.user?.id
        });
      }
      
      toast.success('Task added successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setPriority('medium');
      setAssignee('');
      setFiles([]);
      
      // Close dialog
      handleClose();
      
      // Call success callback if provided with complete task data including timeline implications
      if (handleTaskSuccess) {
        const completeTaskData = {
          ...data,
          created_at: new Date().toISOString(),
          user: {
            id: userData?.user?.id,
            name: userData?.user?.email?.split('@')[0] || 'User'
          },
          timeline_activity: {
            type: 'task_create',
            content: `Created task: "${title}"${attachmentUrls.length > 0 ? ' with attachments' : ''}`,
            created_at: new Date().toISOString()
          }
        };
        handleTaskSuccess(completeTaskData);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <TaskDialogContent
      dialogId={dialogId}
      dialogType={TaskDialogType.ADD}
      title={leadId ? `Add Task for ${leadName}` : 'Add Task'}
      onClose={handleClose}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="due-date"
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center">
                      <Flag className={`h-4 w-4 mr-2 text-red-500`} />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center">
                      <Flag className={`h-4 w-4 mr-2 text-amber-500`} />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center">
                      <Flag className={`h-4 w-4 mr-2 text-green-500`} />
                      Low
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="assignee">Assigned To</Label>
            <Select value={assignee} onValueChange={setAssignee} disabled={isSubmitting}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="task-attachments">Attachments</Label>
            <div className="border rounded-md p-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center bg-muted rounded-md p-2 text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1" 
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                <Input
                  id="task-attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
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
                {isUploading ? 'Uploading...' : 'Adding...'}
              </>
            ) : 'Add Task'}
          </Button>
        </DialogFooter>
      </form>
      
      {(isSubmitting || isUploading) && (
        <div className="absolute inset-0 bg-black/5 flex items-center justify-center rounded-md">
          <div className="bg-background p-4 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isUploading ? 'Uploading files...' : 'Adding task...'}
            </p>
          </div>
        </div>
      )}
    </TaskDialogContent>
  );
} 