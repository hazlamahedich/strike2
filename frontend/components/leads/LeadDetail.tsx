import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  Tag, 
  Clock, 
  FileText, 
  MessageSquare, 
  Activity, 
  BarChart, 
  Trash 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LeadDetail as LeadDetailType, LeadSource, LeadStatus } from '../../lib/types/lead';
import { useLead, useLeadTimeline, useLeadInsights } from '../../lib/hooks/useLeads';
import EmailDialog from '../communications/EmailDialog';

interface LeadDetailProps {
  leadId: number;
  onEdit: () => void;
  onDelete: () => void;
  onSendEmail: () => void;
  onCall: () => void;
  onScheduleMeeting: () => void;
  onAddToCampaign: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({
  leadId,
  onEdit,
  onDelete,
  onSendEmail,
  onCall,
  onScheduleMeeting,
  onAddToCampaign,
  onAddNote,
  onAddTask,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Fetch lead data
  const { data: lead, isLoading, isError } = useLead(leadId);
  
  // Fetch lead timeline
  const { data: timeline } = useLeadTimeline(leadId);
  
  // Fetch lead insights
  const { data: insights } = useLeadInsights(leadId);
  
  // Get status badge color
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800';
      case LeadStatus.WON:
        return 'bg-green-100 text-green-800';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get source badge color
  const getSourceColor = (source: LeadSource) => {
    switch (source) {
      case LeadSource.WEBSITE:
        return 'bg-indigo-100 text-indigo-800';
      case LeadSource.REFERRAL:
        return 'bg-green-100 text-green-800';
      case LeadSource.LINKEDIN:
        return 'bg-blue-100 text-blue-800';
      case LeadSource.COLD_CALL:
        return 'bg-gray-100 text-gray-800';
      case LeadSource.EMAIL_CAMPAIGN:
        return 'bg-yellow-100 text-yellow-800';
      case LeadSource.EVENT:
        return 'bg-purple-100 text-purple-800';
      case LeadSource.OTHER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  const handleSendEmail = () => {
    setShowEmailDialog(true);
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading lead details...</div>;
  }
  
  if (isError || !lead) {
    return <div className="flex justify-center p-8 text-red-500">Error loading lead details. Please try again.</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{lead.full_name}</h1>
          {lead.title && lead.company && (
            <p className="text-muted-foreground">
              {lead.title} at {lead.company}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge className={getSourceColor(lead.source)}>
              {lead.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, lead.lead_score * 10))}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold">{lead.lead_score.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(lead.created_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(lead.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {lead.owner ? (
                <span>{lead.owner.name}</span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" /> Send Email
        </Button>
        <Button onClick={onCall}>
          <Phone className="mr-2 h-4 w-4" /> Call
        </Button>
        <Button onClick={onScheduleMeeting}>
          <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
        <Button onClick={onAddToCampaign}>
          <Tag className="mr-2 h-4 w-4" /> Add to Campaign
        </Button>
        <Button variant="outline" onClick={onAddNote}>
          <MessageSquare className="mr-2 h-4 w-4" /> Add Note
        </Button>
        <Button variant="outline" onClick={onAddTask}>
          <FileText className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{lead.email || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                <p>{lead.phone || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                <p>{lead.company || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Job Title</h3>
                <p>{lead.title || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          
          {Object.keys(lead.custom_fields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(lead.custom_fields).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </h3>
                    <p>{value?.toString() || 'N/A'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities && lead.activities.length > 0 ? (
                <div className="space-y-4">
                  {lead.activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>All interactions with this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.timestamp)}</p>
                        {event.details && <p className="mt-1">{event.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No timeline events</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Tasks related to this lead</CardDescription>
              </div>
              <Button size="sm" onClick={onAddTask}>
                <FileText className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {lead.tasks && lead.tasks.length > 0 ? (
                <div className="space-y-4">
                  {lead.tasks.map((task, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-orange-500'} mt-2`}></div>
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {formatDate(task.due_date)}</p>
                        {task.description && <p className="mt-1">{task.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No tasks</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>Campaigns this lead is part of</CardDescription>
              </div>
              <Button size="sm" onClick={onAddToCampaign}>
                <Tag className="mr-2 h-4 w-4" /> Add to Campaign
              </Button>
            </CardHeader>
            <CardContent>
              {lead.campaigns && lead.campaigns.length > 0 ? (
                <div className="space-y-4">
                  {lead.campaigns.map((campaign, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge>{campaign.status}</Badge>
                          <span className="text-sm text-muted-foreground">Added: {formatDate(campaign.added_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Not part of any campaigns</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>AI-powered insights about this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {insights ? (
                <div className="space-y-4">
                  {insights.score_factors && (
                    <div>
                      <h3 className="font-medium mb-2">Lead Score Factors</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {insights.score_factors.map((factor: string, index: number) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.recommendations && (
                    <div>
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {insights.recommendations.map((recommendation: string, index: number) => (
                          <li key={index}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.conversion_probability !== undefined && (
                    <div>
                      <h3 className="font-medium mb-2">Conversion Probability</h3>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, Math.max(0, insights.conversion_probability * 100))}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{(insights.conversion_probability * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No insights available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {lead && (
        <EmailDialog
          isOpen={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          lead={lead}
        />
      )}
    </div>
  );
};

export default LeadDetail; 