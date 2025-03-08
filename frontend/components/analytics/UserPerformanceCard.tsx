import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { UserPerformance } from '@/lib/hooks/useAnalytics';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface UserPerformanceCardProps {
  data?: UserPerformance;
  isLoading?: boolean;
  className?: string;
}

const UserPerformanceCard: React.FC<UserPerformanceCardProps> = ({
  data,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>User Performance</CardTitle>
          <CardDescription>Loading user performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>User Performance</CardTitle>
          <CardDescription>No user performance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User performance data is not available at this time. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format data for the performance trend chart
  const formatPerformanceTrendData = () => {
    return data.timeSeriesData.map(item => ({
      date: item.date,
      'Average Performance': item.averagePerformance,
      'Top Performer': item.topPerformerScore,
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          User Performance
        </CardTitle>
        <CardDescription>Performance metrics for your team members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Avg. Leads Per User</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{data.teamMetrics.averageLeadsPerUser}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Avg. Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{data.teamMetrics.averageConversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{data.teamMetrics.averageResponseTime.toFixed(1)} hrs</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Avg. Activities Completed</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{data.teamMetrics.averageActivitiesCompleted}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formatPerformanceTrendData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Average Performance"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="Top Performer"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Team Members</h3>
        <div className="space-y-6">
          {data.users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-lg font-semibold">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                      <div className="flex items-center mt-1">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                          Performance Score: {user.performance.current}
                        </Badge>
                        <span className={`ml-2 text-xs flex items-center ${user.performance.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {user.performance.trend > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(user.performance.trend).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 md:mt-0">
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        Leads
                      </div>
                      <p className="font-medium">{user.metrics.leadsManaged}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Conversion
                      </div>
                      <p className="font-medium">{user.metrics.leadConversionRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4 mr-1" />
                        Response Time
                      </div>
                      <p className="font-medium">{user.metrics.responseTime.toFixed(1)} hrs</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Meetings
                      </div>
                      <p className="font-medium">{user.metrics.meetingsCompleted}/{user.metrics.meetingsScheduled}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Activities</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span>{user.metrics.activitiesCompleted} completed</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                        <span>{user.metrics.activitiesOverdue} overdue</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Recent Activity</h5>
                    <div className="space-y-2">
                      {user.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                              {activity.type}
                            </Badge>
                            <span className="text-sm">{activity.title}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground mr-2">
                              {new Date(activity.date).toLocaleDateString()}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={
                                activity.status === 'Completed' 
                                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none' 
                                  : activity.status === 'Scheduled' 
                                  ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none'
                                  : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none'
                              }
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPerformanceCard; 