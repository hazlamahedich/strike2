'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Task priority types
type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Task type
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: Priority;
  assignedTo: string;
  assignedToAvatar: string;
  relatedTo: {
    type: 'contact' | 'deal' | 'company';
    name: string;
    id: string;
  } | null;
  createdAt: string;
}

// Mock tasks data
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Follow up with Jane Smith about proposal',
    description: 'Send an email to check if they have reviewed our proposal',
    dueDate: '2023-06-20',
    completed: false,
    priority: 'high',
    assignedTo: 'You',
    assignedToAvatar: '',
    relatedTo: {
      type: 'contact',
      name: 'Jane Smith',
      id: '1',
    },
    createdAt: '2023-06-15',
  },
  {
    id: '2',
    title: 'Prepare presentation for TechCorp meeting',
    description: 'Create slides for the upcoming product demo',
    dueDate: '2023-06-18',
    completed: false,
    priority: 'urgent',
    assignedTo: 'You',
    assignedToAvatar: '',
    relatedTo: {
      type: 'deal',
      name: 'Consulting Services',
      id: '2',
    },
    createdAt: '2023-06-14',
  },
  {
    id: '3',
    title: 'Update InnoSoft implementation timeline',
    description: 'Revise the project timeline based on recent feedback',
    dueDate: '2023-06-25',
    completed: false,
    priority: 'medium',
    assignedTo: 'Sarah Johnson',
    assignedToAvatar: '',
    relatedTo: {
      type: 'deal',
      name: 'Product Implementation',
      id: '3',
    },
    createdAt: '2023-06-13',
  },
  {
    id: '4',
    title: 'Send contract to GlobalTech',
    description: 'Finalize and send the annual support contract',
    dueDate: '2023-06-17',
    completed: true,
    priority: 'high',
    assignedTo: 'You',
    assignedToAvatar: '',
    relatedTo: {
      type: 'company',
      name: 'GlobalTech Inc.',
      id: '4',
    },
    createdAt: '2023-06-12',
  },
  {
    id: '5',
    title: 'Schedule onboarding call with NextStep',
    description: 'Set up initial onboarding call for software upgrade',
    dueDate: '2023-06-30',
    completed: false,
    priority: 'low',
    assignedTo: 'Emily Davis',
    assignedToAvatar: '',
    relatedTo: {
      type: 'deal',
      name: 'Software Upgrade',
      id: '5',
    },
    createdAt: '2023-06-10',
  },
  {
    id: '6',
    title: 'Review Q2 sales pipeline',
    description: 'Analyze current deals and forecast for Q2',
    dueDate: '2023-06-28',
    completed: false,
    priority: 'medium',
    assignedTo: 'You',
    assignedToAvatar: '',
    relatedTo: null,
    createdAt: '2023-06-09',
  },
  {
    id: '7',
    title: 'Call Amanda about Cloud Migration requirements',
    description: 'Discuss technical requirements for the migration project',
    dueDate: '2023-06-19',
    completed: false,
    priority: 'high',
    assignedTo: 'You',
    assignedToAvatar: '',
    relatedTo: {
      type: 'contact',
      name: 'Amanda Lee',
      id: '7',
    },
    createdAt: '2023-06-15',
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  
  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  // Filter tasks based on search query, selected date, and active tab
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.relatedTo?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // Date filter
    const matchesDate = selectedDate 
      ? task.dueDate === format(selectedDate, 'yyyy-MM-dd')
      : true;
    
    // Tab filter
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'today' ? task.dueDate === format(new Date(), 'yyyy-MM-dd') :
      activeTab === 'upcoming' ? new Date(task.dueDate) > new Date() && !task.completed :
      activeTab === 'completed' ? task.completed :
      activeTab === 'assigned' ? task.assignedTo === 'You' && !task.completed :
      true;
    
    return matchesSearch && matchesDate && matchesTab;
  });
  
  // Sort tasks by due date and priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First sort by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by due date
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Then sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get related entity icon
  const getRelatedIcon = (type: 'contact' | 'deal' | 'company') => {
    switch (type) {
      case 'contact':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'deal':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'company':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 21V7L13 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 21V11L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 17H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks and follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Task
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Tabs and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs 
          defaultValue="all" 
          className="w-full md:w-auto"
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <Input
              type="text"
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} tasks found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedTasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-start p-4 rounded-lg border hover:bg-accent/50 transition-colors ${task.completed ? 'opacity-60' : ''}`}
              >
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={new Date(task.dueDate) < new Date() && !task.completed ? 'border-red-500 text-red-500' : ''}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {task.description}
                  </p>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mt-3">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={task.assignedToAvatar} alt={task.assignedTo} />
                        <AvatarFallback className="text-xs">{getInitials(task.assignedTo)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">Assigned to {task.assignedTo}</span>
                    </div>
                    
                    {task.relatedTo && (
                      <div className="flex items-center">
                        <div className="h-6 w-6 mr-2 flex items-center justify-center text-muted-foreground">
                          {getRelatedIcon(task.relatedTo.type)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Related to {task.relatedTo.type}: {task.relatedTo.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium">No tasks found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <Button className="mt-4" variant="outline">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Create a new task
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 