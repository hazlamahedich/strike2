import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

// Query keys
export const campaignAnalyticsKeys = {
  all: ['campaignAnalytics'] as const,
  overview: () => [...campaignAnalyticsKeys.all, 'overview'] as const,
  campaign: (id: string) => [...campaignAnalyticsKeys.all, 'campaign', id] as const,
  performance: (id: string) => [...campaignAnalyticsKeys.campaign(id), 'performance'] as const,
  leads: (id: string) => [...campaignAnalyticsKeys.campaign(id), 'leads'] as const,
  activities: (id: string) => [...campaignAnalyticsKeys.campaign(id), 'activities'] as const,
  timeline: (id: string) => [...campaignAnalyticsKeys.campaign(id), 'timeline'] as const,
};

// Types
export interface CampaignOverviewStats {
  total_campaigns: number;
  active_campaigns: number;
  paused_campaigns: number;
  completed_campaigns: number;
  total_leads: number;
  average_open_rate: number;
  average_click_rate: number;
  average_conversion_rate: number;
}

export interface CampaignPerformance {
  id: string;
  campaign_id: string;
  date: string;
  sends: number;
  opens: number;
  clicks: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  unsubscribes: number;
  bounces: number;
}

export interface CampaignLeadStats {
  total: number;
  active: number;
  engaged: number;
  converted: number;
  unsubscribed: number;
  by_source: Record<string, number>;
  by_status: Record<string, number>;
}

export interface CampaignActivityStats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  completion_rate: number;
  recent: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    created_at: string;
  }>;
}

export interface CampaignTimelineEvent {
  id: string;
  campaign_id: string;
  event_type: string;
  event_date: string;
  description: string;
  metadata?: Record<string, any>;
}

// Mock data flag - set to false when ready to use real Supabase data
export const USE_MOCK_DATA = true;

// Mock data for development
const mockOverviewStats: CampaignOverviewStats = {
  total_campaigns: 12,
  active_campaigns: 5,
  paused_campaigns: 3,
  completed_campaigns: 4,
  total_leads: 2450,
  average_open_rate: 28.5,
  average_click_rate: 12.3,
  average_conversion_rate: 3.7,
};

const mockPerformanceData = (campaignId: string): CampaignPerformance[] => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (13 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate some random but realistic data
    const sends = Math.floor(Math.random() * 100) + 50;
    const opens = Math.floor(sends * (Math.random() * 0.4 + 0.2)); // 20-60% open rate
    const clicks = Math.floor(opens * (Math.random() * 0.5 + 0.1)); // 10-60% click rate
    const conversions = Math.floor(clicks * (Math.random() * 0.3 + 0.05)); // 5-35% conversion rate
    
    return {
      id: `perf-${campaignId}-${i}`,
      campaign_id: campaignId,
      date: dateStr,
      sends,
      opens,
      clicks,
      conversions,
      open_rate: parseFloat(((opens / sends) * 100).toFixed(1)),
      click_rate: parseFloat(((clicks / opens) * 100).toFixed(1)),
      conversion_rate: parseFloat(((conversions / clicks) * 100).toFixed(1)),
      unsubscribes: Math.floor(Math.random() * 5),
      bounces: Math.floor(Math.random() * 3),
    };
  });
};

const mockLeadStats = (campaignId: string): CampaignLeadStats => {
  const total = Math.floor(Math.random() * 1000) + 200;
  const active = Math.floor(total * 0.7);
  const engaged = Math.floor(active * 0.4);
  const converted = Math.floor(engaged * 0.3);
  const unsubscribed = Math.floor(total * 0.05);
  
  return {
    total,
    active,
    engaged,
    converted,
    unsubscribed,
    by_source: {
      'Website': Math.floor(total * 0.4),
      'Referral': Math.floor(total * 0.2),
      'Social Media': Math.floor(total * 0.15),
      'Email': Math.floor(total * 0.1),
      'Other': Math.floor(total * 0.15),
    },
    by_status: {
      'New': Math.floor(total * 0.3),
      'Contacted': Math.floor(total * 0.25),
      'Qualified': Math.floor(total * 0.2),
      'Converted': Math.floor(total * 0.15),
      'Lost': Math.floor(total * 0.1),
    }
  };
};

