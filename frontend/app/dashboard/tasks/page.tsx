'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckSquare, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  Plus,
  User,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/api/client';

// Task type definition
type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assigned_to: string | null;
  related_to: {
    type: 'lead' | 'campaign' | 'meeting' | null;
    id: string | null;
    name: string | null;
  };
  created_at: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    related_to: {
      type: null,
      id: null,
      name: null
    }
  });

  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        // For now, using mock data until API is ready
        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Follow up with John Smith',
            description: 'Send product information and pricing details',
            status: 'pending',
            priority: 'high',
            due_date: '2023-06-05T00:00:00Z',
            assigned_to: 'Sarah Johnson',
            related_to: {
              type: 'lead',
              id: '1',
              name: 'John Smith'
            },
            created_at: '2023-05-30T10:30:00Z',
          },
          {
            id: '2',
            title: 'Prepare campaign materials',
            description: 'Create email templates and social media posts for summer promotion',
            status: 'in_progress',
            priority: 'medium',
            due_date: '2023-06-10T00:00:00Z',
            assigned_to: 'Michael Brown',
            related_to: {
              type: 'campaign',
              id: '1',
              name: 'Summer Promotion'
            },
            created_at: '2023-05-28T14:20:00Z',
          },
          {
            id: '3',
            title: 'Schedule demo with Tech Solutions',
            description: 'Coordinate with sales team for product demonstration',
            status: 'completed',
            priority: 'medium',
            due_date: '2023-05-25T00:00:00Z',
            assigned_to: 'David Wilson',
            related_to: {
              type: 'lead',
              id: '3',
              name: 'Tech Solutions'
            },
            created_at: '2023-05-20T11:45:00Z',
          },
          {
            id: '4',
            title: 'Update CRM data',
            description: 'Clean up lead database and update contact information',
            status: 'overdue',
            priority: 'low',
            due_date: '2023-05-30T00:00:00Z',
            assigned_to: 'Emily Davis',
            related_to: {
              type: null,
              id: null,
              name: null
            },
            created_at: '2023-05-15T09:00:00Z',
          },
          {
            id: '5',
            title: 'Quarterly review meeting',
            description: 'Prepare presentation for quarterly performance review',
            status: 'pending',
            priority: 'high',
            due_date: '2023-06-15T00:00:00Z',
            assigned_to: 'Sarah Johnson',
            related_to: {
              type: 'meeting',
              id: '2',
              name: 'Quarterly Review'
            },
            created_at: '2023-05-25T15:10:00Z',
          }
        ];
        
        setTasks(mockTasks);
        setIsLoading(false);
        
        // Uncomment when API is ready
        // const response = await apiClient.get<Task[]>('tasks');
        // setTasks(response);
        // setIsLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter tasks based on search query, status filter, and priority filter
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assigned_to && task.assigned_to.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.related_to.name && task.related_to.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === null || task.status === statusFilter;
    const matchesPriority = priorityFilter === null || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Handle adding a new task
  const handleAddTask = async () => {
    try {
      // For now, just adding to local state
      // In production, would send to API first
      const newTaskWithId: Task = {
        ...newTask,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        status: newTask.status as Task['status'],
        priority: newTask.priority as Task['priority'],
        related_to: {
          type: newTask.related_to.type as Task['related_to']['type'],
          id: newTask.related_to.id,
          name: newTask.related_to.name
        }
      };
      
      setTasks([newTaskWithId, ...tasks]);
      setShowAddTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        related_to: {
          type: null,
          id: null,
          name: null
        }
      });
      
      // Uncomment when API is ready
      // await apiClient.post('tasks', newTask);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get status icon
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Enter the details of the new task. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Follow up with client"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Details about the task..."
                    rows={3}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newTask.status} 
                    onValueChange={(value) => setNewTask({...newTask, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask({...newTask, priority: value})}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                    placeholder="Team member name"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTaskDialog(false)}>Cancel</Button>
              <Button onClick={handleAddTask}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by priority" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                <TableHead className="hidden lg:table-cell">Related To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No tasks found. Try adjusting your search or add a new task.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {getStatusIcon(task.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`mr-2 h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`}></span>
                        <span className="capitalize">
                          {task.priority}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={task.status === 'overdue' ? 'text-red-500' : ''}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{task.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {task.related_to.name ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground capitalize">{task.related_to.type}:</span>
                          <span>{task.related_to.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Mark as Complete">
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit Task</DropdownMenuItem>
                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                            <DropdownMenuItem>Reassign</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Task</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 