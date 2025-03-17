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
import { Lead, LeadSource, LeadStatus } from '../../lib/types/lead';
import { useLead, useLeadTimeline, useLeadInsights } from '../../lib/hooks/useLeads';
import { EmailDialog } from '../communications/EmailDialog';
import { PhoneDialog } from '../communications/PhoneDialog';
import CompanyAnalysis from './CompanyAnalysis';
import { ApiResponse, ApiError } from '../../lib/api/apiClient';

// Extended interface for Lead details
interface LeadDetailType extends Omit<Lead, 'notes'> {
  lead_score?: number;
  conversion_probability?: number;
  tasks?: any[];
  notes?: any[];
  campaigns?: any[];
  activities?: any[];
  custom_fields?: Record<string, any>;
  score_factors?: any[];
  recommendations?: any[];
  company_name?: string;
  job_title?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  owner?: any;
  full_name?: string;
  title?: string;
  data?: any;
}

// Define an interface for timeline event
interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  [key: string]: any;
}

// Define an interface for task
interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  [key: string]: any;
}

// Define an interface for campaign
interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date?: string;
  [key: string]: any;
}

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
  const { data: leadResponse, isLoading, isError } = useLead(leadId);
  
  // Cast to LeadDetailType for easier access to properties
  const lead = leadResponse as unknown as LeadDetailType;

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
      case LeadSource.COLD_CALL:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case LeadSource.EVENT:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case LeadSource.SOCIAL_MEDIA:
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case LeadSource.EMAIL_CAMPAIGN:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case LeadSource.OTHER:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Format a date string
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString;
    }
  };
  
  const handleSendEmail = () => {
    setShowEmailDialog(true);
  };
  
  const handleCall = () => {
    setShowPhoneDialog(true);
  };
  
  // Toggle expanded state for timeline events
  const toggleExpanded = (index: number): void => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Get timeline icon based on type
  const getTimelineIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'call':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'note':
        return <FileText className="h-5 w-5 text-amber-500" />;
      case 'task':
        return <CheckSquare className="h-5 w-5 text-indigo-500" />;
      case 'activity':
        return <Activity className="h-5 w-5 text-pink-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get timeline title based on event
  const getTimelineTitle = (event: TimelineEvent): string => {
    switch (event.type) {
      case 'email':
        return `Email ${event.direction === 'outbound' ? 'sent to' : 'received from'} ${event.contact}`;
      case 'call':
        return `Call ${event.direction === 'outbound' ? 'made to' : 'received from'} ${event.contact}`;
      case 'meeting':
        return `Meeting ${event.status === 'completed' ? 'held' : 'scheduled'} with ${event.participants?.join(', ')}`;
      case 'note':
        return 'Note added';
      case 'task':
        return `Task ${event.subtype === 'created' ? 'created' : event.subtype === 'completed' ? 'completed' : 'updated'}`;
      case 'activity':
        return event.title || 'Activity recorded';
      default:
        return event.title || `${event.type} recorded`;
    }
  };
  
  // Handle timeline filter change
  const handleTimelineFilterChange = (value: string): void => {
    if (value === 'all') {
      setSelectedTimelineFilters([]);
    } else {
      if (selectedTimelineFilters.includes(value)) {
        setSelectedTimelineFilters(selectedTimelineFilters.filter(f => f !== value));
      } else {
        setSelectedTimelineFilters([...selectedTimelineFilters, value]);
      }
    }
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
    full_name: lead?.full_name || `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim(),
    company: lead?.company || lead?.company_name || '',
    title: lead?.title || lead?.job_title || '',
    // Ensure these fields exist with default values if missing
    lead_score: lead?.lead_score || 0,
    conversion_probability: lead?.conversion_probability || 0,
    tasks: lead?.tasks || [],
    notes: lead?.notes || [],
    campaigns: lead?.campaigns || [],
    activities: lead?.activities || [],
    custom_fields: lead?.custom_fields || {},
    status: lead?.status,
    source: lead?.source,
    created_at: lead?.created_at,
    updated_at: lead?.updated_at,
    owner: lead?.owner,
    linkedin_url: lead?.linkedin_url,
    facebook_url: lead?.facebook_url,
    twitter_url: lead?.twitter_url,
    email: lead?.email,
    phone: lead?.phone,
    data: lead?.data,
    error: leadResponse?.error || null
  };
  
  // Function for timeline events
  const renderTimelineEvents = () => {
    // Type the timeline properly
    const timelineEvents = Array.isArray(timeline) ? timeline as TimelineEvent[] : [];
    
    if (!timelineEvents || timelineEvents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No activity recorded yet.
        </div>
      );
    }
    
    return timelineEvents.map((event: TimelineEvent, index: number) => (
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
    ));
  };
  
  // Function for rendering tasks
  const renderTasks = () => {
    const tasks = leadData.tasks as Task[] || [];
    
    if (!tasks || tasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No tasks assigned yet.
        </div>
      );
    }
    
    return tasks.map((task: Task, index: number) => (
      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
        <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-orange-500'} mt-2`}></div>
        <div className="flex-1">
          <p className="font-medium">{task.title}</p>
          <p className="text-sm text-muted-foreground">Due: {formatDate(task.due_date)}</p>
          {task.description && <p className="mt-1">{task.description}</p>}
        </div>
      </div>
    ));
  };
  
  // Function for rendering campaigns
  const renderCampaigns = () => {
    const campaigns = leadData.campaigns as Campaign[] || [];
    
    if (!campaigns || campaigns.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Not added to any campaigns yet.
        </div>
      );
    }
    
    return campaigns.map((campaignData: Campaign, index: number) => (
      <div key={index} className="border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-lg">{campaignData.name}</h3>
            {campaignData.description && (
              <p className="text-sm text-muted-foreground mt-1">{campaignData.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={
              campaignData.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' :
              campaignData.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
              campaignData.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
              campaignData.status === 'UNSUBSCRIBED' ? 'bg-red-100 text-red-800 border-red-300' :
              'bg-gray-100 text-gray-800 border-gray-300'
            }>
              {campaignData.status?.replace(/_/g, ' ')}
            </Badge>
            {campaignData.type && (
              <Badge variant="secondary">
                {campaignData.type?.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Campaign Status</h4>
            <p className="text-sm">{campaignData.status?.replace(/_/g, ' ') || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Added On</h4>
            <p className="text-sm">{formatDate(campaignData.added_at || campaignData.created_at)}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Last Updated</h4>
            <p className="text-sm">{formatDate(campaignData.updated_at)}</p>
          </div>
        </div>
        
        {(campaignData.start_date || campaignData.end_date) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {campaignData.start_date && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Start Date</h4>
                <p className="text-sm">{new Date(campaignData.start_date).toLocaleDateString()}</p>
              </div>
            )}
            {campaignData.end_date && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">End Date</h4>
                <p className="text-sm">{new Date(campaignData.end_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
        
        {campaignData.metrics && Object.keys(campaignData.metrics).length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Campaign Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(campaignData.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {campaignData.notes && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Notes</h4>
            <p className="text-sm bg-gray-50 p-2 rounded">{campaignData.notes}</p>
          </div>
        )}
        
        {/* Interaction metrics specific to this lead in the campaign */}
        <div className="mt-4 flex flex-wrap gap-2">
          {campaignData.open_count !== undefined && (
            <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs">
              Opens: {campaignData.open_count}
            </div>
          )}
          {campaignData.click_count !== undefined && (
            <div className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs">
              Clicks: {campaignData.click_count}
            </div>
          )}
          {campaignData.response_count !== undefined && (
            <div className="bg-purple-50 text-purple-800 px-2 py-1 rounded text-xs">
              Responses: {campaignData.response_count}
            </div>
          )}
        </div>
      </div>
    ));
  };
  
  // Insights section - Score factors
  const renderScoreFactors = () => {
    // Type the insights properly and ensure it's an array
    const insightsData = insights as any;
    const scoreFactors = Array.isArray(insightsData?.score_factors) 
      ? insightsData.score_factors 
      : [];
    
    if (!scoreFactors || scoreFactors.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No score factors available.
        </div>
      );
    }
    
    return (
      <div>
        <h3 className="font-medium mb-2">Lead Score Factors</h3>
        <ul className="list-disc pl-5 space-y-1">
          {scoreFactors.map((factor: string, index: number) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Insights section - Recommendations
  const renderRecommendations = () => {
    // Type the insights properly and ensure it's an array
    const insightsData = insights as any;
    const recommendations = Array.isArray(insightsData?.recommendations) 
      ? insightsData.recommendations 
      : [];
    
    if (!recommendations || recommendations.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No recommendations available.
        </div>
      );
    }
    
    return (
      <div>
        <h3 className="font-medium mb-2">Recommendations</h3>
        <ul className="list-disc pl-5 space-y-1">
          {recommendations.map((recommendation: string, index: number) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Conversion probability display
  const renderConversionProbability = () => {
    const insightsData = insights as any;
    const conversionProbability = insightsData?.conversion_probability;
    
    if (conversionProbability === undefined) {
      return null;
    }
    
    return (
      <div>
        <h3 className="font-medium mb-2">Conversion Probability</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, conversionProbability * 100))}%` }}
            ></div>
          </div>
          <span className="font-bold">{(conversionProbability * 100).toFixed(1)}%</span>
        </div>
      </div>
    );
  };
  
  // Helper to capitalize words
  const capitalizeWords = (source: string): string => {
    if (!source) return '';
    return source.split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Function for rendering activities
  const renderActivities = () => {
    const activities = leadData.activities as any[] || [];
    
    if (!activities || activities.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No activities recorded yet.
        </div>
      );
    }
    
    return activities.map((activity: any, index: number) => (
      <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
        <div className="mt-1">
          <Activity className="h-5 w-5 text-pink-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{activity.type || 'Activity'}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(activity.timestamp || activity.created_at)}
          </p>
          {activity.description && <p className="mt-1">{activity.description}</p>}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
              {Object.entries(activity.metadata).map(([key, value]: [string, any], i: number) => (
                <p key={i}>
                  <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    ));
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
              {capitalizeWords(leadData.source.split('_').join(' '))}
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
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={selectedTimelineFilters.length === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('all')}
                  >
                    All
                  </Button>
                  <Button 
                    variant={selectedTimelineFilters.includes('email') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('email')}
                  >
                    Emails
                  </Button>
                  <Button 
                    variant={selectedTimelineFilters.includes('call') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('call')}
                  >
                    Calls
                  </Button>
                  <Button 
                    variant={selectedTimelineFilters.includes('meeting') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('meeting')}
                  >
                    Meetings
                  </Button>
                  <Button 
                    variant={selectedTimelineFilters.includes('note') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('note')}
                  >
                    Notes
                  </Button>
                  <Button 
                    variant={selectedTimelineFilters.includes('task') ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimelineFilterChange('task')}
                  >
                    Tasks
                  </Button>
                </div>
              </div>
              
              {Array.isArray(timeline) && timeline.length > 0 ? (
                <div className="space-y-4">
                  {renderTimelineEvents()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No activity recorded yet.
                </div>
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
              {renderTasks()}
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
              
              {renderCampaigns()}
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
              {renderScoreFactors()}
              {renderRecommendations()}
              {renderConversionProbability()}
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