const mockActivityStats = (campaignId: string): CampaignActivityStats => {
  const total = Math.floor(Math.random() * 200) + 50;
  const completed = Math.floor(total * 0.7);
  
  return {
    total,
    by_type: {
      'email': Math.floor(total * 0.5),
      'call': Math.floor(total * 0.2),
      'meeting': Math.floor(total * 0.15),
      'task': Math.floor(total * 0.1),
      'note': Math.floor(total * 0.05),
    },
    by_status: {
      'completed': completed,
      'pending': total - completed,
    },
    completion_rate: parseFloat(((completed / total) * 100).toFixed(1)),
    recent: Array.from({ length: 5 }, (_, i) => {
      const types = ['email', 'call', 'meeting', 'task', 'note'];
      const statuses = ['completed', 'pending'];
      return {
        id: `activity-${campaignId}-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        title: `Activity ${i + 1}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      };
    }),
  };
};

const mockTimelineEvents = (campaignId: string): CampaignTimelineEvent[] => {
  const eventTypes = [
    'campaign_created',
    'campaign_updated',
    'campaign_activated',
    'campaign_paused',
    'lead_added',
    'lead_removed',
    'email_sent',
    'email_opened',
    'email_clicked',
    'conversion',
  ];
  
  const today = new Date();
  return Array.from({ length: 10 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (9 - i));
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    let description = '';
    switch (eventType) {
      case 'campaign_created':
        description = 'Campaign was created';
        break;
      case 'campaign_updated':
        description = 'Campaign details were updated';
        break;
      case 'campaign_activated':
        description = 'Campaign was activated';
        break;
      case 'campaign_paused':
        description = 'Campaign was paused';
        break;
      case 'lead_added':
        description = `${Math.floor(Math.random() * 10) + 1} leads were added to the campaign`;
        break;
      case 'lead_removed':
        description = `${Math.floor(Math.random() * 5) + 1} leads were removed from the campaign`;
        break;
      case 'email_sent':
        description = `${Math.floor(Math.random() * 100) + 20} emails were sent`;
        break;
      case 'email_opened':
        description = `${Math.floor(Math.random() * 50) + 10} emails were opened`;
        break;
      case 'email_clicked':
        description = `${Math.floor(Math.random() * 30) + 5} email links were clicked`;
        break;
      case 'conversion':
        description = `${Math.floor(Math.random() * 10) + 1} leads were converted`;
        break;
    }
    
    return {
      id: `event-${campaignId}-${i}`,
      campaign_id: campaignId,
      event_type: eventType,
      event_date: date.toISOString(),
      description,
      metadata: {},
    };
  });
};

// Get campaign overview stats
export const useCampaignOverviewStats = () => {
  return useQuery({
    queryKey: campaignAnalyticsKeys.overview(),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockOverviewStats;
      }
      
      const { data, error } = await apiClient.get<CampaignOverviewStats>('campaign_analytics/overview');
      
      if (error) {
        throw new Error(`Failed to fetch campaign overview stats: ${error.message}`);
      }
      
      return data;
    },
  });
};

// Get campaign performance data
export const useCampaignPerformance = (campaignId: string) => {
  return useQuery({
    queryKey: campaignAnalyticsKeys.performance(campaignId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockPerformanceData(campaignId);
      }
      
      const { data, error } = await apiClient.get<CampaignPerformance[]>(`campaign_analytics/${campaignId}/performance`);
      
      if (error) {
        throw new Error(`Failed to fetch campaign performance data: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!campaignId,
  });
};

// Get campaign lead stats
export const useCampaignLeadStats = (campaignId: string) => {
  return useQuery({
    queryKey: campaignAnalyticsKeys.leads(campaignId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockLeadStats(campaignId);
      }
      
      const { data, error } = await apiClient.get<CampaignLeadStats>(`campaign_analytics/${campaignId}/leads`);
      
      if (error) {
        throw new Error(`Failed to fetch campaign lead stats: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!campaignId,
  });
};

// Get campaign activity stats
export const useCampaignActivityStats = (campaignId: string) => {
  return useQuery({
    queryKey: campaignAnalyticsKeys.activities(campaignId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockActivityStats(campaignId);
      }
      
      const { data, error } = await apiClient.get<CampaignActivityStats>(`campaign_analytics/${campaignId}/activities`);
      
      if (error) {
        throw new Error(`Failed to fetch campaign activity stats: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!campaignId,
  });
};

// Get campaign timeline events
export const useCampaignTimeline = (campaignId: string) => {
  return useQuery({
    queryKey: campaignAnalyticsKeys.timeline(campaignId),
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return mockTimelineEvents(campaignId);
      }
      
      const { data, error } = await apiClient.get<CampaignTimelineEvent[]>(`campaign_analytics/${campaignId}/timeline`);
      
      if (error) {
        throw new Error(`Failed to fetch campaign timeline events: ${error.message}`);
      }
      
      return data;
    },
    enabled: !!campaignId,
  });
}; 