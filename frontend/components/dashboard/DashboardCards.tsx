import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  Calendar, 
  Mail, 
  PhoneMissed,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

// Task type definition
type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assigned_to: string | null;
};

// Meeting type definition
type Meeting = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
};

// Email type definition
type Email = {
  id: string;
  from: string;
  subject: string;
  received_at: string;
  read: boolean;
};

// Call type definition
type Call = {
  id: number;
  caller_number: string;
  call_time: string;
  status: 'missed';
  contact?: {
    id: number;
    name: string;
  };
};

export function DashboardCards() {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [tasksDueToday, setTasksDueToday] = useState<Task[]>([]);
  const [meetingsToday, setMeetingsToday] = useState<Meeting[]>([]);
  const [newEmails, setNewEmails] = useState<Email[]>([]);
  const [missedCalls, setMissedCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, these would be API calls
        // For now, we'll use mock data
        
        // Mock overdue tasks
        const mockOverdueTasks: Task[] = [
          {
            id: '1',
            title: 'Follow up with John Smith',
            description: 'Send product information and pricing details',
            status: 'overdue',
            priority: 'high',
            due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            assigned_to: 'Current User',
          },
          {
            id: '2',
            title: 'Update CRM data',
            description: 'Clean up lead database and update contact information',
            status: 'overdue',
            priority: 'medium',
            due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            assigned_to: 'Current User',
          },
        ];
        
        // Mock tasks due today
        const mockTasksDueToday: Task[] = [
          {
            id: '3',
            title: 'Prepare for client meeting',
            description: 'Review notes and prepare presentation',
            status: 'pending',
            priority: 'high',
            due_date: new Date().toISOString(),
            assigned_to: 'Current User',
          },
          {
            id: '4',
            title: 'Send proposal to Tech Solutions',
            description: 'Finalize and send the proposal document',
            status: 'in_progress',
            priority: 'high',
            due_date: new Date().toISOString(),
            assigned_to: 'Current User',
          },
        ];
        
        // Mock meetings today
        const mockMeetingsToday: Meeting[] = [
          {
            id: 1,
            title: 'Initial Client Meeting',
            description: 'Discuss project requirements and timeline',
            start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
            end_time: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
            location: 'Zoom Meeting',
          },
          {
            id: 2,
            title: 'Quick Check-in',
            description: 'Brief status update',
            start_time: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
            end_time: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
            location: 'Phone Call',
          },
        ];
        
        // Mock new emails
        const mockNewEmails: Email[] = [
          {
            id: '1',
            from: 'john.doe@example.com',
            subject: 'Proposal for New Project',
            received_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            read: false,
          },
          {
            id: '2',
            from: 'marketing@newsletter.com',
            subject: 'Weekly Industry Updates',
            received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            read: false,
          },
          {
            id: '3',
            from: 'support@saasplatform.com',
            subject: 'Your Subscription Renewal',
            received_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            read: false,
          },
          {
            id: '4',
            from: 'sarah.johnson@partner.org',
            subject: 'Partnership Opportunity',
            received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            read: false,
          },
          {
            id: '5',
            from: 'events@conference.com',
            subject: 'Invitation: Industry Conference 2023',
            received_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            read: false,
          },
        ];
        
        // Mock missed calls
        const mockMissedCalls: Call[] = [
          {
            id: 1,
            caller_number: '+1122334455',
            call_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            status: 'missed',
            contact: {
              id: 1,
              name: 'Bob Johnson',
            },
          },
          {
            id: 2,
            caller_number: '+5544332211',
            call_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            status: 'missed',
            contact: {
              id: 2,
              name: 'Jane Smith',
            },
          },
        ];
        
        setOverdueTasks(mockOverdueTasks);
        setTasksDueToday(mockTasksDueToday);
        setMeetingsToday(mockMeetingsToday);
        setNewEmails(mockNewEmails);
        setMissedCalls(mockMissedCalls);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Overdue Tasks Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard/tasks" className="block">
              <Card className="hover-lift cursor-pointer hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <CheckSquare className="mr-2 h-4 w-4 text-red-500" />
                    Overdue Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overdueTasks.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Requiring immediate attention
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="w-80 p-0">
            <div className="bg-card rounded-md shadow-lg border">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Overdue Tasks</h3>
              </div>
              <div className="p-2 max-h-60 overflow-auto">
                {overdueTasks.length > 0 ? (
                  <div className="space-y-2">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="p-2 hover:bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <CheckSquare className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(task.due_date!), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">No overdue tasks</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Tasks Due Today Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard/tasks" className="block">
              <Card className="hover-lift cursor-pointer hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <CheckSquare className="mr-2 h-4 w-4 text-amber-500" />
                    Tasks Due Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tasksDueToday.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Scheduled for today
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="w-80 p-0">
            <div className="bg-card rounded-md shadow-lg border">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Tasks Due Today</h3>
              </div>
              <div className="p-2 max-h-60 overflow-auto">
                {tasksDueToday.length > 0 ? (
                  <div className="space-y-2">
                    {tasksDueToday.map(task => (
                      <div key={task.id} className="p-2 hover:bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <CheckSquare className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">No tasks due today</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Scheduled Meetings Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard/meetings" className="block">
              <Card className="hover-lift cursor-pointer hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    Meetings Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{meetingsToday.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Scheduled for today
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="w-80 p-0">
            <div className="bg-card rounded-md shadow-lg border">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Today's Meetings</h3>
              </div>
              <div className="p-2 max-h-60 overflow-auto">
                {meetingsToday.length > 0 ? (
                  <div className="space-y-2">
                    {meetingsToday.map(meeting => (
                      <div key={meeting.id} className="p-2 hover:bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {meeting.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">No meetings scheduled for today</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* New Emails Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/communications/inbox" className="block">
              <Card className="hover-lift cursor-pointer hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-green-500" />
                    New Emails
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{newEmails.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Unread messages
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="w-80 p-0">
            <div className="bg-card rounded-md shadow-lg border">
              <div className="p-3 border-b">
                <h3 className="font-semibold">New Emails</h3>
              </div>
              <div className="p-2 max-h-60 overflow-auto">
                {newEmails.length > 0 ? (
                  <div className="space-y-2">
                    {newEmails.slice(0, 5).map(email => (
                      <div key={email.id} className="p-2 hover:bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              From: {email.from}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(email.received_at), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">No new emails</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Missed Calls Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/communications/calls" className="block">
              <Card className="hover-lift cursor-pointer hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <PhoneMissed className="mr-2 h-4 w-4 text-red-500" />
                    Missed Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{missedCalls.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Calls to follow up on
                  </div>
                </CardContent>
              </Card>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="w-80 p-0">
            <div className="bg-card rounded-md shadow-lg border">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Missed Calls Today</h3>
              </div>
              <div className="p-2 max-h-60 overflow-auto">
                {missedCalls.length > 0 ? (
                  <div className="space-y-2">
                    {missedCalls.map(call => (
                      <div key={call.id} className="p-2 hover:bg-muted rounded-md">
                        <div className="flex items-start gap-2">
                          <PhoneMissed className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">
                              {call.contact ? call.contact.name : call.caller_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(call.call_time), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4 text-muted-foreground">No missed calls today</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 