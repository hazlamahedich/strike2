'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Megaphone, 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  ArrowUpRight, 
  Clock, 
  UserPlus,
  Mail,
  Phone,
  AlertCircle,
  CalendarClock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MockFeatureDemo } from "@/components/MockFeatureDemo";
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

// Mock data for recent activities
const recentActivities = [
  {
    id: '1',
    type: 'lead' as const,
    title: 'New Lead Added',
    description: 'John Smith from Acme Corp was added as a new lead',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    user: {
      name: 'Sarah Johnson',
      avatar: '',
      initials: 'SJ'
    }
  },
  {
    id: '2',
    type: 'task' as const,
    title: 'Task Completed',
    description: 'Follow-up call with Techno Solutions completed',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    user: {
      name: 'Mike Wilson',
      avatar: '',
      initials: 'MW'
    }
  },
  {
    id: '3',
    type: 'meeting' as const,
    title: 'Meeting Scheduled',
    description: 'Demo meeting with Global Enterprises scheduled for tomorrow',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    user: {
      name: 'Emily Davis',
      avatar: '',
      initials: 'ED'
    }
  },
  {
    id: '4',
    type: 'communication' as const,
    title: 'Email Sent',
    description: 'Proposal sent to Innovative Systems',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), // 1 day ago
    user: {
      name: 'Sarah Johnson',
      avatar: '',
      initials: 'SJ'
    }
  },
  {
    id: '5',
    type: 'campaign' as const,
    title: 'Campaign Started',
    description: 'Summer Promotion campaign launched',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    user: {
      name: 'Alex Turner',
      avatar: '',
      initials: 'AT'
    }
  }
];

// Mock data for tasks
const mockTasksData = {
  overdueTasks: 5,
  dueTodayTasks: 3
};

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [tasksData, setTasksData] = useState(mockTasksData);

  useEffect(() => {
    // Get user name from local storage if available
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('strike_app_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserName(user.name || user.email.split('@')[0]);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {userName ? `Welcome back, ${userName}!` : 'Welcome back!'} Here's an overview of your CRM activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/leads/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/tasks/new">
              <CheckSquare className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Cards - First Row */}
        <DashboardCard
          title="Overdue Tasks"
          description="Tasks that require immediate attention"
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          value={tasksData.overdueTasks.toString()}
          variant="destructive"
          hover="scale"
        >
          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link href="/dashboard/tasks?filter=overdue">
                <span>View Overdue Tasks</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DashboardCard>
        
        <DashboardCard
          title="Due Today"
          description="Tasks scheduled for completion today"
          icon={<CalendarClock className="h-5 w-5 text-amber-500" />}
          value={tasksData.dueTodayTasks.toString()}
          variant="warning"
          hover="scale"
        >
          <div className="mt-4">
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link href="/dashboard/tasks?filter=today">
                <span>View Today's Tasks</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DashboardCard>
        
        {/* Team Performance Card */}
        <DashboardCard
          title="Team Performance"
          description="Top performers this month"
          variant="gradient"
          hover="scale"
          className="lg:col-span-2"
        >
          <div className="mt-4 space-y-3">
            {[
              { name: 'Sarah Johnson', value: 24, avatar: '', initials: 'SJ' },
              { name: 'Mike Wilson', value: 18, avatar: '', initials: 'MW' },
              { name: 'Emily Davis', value: 15, avatar: '', initials: 'ED' },
            ].map((person, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {person.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${(person.value / 24) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm font-medium">{person.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/dashboard/team">
                <span>View Team</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DashboardCard>
        
        {/* Second Row */}
        {/* Recent Activity */}
        <div className="lg:col-span-3">
          <ActivityFeed activities={recentActivities} />
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/leads/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New Lead
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/tasks/new">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Create Task
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/meetings/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/communications/email">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/communications/call">
                  <Phone className="mr-2 h-4 w-4" />
                  Log Call
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mock Feature Demo */}
      <MockFeatureDemo />
    </div>
  );
} 