'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2, CalendarIcon, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  leadName: string;
  onSuccess?: (taskData?: any) => void;
  isMock?: boolean; // Flag to indicate if we're using mock data
  task?: any; // Task data for editing
  isEditing?: boolean; // Flag to indicate if we're editing an existing task
}

export function TaskDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onSuccess,
  isMock = false, // Default to false
  task,
  isEditing = false
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with task data if editing
  useEffect(() => {
    if (isEditing && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      
      // Parse due date if it exists
      if (task.due_date) {
        try {
          setDueDate(new Date(task.due_date));
        } catch (error) {
          console.error('Failed to parse due date:', error);
        }
      }
      
      setPriority(task.priority || 'medium');
      setAssignee(task.assignee?.id || task.assignee || '');
    }
  }, [isEditing, task]);
  
  // Mock users for assignee dropdown
  const mockUsers = [
    { id: '1', name: 'Jane Doe' },
    { id: '2', name: 'John Smith' },
    { id: '3', name: 'Alice Johnson' },
    { id: '4', name: 'Bob Brown' },
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare task data
      const taskData: any = {
        title,
        description,
        due_date: dueDate?.toISOString(),
        priority,
        assignee,
        completed: isEditing && task ? task.completed : false
      };
      
      if (isEditing && task) {
        // Add task ID for updates
        taskData.id = task.id;
      }
      
      if (isMock) {
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (isEditing && task) {
          // Update existing task
          console.log('Mock task updated:', {
            ...taskData,
            leadId,
            updated_at: new Date().toISOString()
          });
          toast.success('Task updated successfully');
        } else {
          // Create new task
          console.log('Mock task added:', {
            ...taskData,
            leadId,
            created_at: new Date().toISOString()
          });
          toast.success('Task added successfully');
        }
      } else {
        // In a real implementation, we would call the API here
        // if (isEditing && task) {
        //   await updateLeadTask?.mutateAsync({ taskId: task.id, taskData });
        // } else {
        //   await addLeadTask?.mutateAsync({ ...taskData, leadId });
        // }
        
        // For now, just show a toast
        toast.success(isEditing ? 'Task updated successfully' : 'Task added successfully');
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setPriority('medium');
      setAssignee('');
      
      // Close dialog
      onOpenChange(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(taskData);
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'add'} task:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} task`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'} for {leadName}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the task details below.' 
                : 'Add a task that will appear in the lead\'s timeline and task list.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
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
                <Select value={priority} onValueChange={setPriority}>
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
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditing ? 'Update Task' : 'Add Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 