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
  TrendingUp, 
  Clock, 
  UserPlus,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import apiClient from '@/lib/api/client';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import CampaignAnalyticsOverview from '@/components/dashboard/CampaignAnalyticsOverview';
import { toast } from '@/components/ui/use-toast';
import { USE_MOCK_DATA } from '@/lib/config';

// Dashboard stats type
type DashboardStats = {
  total_leads: number;
  new_leads_today: number;
  active_campaigns: number;
  pending_tasks: number;
  upcoming_meetings: number;
  recent_communications: number;
  conversion_rate: number;
  lead_sources: { [key: string]: number };
};

// Recent activity type
type Activity = {
  id: string;
  type: 'lead' | 'task' | 'meeting' | 'communication' | 'campaign';
  title: string;
  description: string;
  timestamp: string;
  user: string;
};

// Mock data for dashboard
const mockDashboardStats: DashboardStats = {
  total_leads: 256,
  new_leads_today: 12,
  active_campaigns: 5,
  pending_tasks: 18,
  upcoming_meetings: 7,
  recent_communications: 34,
  conversion_rate: 24.5,
  lead_sources: {
    'Website': 45,
    'Referral': 30,
    'Social Media': 15,
    'Email Campaign': 10
  }
};

const mockRecentActivity: Activity[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New Lead Added',
    description: 'John Smith from Acme Corp was added as a new lead',
    timestamp: new Date().toISOString(),
    user: 'Sarah Johnson'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task Completed',
    description: 'Follow-up call with Techno Solutions completed',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    user: 'Mike Wilson'
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Meeting Scheduled',
    description: 'Demo meeting with Global Enterprises scheduled for tomorrow',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    user: 'Emily Davis'
  },
  {
    id: '4',
    type: 'communication',
    title: 'Email Sent',
    description: 'Proposal sent to Innovative Systems',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), // 5 hours ago
    user: 'Sarah Johnson'
  },
  {
    id: '5',
    type: 'campaign',
    title: 'Campaign Started',
    description: 'Summer Promotion campaign launched',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
    user: 'Alex Turner'
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Get user name from local storage if available
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('strike_app_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserName(user.name || user.email.split('@')[0]);
      }
    }

    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        if (USE_MOCK_DATA) {
          // Use mock data
          setStats(mockDashboardStats);
          setRecentActivities(mockRecentActivity);
        } else {
          // Use API data
          const statsResponse = await apiClient.get<DashboardStats>('/api/dashboard/stats');
          const activityResponse = await apiClient.get<Activity[]>('/api/dashboard/activity');
          
          if (statsResponse.error) {
            console.error('Error fetching dashboard stats:', statsResponse.error);
            toast({
              title: 'Error',
              description: 'Failed to load dashboard statistics',
              variant: 'destructive',
            });
          } else {
            setStats(statsResponse.data);
          }
          
          if (activityResponse.error) {
            console.error('Error fetching recent activity:', activityResponse.error);
            toast({
              title: 'Error',
              description: 'Failed to load recent activity',
              variant: 'destructive',
            });
          } else {
            setRecentActivities(activityResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to get icon for activity type
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lead': return <UserPlus className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'campaign': return <Megaphone className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {userName ? `Welcome back, ${userName}!` : 'Welcome back!'} Here's an overview of your CRM activity.
              {typeof window !== 'undefined' && (() => {
                const userStr = localStorage.getItem('strike_app_user');
                if (userStr) {
                  try {
                    const user = JSON.parse(userStr);
                    if (user.usingTempAuth) {
                      return (
                        <span className="block text-xs mt-1 text-amber-500">
                          Note: You're using the temporary authentication system. Some features may be limited.
                        </span>
                      );
                    }
                  } catch (e) {
                    // Ignore JSON parse errors
                  }
                }
                return null;
              })()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/leads/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Lead
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/campaigns/new">
                <Megaphone className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <DashboardCards />

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">CRM Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_leads || '—'}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500 font-medium">{stats?.new_leads_today || 0} new today</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_campaigns || '—'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Running campaigns</div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pending_tasks || '—'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Requiring attention</div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.conversion_rate || '—'}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Lead to customer</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2 hover-lift">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions across your CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="animate-pulse-subtle">Loading recent activities...</div>
                      </div>
                    ) : (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs">by {activity.user}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/dashboard/activities">
                      View All Activities
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="hover-lift">
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

                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>Upcoming Meetings</CardTitle>
                    <CardDescription>Your schedule for today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-20">
                        <div className="animate-pulse-subtle">Loading meetings...</div>
                      </div>
                    ) : stats?.upcoming_meetings ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Product Demo</p>
                            <p className="text-xs text-muted-foreground">2:00 PM with Acme Corp</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Follow-up Call</p>
                            <p className="text-xs text-muted-foreground">4:30 PM with TechSolutions</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No meetings scheduled for today
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/dashboard/meetings">
                        View Calendar
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Campaign Analytics</h2>
              <Button asChild>
                <Link href="/dashboard/campaigns">
                  View All Campaigns
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <CampaignAnalyticsOverview />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 