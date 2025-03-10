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
  Trash,
  Linkedin,
  Facebook,
  Twitter,
  CheckSquare,
  Circle,
  User as UserIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LeadDetail as LeadDetailType, LeadSource, LeadStatus } from '../../lib/types/lead';
import { useLead, useLeadTimeline, useLeadInsights } from '../../lib/hooks/useLeads';
import { EmailDialog } from '../communications/EmailDialog';
import { PhoneDialog } from '../communications/PhoneDialog';
import CompanyAnalysis from './CompanyAnalysis';

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
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [selectedTimelineFilters, setSelectedTimelineFilters] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showDebugInfo, setShowDebugInfo] = useState(false); // For debugging purposes
  
  // Fetch lead data
  const { data: lead, isLoading, isError } = useLead(leadId);
  
  // Debug lead data
  console.log('Lead data:', lead);
  console.log('Campaigns data:', lead?.campaigns);
  
  // Fetch lead timeline
  const { data: timeline } = useLeadTimeline(leadId, 20, selectedTimelineFilters.length > 0 ? selectedTimelineFilters : undefined);
  
  // Fetch lead insights
  const { data: insights } = useLeadInsights(leadId);
  
  // Get status badge color
  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case LeadStatus.CONTACTED:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case LeadStatus.QUALIFIED:
        return 'bg-green-100 text-green-800 border-green-300';
      case LeadStatus.PROPOSAL:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case LeadStatus.NEGOTIATION:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case LeadStatus.WON:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case LeadStatus.LOST:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Get source badge color
  const getSourceColor = (source: LeadSource) => {
    switch (source) {
      case LeadSource.WEBSITE:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case LeadSource.REFERRAL:
        return 'bg-green-100 text-green-800 border-green-300';
      case LeadSource.LINKEDIN:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case LeadSource.COLD_CALL:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case LeadSource.EMAIL_CAMPAIGN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case LeadSource.EVENT:
        return 'bg-pink-100 text-pink-800 border-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
  
  const handleCall = () => {
    setShowPhoneDialog(true);
  };
  
  // Toggle expanded view for timeline items
  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Get icon for timeline item type
  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'note':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-red-500" />;
      case 'activity':
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };
  
  // Get title for timeline item
  const getTimelineTitle = (event: any) => {
    switch (event.type) {
      case 'email':
        return `Email: ${event.data.subject || 'No subject'}`;
      case 'call':
        return `Call: ${event.subtype} (${event.data.duration || 0} seconds)`;
      case 'sms':
        return `SMS: ${event.subtype}`;
      case 'meeting':
        return `Meeting: ${event.data.title || 'Untitled'}`;
      case 'note':
        return 'Note added';
      case 'task':
        return `Task: ${event.data.title || 'Untitled'} (${event.subtype})`;
      case 'activity':
        return `Activity: ${event.subtype.replace(/_/g, ' ')}`;
      default:
        return 'Interaction';
    }
  };
  
  // Timeline filter options
  const timelineFilterOptions = [
    { value: 'email', label: 'Emails' },
    { value: 'call', label: 'Calls' },
    { value: 'sms', label: 'SMS' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'note', label: 'Notes' },
    { value: 'task', label: 'Tasks' },
    { value: 'activity', label: 'Activities' }
  ];
  
  // Handle timeline filter change
  const handleTimelineFilterChange = (value: string) => {
    setSelectedTimelineFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading lead details...</div>;
  }
  
  if (isError || !lead) {
    return <div className="flex justify-center p-8 text-red-500">Error loading lead details. Please try again.</div>;
  }
  
  // Ensure we have consistent field names regardless of Supabase schema
  const leadData = {
    ...lead,
    // Handle potential field name differences between API and Supabase
    full_name: lead.full_name || `${lead.first_name} ${lead.last_name}`,
    company: lead.company || lead.company_name,
    title: lead.title || lead.job_title,
    // Ensure these fields exist with default values if missing
    lead_score: lead.lead_score || 0,
    conversion_probability: lead.conversion_probability || 0,
    tasks: lead.tasks || [],
    notes: lead.notes || [],
    campaigns: lead.campaigns || [],
    activities: lead.activities || [],
    custom_fields: lead.custom_fields || {}
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{leadData.full_name}</h1>
          {leadData.title && leadData.company && (
            <p className="text-muted-foreground">
              {leadData.title} at {leadData.company}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge className={getStatusColor(leadData.status)}>
              {leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1)}
            </Badge>
            <Badge className={getSourceColor(leadData.source)}>
              {leadData.source.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                  style={{ width: `${Math.min(100, Math.max(0, leadData.lead_score * 10))}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold">{leadData.lead_score.toFixed(1)}</span>
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
              <span>{formatDate(leadData.created_at)}</span>
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
              <span>{formatDate(leadData.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {leadData.owner ? (
                <span>{leadData.owner.name}</span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Social Media Profiles */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Social Media Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {leadData.linkedin_url ? (
              <a 
                href={leadData.linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Linkedin className="mr-2 h-5 w-5" />
                LinkedIn Profile
              </a>
            ) : (
              <span className="flex items-center text-muted-foreground">
                <Linkedin className="mr-2 h-5 w-5" />
                No LinkedIn Profile
              </span>
            )}
            
            {leadData.facebook_url ? (
              <a 
                href={leadData.facebook_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Facebook className="mr-2 h-5 w-5" />
                Facebook Profile
              </a>
            ) : (
              <span className="flex items-center text-muted-foreground">
                <Facebook className="mr-2 h-5 w-5" />
                No Facebook Profile
              </span>
            )}
            
            {leadData.twitter_url ? (
              <a 
                href={leadData.twitter_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                <Twitter className="mr-2 h-5 w-5" />
                Twitter Profile
              </a>
            ) : (
              <span className="flex items-center text-muted-foreground">
                <Twitter className="mr-2 h-5 w-5" />
                No Twitter Profile
              </span>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" /> Send Email
        </Button>
        <Button onClick={handleCall}>
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
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="company-analysis">Company Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p>{leadData.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                {leadData.phone ? (
                  <button 
                    onClick={handleCall}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    {leadData.phone}
                  </button>
                ) : (
                  <p>N/A</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                <p>{leadData.company || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Job Title</h3>
                <p>{leadData.title || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          
          {Object.keys(leadData.custom_fields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(leadData.custom_fields).map(([key, value]) => (
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
              {leadData.activities && leadData.activities.length > 0 ? (
                <div className="space-y-4">
                  {leadData.activities.slice(0, 5).map((activity, index) => (
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
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>All interactions with this lead</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                {timelineFilterOptions.map(option => (
                  <Badge 
                    key={option.value}
                    variant={selectedTimelineFilters.includes(option.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTimelineFilterChange(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
                {selectedTimelineFilters.length > 0 && (
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSelectedTimelineFilters([])}
                  >
                    Clear filters
                  </Badge>
                )}
              </div>
              
              {timeline && timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="mt-1">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{getTimelineTitle(event)}</p>
                          {event.has_expanded_view && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => toggleExpanded(index)}
                              className="h-6 px-2"
                            >
                              {expandedItems[index] ? 'Show less' : 'Show more'}
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(event.timestamp)}</span>
                          
                          {event.user && (
                            <>
                              <span className="mx-1">•</span>
                              <UserIcon className="h-3 w-3" />
                              <span>{event.user.name}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Content preview or full content */}
                        <div className="mt-2">
                          {event.type === 'email' && (
                            <>
                              <p className="text-sm font-medium">Subject: {event.data.subject}</p>
                              <p className="text-sm mt-1">
                                {expandedItems[index] ? event.full_content : event.data.body_preview}
                              </p>
                            </>
                          )}
                          
                          {event.type === 'call' && (
                            <>
                              <p className="text-sm">Duration: {event.data.duration} seconds</p>
                              {event.data.notes && (
                                <p className="text-sm mt-1">
                                  Notes: {expandedItems[index] ? event.full_content : event.data.notes}
                                </p>
                              )}
                            </>
                          )}
                          
                          {event.type === 'sms' && (
                            <p className="text-sm">
                              {expandedItems[index] ? event.full_content : event.data.body_preview}
                            </p>
                          )}
                          
                          {event.type === 'meeting' && (
                            <>
                              <p className="text-sm">Location: {event.data.location}</p>
                              {event.data.description && (
                                <p className="text-sm mt-1">
                                  {expandedItems[index] ? event.full_content : event.data.description}
                                </p>
                              )}
                            </>
                          )}
                          
                          {event.type === 'note' && (
                            <p className="text-sm">
                              {expandedItems[index] ? event.full_content : event.data.body}
                            </p>
                          )}
                          
                          {event.type === 'task' && (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{event.data.title}</p>
                                <Badge variant={event.subtype === 'completed' ? 'success' : 'secondary'}>
                                  {event.subtype}
                                </Badge>
                              </div>
                              {event.data.description && (
                                <p className="text-sm mt-1">
                                  {expandedItems[index] ? event.full_content : event.data.description}
                                </p>
                              )}
                            </>
                          )}
                          
                          {event.type === 'activity' && (
                            <div>
                              {Object.entries(event.data).map(([key, value]) => (
                                <p key={key} className="text-sm">
                                  <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
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
              {leadData.tasks && leadData.tasks.length > 0 ? (
                <div className="space-y-4">
                  {leadData.tasks.map((task, index) => (
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
              <div className="flex gap-2">
                <Button size="sm" onClick={onAddToCampaign}>
                  <Tag className="mr-2 h-4 w-4" /> Add to Campaign
                </Button>
                {/* Debug button - only visible in development */}
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                  >
                    {showDebugInfo ? 'Hide Debug' : 'Debug'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Debug information */}
              {showDebugInfo && leadData.campaigns && (
                <div className="mb-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
                  <h4 className="font-medium mb-2">Raw Campaign Data:</h4>
                  <pre className="text-xs">
                    {JSON.stringify(leadData.campaigns, null, 2)}
                  </pre>
                </div>
              )}
              
              {leadData.campaigns && leadData.campaigns.length > 0 ? (
                <div className="space-y-6">
                  {leadData.campaigns.map((campaignData, index) => {
                    // Simple fallback for when the data is just a string or simple object
                    if (typeof campaignData === 'string' || (typeof campaignData === 'object' && !campaignData.name && !campaignData.campaign)) {
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-lg">
                                {typeof campaignData === 'string' 
                                  ? campaignData 
                                  : campaignData.name || campaignData.campaign?.name || 'Campaign ' + (index + 1)}
                              </h3>
                            </div>
                          </div>
                          {typeof campaignData === 'object' && (
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto max-h-40">
                              {JSON.stringify(campaignData, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    }
                    
                    // Handle different possible data structures
                    let campaignRelation, campaign;
                    
                    try {
                      // Try to determine the structure
                      if (typeof campaignData === 'object') {
                        if ('campaign' in campaignData && campaignData.campaign) {
                          // Structure is { ...relationData, campaign: { ...campaignData } }
                          campaignRelation = campaignData;
                          campaign = campaignData.campaign;
                        } else if ('name' in campaignData) {
                          // Structure is just the campaign object
                          campaignRelation = campaignData;
                          campaign = campaignData;
                        } else {
                          // Unknown structure, use as is
                          campaignRelation = campaignData;
                          campaign = campaignData;
                        }
                      } else {
                        console.warn('Campaign data is not an object:', campaignData);
                        return (
                          <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <p className="text-red-500">Invalid campaign data format</p>
                          </div>
                        );
                      }
                      
                      // Ensure we have a name to display
                      if (!campaign || !campaign.name) {
                        console.warn('Campaign data missing name:', campaignData);
                        return (
                          <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                            <p className="text-yellow-700">Campaign data missing required fields</p>
                            <pre className="text-xs mt-2 overflow-auto max-h-20">
                              {JSON.stringify(campaignData, null, 2)}
                            </pre>
                          </div>
                        );
                      }
                    } catch (error) {
                      console.error('Error processing campaign data:', error, campaignData);
                      return (
                        <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <p className="text-red-500">Error processing campaign data</p>
                          <p className="text-xs mt-1">{String(error)}</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-lg">{campaign.name}</h3>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={
                              campaignRelation.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' :
                              campaignRelation.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              campaignRelation.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              campaignRelation.status === 'UNSUBSCRIBED' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }>
                              {campaignRelation.status?.replace(/_/g, ' ')}
                            </Badge>
                            {campaign.type && (
                              <Badge variant="secondary">
                                {campaign.type?.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">Campaign Status</h4>
                            <p className="text-sm">{campaign.status?.replace(/_/g, ' ') || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">Added On</h4>
                            <p className="text-sm">{formatDate(campaignRelation.added_at || campaignRelation.created_at)}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">Last Updated</h4>
                            <p className="text-sm">{formatDate(campaignRelation.updated_at)}</p>
                          </div>
                        </div>
                        
                        {(campaign.start_date || campaign.end_date) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {campaign.start_date && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">Start Date</h4>
                                <p className="text-sm">{new Date(campaign.start_date).toLocaleDateString()}</p>
                              </div>
                            )}
                            {campaign.end_date && (
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">End Date</h4>
                                <p className="text-sm">{new Date(campaign.end_date).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {campaign.metrics && Object.keys(campaign.metrics).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Campaign Metrics</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(campaign.metrics).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 p-2 rounded">
                                  <p className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                                  <p className="text-sm font-medium">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {campaignRelation.notes && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">Notes</h4>
                            <p className="text-sm bg-gray-50 p-2 rounded">{campaignRelation.notes}</p>
                          </div>
                        )}
                        
                        {/* Interaction metrics specific to this lead in the campaign */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {campaignRelation.open_count !== undefined && (
                            <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
                              Opens: {campaignRelation.open_count}
                            </div>
                          )}
                          {campaignRelation.click_count !== undefined && (
                            <div className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs">
                              Clicks: {campaignRelation.click_count}
                            </div>
                          )}
                          {campaignRelation.response_count !== undefined && (
                            <div className="bg-purple-50 text-purple-800 px-2 py-1 rounded text-xs">
                              Responses: {campaignRelation.response_count}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
        
        <TabsContent value="company-analysis" className="space-y-4">
          <CompanyAnalysis leadId={leadId} />
        </TabsContent>
      </Tabs>
      
      {leadData && leadData.email && (
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={(open) => setShowEmailDialog(open)}
          leadEmail={leadData.email}
          leadName={leadData.full_name}
        />
      )}
      
      {leadData && (
        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={(open) => setShowPhoneDialog(open)}
          leadPhone={leadData.phone}
          leadName={leadData.full_name}
        />
      )}
    </div>
  );
};

export default LeadDetail; 