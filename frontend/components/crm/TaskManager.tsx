import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  Plus,
  AlertCircle,
  X,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';
export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  assignedTo: string;
  assignedToAvatar?: string;
  relatedTo?: {
    type: 'contact' | 'deal' | 'company';
    id: string;
    name: string;
  };
  createdAt: string;
  completedAt?: string;
}

interface TaskManagerProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onTaskSelect: (task: Task) => void;
}

export function TaskManager({ tasks, onTaskComplete, onTaskAdd, onTaskSelect }: TaskManagerProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'today':
        return tasks.filter(task => {
          const today = new Date().toISOString().split('T')[0];
          return task.dueDate.split('T')[0] === today && task.status !== 'completed';
        });
      case 'upcoming':
        return tasks.filter(task => {
          const today = new Date().toISOString().split('T')[0];
          return task.dueDate.split('T')[0] > today && task.status !== 'completed';
        });
      case 'overdue':
        return tasks.filter(task => task.status === 'overdue');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      case 'high':
        return tasks.filter(task => task.priority === 'high' && task.status !== 'completed');
      default:
        return tasks.filter(task => task.status !== 'completed');
    }
  };
  
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      onTaskAdd({
        title: newTaskTitle,
        dueDate: tomorrow.toISOString(),
        priority: 'medium',
        status: 'todo',
        type: 'follow_up',
        assignedTo: 'John Doe',
      });
      
      setNewTaskTitle('');
      setShowAddTask(false);
    }
  };
  
  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-blue-500',
  };
  
  const typeIcons = {
    call: <Phone className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    meeting: <Calendar className="h-3.5 w-3.5" />,
    follow_up: <Clock className="h-3.5 w-3.5" />,
    other: <Tag className="h-3.5 w-3.5" />,
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Tasks & Follow-ups</h3>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => setShowAddTask(!showAddTask)}
          >
            {showAddTask ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showAddTask ? 'Cancel' : 'Add Task'}
          </Button>
        </div>
        
        <AnimatePresence>
          {showAddTask && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex space-x-2 mt-3 mb-2">
                <Input
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="high">High Priority</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="more">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center">
                    More <ChevronDown className="ml-1 h-3 w-3" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setActiveTab('calls')}>
                    Calls
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab('emails')}>
                    Emails
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab('meetings')}>
                    Meetings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-4 pt-4 flex-1 overflow-auto">
        <AnimatePresence>
          <motion.div className="space-y-2">
            {getFilteredTasks().length > 0 ? (
              getFilteredTasks().map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onComplete={() => onTaskComplete(task.id)}
                  onSelect={() => onTaskSelect(task)}
                />
              ))
            ) : (
              <div className="h-32 flex items-center justify-center border border-dashed border-border rounded-md">
                <p className="text-sm text-muted-foreground">No tasks found</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-border">
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
          <span>{getFilteredTasks().length} tasks</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All Tasks
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface TaskItemProps {
  task: Task;
  onComplete: () => void;
  onSelect: () => void;
}

function TaskItem({ task, onComplete, onSelect }: TaskItemProps) {
  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-blue-500',
  };
  
  const statusColors = {
    todo: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-green-500',
    overdue: 'bg-red-500',
  };
  
  const isOverdue = () => {
    if (task.status === 'completed') return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };
  
  const getDaysRemaining = () => {
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card 
        className={`overflow-hidden border ${
          task.status === 'overdue' || isOverdue() ? 'border-red-400/50' : ''
        } ${
          task.priority === 'high' ? 'border-amber-400/50' : ''
        }`}
        onClick={onSelect}
      >
        <div className="flex p-3">
          <div className="mr-3 mt-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              <div className="flex items-center space-x-1">
                {task.priority === 'high' && (
                  <Badge variant="outline" className={`${priorityColors[task.priority]} text-[10px] px-1.5 py-0 h-4 border-current`}>
                    High
                  </Badge>
                )}
                {(task.status === 'overdue' || isOverdue()) && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    <AlertCircle className="h-2.5 w-2.5 mr-1" /> Overdue
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            )}
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                
                {task.relatedTo && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{task.relatedTo.name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Avatar className="h-5 w-5">
                  {task.assignedToAvatar ? (
                    <img src={task.assignedToAvatar} alt={task.assignedTo} />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </Avatar>
                <span className="text-xs">{task.assignedTo.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 