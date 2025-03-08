import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase/client';
import { useAnalyticsContext } from '@/context/AnalyticsContext';

// Types
export interface OverviewStats {
  totalLeads: number;
  activeLeads: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalCommunications: number;
  totalMeetings: number;
  conversionRate: number;
  responseRate: number;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  acquisitionCost: number;
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    source: string;
    createdAt: string;
  }>;
}

export interface CampaignStats {
  total: number;
  active: number;
  completed: number;
  byType: Record<string, number>;
  performance: Array<{
    id: string;
    name: string;
    type: string;
    sentCount: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
}

export interface CommunicationStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  responseRate: number;
  averageResponseTime: number;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface PerformanceMetrics {
  conversionRate: number;
  leadQualityScore: number;
  averageDealSize: number;
  salesCycle: number;
  customerAcquisitionCost: number;
  returnOnInvestment: number;
  timeSeriesData: Array<{
    date: string;
    leads: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface TrendData {
  leadGrowth: Array<{
    date: string;
    value: number;
  }>;
  conversionTrend: Array<{
    date: string;
    value: number;
  }>;
  campaignPerformance: Array<{
    date: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  communicationEffectiveness: Array<{
    date: string;
    responseRate: number;
    sentimentScore: number;
  }>;
}

export interface AnalysisRecommendation {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  insightDetails: string;
}

export interface UserPerformance {
  users: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    metrics: {
      leadsManaged: number;
      leadConversionRate: number;
      responseTime: number;
      meetingsScheduled: number;
      meetingsCompleted: number;
      activitiesCompleted: number;
      activitiesOverdue: number;
    };
    performance: {
      current: number;
      previous: number;
      trend: number;
    };
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      date: string;
      status: string;
    }>;
  }>;
  teamMetrics: {
    averageLeadsPerUser: number;
    averageConversionRate: number;
    averageResponseTime: number;
    averageActivitiesCompleted: number;
  };
  timeSeriesData: Array<{
    date: string;
    averagePerformance: number;
    topPerformerScore: number;
  }>;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: () => [...analyticsKeys.all, 'overview'] as const,
  leads: () => [...analyticsKeys.all, 'leads'] as const,
  campaigns: () => [...analyticsKeys.all, 'campaigns'] as const,
  communications: () => [...analyticsKeys.all, 'communications'] as const,
  performance: () => [...analyticsKeys.all, 'performance'] as const,
  trends: () => [...analyticsKeys.all, 'trends'] as const,
  analysis: () => [...analyticsKeys.all, 'analysis'] as const,
  userPerformance: () => [...analyticsKeys.all, 'userPerformance'] as const,
};

// Mock data
const mockOverviewStats: OverviewStats = {
  totalLeads: 1248,
  activeLeads: 523,
  totalCampaigns: 24,
  activeCampaigns: 8,
  totalCommunications: 3752,
  totalMeetings: 187,
  conversionRate: 18.7,
  responseRate: 42.3,
};

const mockLeadStats: LeadStats = {
  total: 1248,
  byStatus: {
    'New': 342,
    'Contacted': 287,
    'Engaged': 196,
    'Qualified': 145,
    'Proposal': 89,
    'Converted': 98,
    'Lost': 91,
  },
  bySource: {
    'Website': 423,
    'Referral': 287,
    'LinkedIn': 196,
    'Email Campaign': 145,
    'Event': 89,
    'Cold Outreach': 108,
  },
  conversionRate: 18.7,
  acquisitionCost: 42.5,
  recentLeads: [
    { id: '1', name: 'John Smith', email: 'john@example.com', status: 'New', source: 'Website', createdAt: '2023-06-01T10:30:00Z' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: 'Contacted', source: 'LinkedIn', createdAt: '2023-06-02T14:45:00Z' },
    { id: '3', name: 'Michael Brown', email: 'michael@example.com', status: 'Engaged', source: 'Referral', createdAt: '2023-06-03T09:15:00Z' },
    { id: '4', name: 'Emily Davis', email: 'emily@example.com', status: 'Qualified', source: 'Email Campaign', createdAt: '2023-06-04T16:20:00Z' },
    { id: '5', name: 'David Wilson', email: 'david@example.com', status: 'Proposal', source: 'Event', createdAt: '2023-06-05T11:10:00Z' },
  ],
};

const mockCampaignStats: CampaignStats = {
  total: 24,
  active: 8,
  completed: 16,
  byType: {
    'Email': 12,
    'SMS': 5,
    'Social': 4,
    'Multi-channel': 3,
  },
  performance: [
    { id: '1', name: 'Summer Promotion', type: 'Email', sentCount: 1250, openRate: 32.4, clickRate: 8.7, conversionRate: 2.3 },
    { id: '2', name: 'Product Launch', type: 'Multi-channel', sentCount: 2500, openRate: 41.2, clickRate: 12.5, conversionRate: 4.8 },
    { id: '3', name: 'Follow-up Campaign', type: 'Email', sentCount: 875, openRate: 28.6, clickRate: 7.2, conversionRate: 3.1 },
    { id: '4', name: 'Event Invitation', type: 'SMS', sentCount: 450, openRate: 94.2, clickRate: 22.8, conversionRate: 8.4 },
    { id: '5', name: 'Referral Program', type: 'Social', sentCount: 1800, openRate: 38.9, clickRate: 15.3, conversionRate: 5.7 },
  ],
};

const mockCommunicationStats: CommunicationStats = {
  total: 3752,
  byType: {
    'Email': 2145,
    'SMS': 823,
    'Phone': 456,
    'Meeting': 187,
    'Social': 141,
  },
  byStatus: {
    'Sent': 3752,
    'Delivered': 3689,
    'Opened/Received': 1842,
    'Responded': 1587,
    'Bounced': 63,
  },
  responseRate: 42.3,
  averageResponseTime: 5.2, // hours
  sentimentAnalysis: {
    positive: 68,
    neutral: 24,
    negative: 8,
  },
};

const mockPerformanceMetrics: PerformanceMetrics = {
  conversionRate: 18.7,
  leadQualityScore: 72.4,
  averageDealSize: 4250,
  salesCycle: 32, // days
  customerAcquisitionCost: 42.5,
  returnOnInvestment: 315, // percentage
  timeSeriesData: [
    { date: '2023-01-01', leads: 78, conversions: 12, revenue: 51000 },
    { date: '2023-02-01', leads: 92, conversions: 15, revenue: 63750 },
    { date: '2023-03-01', leads: 104, conversions: 18, revenue: 76500 },
    { date: '2023-04-01', leads: 121, conversions: 22, revenue: 93500 },
    { date: '2023-05-01', leads: 135, conversions: 26, revenue: 110500 },
    { date: '2023-06-01', leads: 148, conversions: 29, revenue: 123250 },
  ],
};

const mockTrendData: TrendData = {
  leadGrowth: [
    { date: '2023-01-01', value: 78 },
    { date: '2023-02-01', value: 92 },
    { date: '2023-03-01', value: 104 },
    { date: '2023-04-01', value: 121 },
    { date: '2023-05-01', value: 135 },
    { date: '2023-06-01', value: 148 },
  ],
  conversionTrend: [
    { date: '2023-01-01', value: 15.4 },
    { date: '2023-02-01', value: 16.3 },
    { date: '2023-03-01', value: 17.3 },
    { date: '2023-04-01', value: 18.2 },
    { date: '2023-05-01', value: 19.3 },
    { date: '2023-06-01', value: 19.6 },
  ],
  campaignPerformance: [
    { date: '2023-01-01', openRate: 28.4, clickRate: 6.2, conversionRate: 1.8 },
    { date: '2023-02-01', openRate: 30.1, clickRate: 7.1, conversionRate: 2.1 },
    { date: '2023-03-01', openRate: 32.5, clickRate: 7.8, conversionRate: 2.4 },
    { date: '2023-04-01', openRate: 34.2, clickRate: 8.5, conversionRate: 2.7 },
    { date: '2023-05-01', openRate: 36.8, clickRate: 9.2, conversionRate: 3.1 },
    { date: '2023-06-01', openRate: 38.5, clickRate: 9.8, conversionRate: 3.4 },
  ],
  communicationEffectiveness: [
    { date: '2023-01-01', responseRate: 36.2, sentimentScore: 65.4 },
    { date: '2023-02-01', responseRate: 37.8, sentimentScore: 66.2 },
    { date: '2023-03-01', responseRate: 39.1, sentimentScore: 67.5 },
    { date: '2023-04-01', responseRate: 40.5, sentimentScore: 68.3 },
    { date: '2023-05-01', responseRate: 41.8, sentimentScore: 69.1 },
    { date: '2023-06-01', responseRate: 42.3, sentimentScore: 70.2 },
  ],
};

const mockAnalysisRecommendation: AnalysisRecommendation = {
  summary: "Your CRM performance shows positive growth trends with opportunities for optimization in lead qualification and campaign targeting.",
  strengths: [
    "Consistent lead growth month-over-month (+90% in 6 months)",
    "Improving conversion rates (from 15.4% to 19.6%)",
    "Strong email open rates compared to industry average",
    "Positive sentiment in customer communications (68% positive)"
  ],
  weaknesses: [
    "High customer acquisition cost ($42.50 per lead)",
    "Long sales cycle (32 days average)",
    "Low conversion rates for cold outreach campaigns",
    "Uneven performance across different campaign types"
  ],
  opportunities: [
    "Optimize lead qualification process to reduce sales cycle",
    "Increase focus on referral programs which show higher conversion rates",
    "Implement A/B testing in email campaigns to improve click rates",
    "Develop targeted follow-up sequences for engaged leads"
  ],
  recommendations: [
    "Implement lead scoring system to prioritize high-potential prospects",
    "Increase investment in referral marketing by 20%",
    "Reduce cold outreach and reallocate budget to higher-performing channels",
    "Create segmented email campaigns based on lead behavior and interests",
    "Develop automated follow-up sequences for leads that show initial engagement"
  ],
  insightDetails: "Analysis of your CRM data reveals that while lead volume is growing steadily, the qualification process could be more efficient. Referrals convert at 2.3x the rate of cold outreach, suggesting a reallocation of resources would improve ROI. Email campaigns perform well for initial engagement but follow-up sequences could be optimized for better conversion. The data suggests that implementing a lead scoring system could reduce your sales cycle by up to 25% by helping your team focus on the most promising opportunities."
};

const mockUserPerformance: UserPerformance = {
  users: [
    {
      id: '1',
      name: 'Alex Johnson',
      role: 'Sales Representative',
      avatar: '/avatars/alex.jpg',
      metrics: {
        leadsManaged: 78,
        leadConversionRate: 22.4,
        responseTime: 3.2,
        meetingsScheduled: 32,
        meetingsCompleted: 28,
        activitiesCompleted: 145,
        activitiesOverdue: 3,
      },
      performance: {
        current: 87,
        previous: 82,
        trend: 6.1,
      },
      recentActivity: [
        { id: '1', type: 'Meeting', title: 'Product Demo with Acme Corp', date: '2023-06-01T14:30:00Z', status: 'Completed' },
        { id: '2', type: 'Call', title: 'Follow-up with John Smith', date: '2023-06-02T10:15:00Z', status: 'Completed' },
        { id: '3', type: 'Email', title: 'Proposal to XYZ Inc', date: '2023-06-03T09:45:00Z', status: 'Sent' },
      ],
    },
    {
      id: '2',
      name: 'Sarah Miller',
      role: 'Account Executive',
      avatar: '/avatars/sarah.jpg',
      metrics: {
        leadsManaged: 64,
        leadConversionRate: 25.8,
        responseTime: 2.8,
        meetingsScheduled: 29,
        meetingsCompleted: 27,
        activitiesCompleted: 132,
        activitiesOverdue: 1,
      },
      performance: {
        current: 92,
        previous: 88,
        trend: 4.5,
      },
      recentActivity: [
        { id: '4', type: 'Meeting', title: 'Contract Negotiation with BigCo', date: '2023-06-01T11:00:00Z', status: 'Completed' },
        { id: '5', type: 'Email', title: 'Quarterly Review Preparation', date: '2023-06-02T15:30:00Z', status: 'Sent' },
        { id: '6', type: 'Call', title: 'New Lead Introduction', date: '2023-06-03T14:00:00Z', status: 'Scheduled' },
      ],
    },
    {
      id: '3',
      name: 'Michael Chen',
      role: 'Sales Development Rep',
      avatar: '/avatars/michael.jpg',
      metrics: {
        leadsManaged: 92,
        leadConversionRate: 18.2,
        responseTime: 4.1,
        meetingsScheduled: 24,
        meetingsCompleted: 19,
        activitiesCompleted: 168,
        activitiesOverdue: 7,
      },
      performance: {
        current: 78,
        previous: 75,
        trend: 4.0,
      },
      recentActivity: [
        { id: '7', type: 'Email', title: 'Cold Outreach Campaign', date: '2023-06-01T09:00:00Z', status: 'Sent' },
        { id: '8', type: 'Call', title: 'Lead Qualification Call', date: '2023-06-02T13:45:00Z', status: 'Completed' },
        { id: '9', type: 'Meeting', title: 'Initial Discovery with Prospect', date: '2023-06-03T16:30:00Z', status: 'Scheduled' },
      ],
    },
    {
      id: '4',
      name: 'Emily Rodriguez',
      role: 'Customer Success Manager',
      avatar: '/avatars/emily.jpg',
      metrics: {
        leadsManaged: 42,
        leadConversionRate: 28.6,
        responseTime: 2.4,
        meetingsScheduled: 38,
        meetingsCompleted: 36,
        activitiesCompleted: 156,
        activitiesOverdue: 2,
      },
      performance: {
        current: 94,
        previous: 91,
        trend: 3.3,
      },
      recentActivity: [
        { id: '10', type: 'Meeting', title: 'Quarterly Business Review', date: '2023-06-01T13:00:00Z', status: 'Completed' },
        { id: '11', type: 'Email', title: 'Feature Update Announcement', date: '2023-06-02T11:30:00Z', status: 'Sent' },
        { id: '12', type: 'Call', title: 'Renewal Discussion', date: '2023-06-03T10:00:00Z', status: 'Completed' },
      ],
    },
  ],
  teamMetrics: {
    averageLeadsPerUser: 69,
    averageConversionRate: 23.8,
    averageResponseTime: 3.1,
    averageActivitiesCompleted: 150,
  },
  timeSeriesData: [
    { date: '2023-01-01', averagePerformance: 76, topPerformerScore: 88 },
    { date: '2023-02-01', averagePerformance: 78, topPerformerScore: 89 },
    { date: '2023-03-01', averagePerformance: 80, topPerformerScore: 90 },
    { date: '2023-04-01', averagePerformance: 82, topPerformerScore: 91 },
    { date: '2023-05-01', averagePerformance: 84, topPerformerScore: 93 },
    { date: '2023-06-01', averagePerformance: 87, topPerformerScore: 94 },
  ],
};

// Hooks
export const useOverviewStats = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: async () => {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockOverviewStats;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_overview')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch overview stats: ${error.message}`);
      }
      
      return data as OverviewStats;
    },
  });
};

export const useLeadStats = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.leads(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockLeadStats;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_leads')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch lead stats: ${error.message}`);
      }
      
      return data as LeadStats;
    },
  });
};

export const useCampaignStats = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.campaigns(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockCampaignStats;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_campaigns')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch campaign stats: ${error.message}`);
      }
      
      return data as CampaignStats;
    },
  });
};

export const useCommunicationStats = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.communications(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockCommunicationStats;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_communications')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch communication stats: ${error.message}`);
      }
      
      return data as CommunicationStats;
    },
  });
};

export const usePerformanceMetrics = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.performance(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockPerformanceMetrics;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_performance')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }
      
      return data as PerformanceMetrics;
    },
  });
};

export const useTrendData = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.trends(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockTrendData;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_trends')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch trend data: ${error.message}`);
      }
      
      return data as TrendData;
    },
  });
};

export const useAnalysisRecommendation = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.analysis(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return mockAnalysisRecommendation;
      }
      
      // In a real implementation, this would call an API endpoint that uses an LLM
      // to analyze the data and generate recommendations
      const { data, error } = await supabase
        .from('analytics_analysis')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch analysis and recommendations: ${error.message}`);
      }
      
      return data as AnalysisRecommendation;
    },
  });
};

export const useUserPerformance = () => {
  const { useMockData } = useAnalyticsContext();
  
  return useQuery({
    queryKey: analyticsKeys.userPerformance(),
    queryFn: async () => {
      if (useMockData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return mockUserPerformance;
      }
      
      // Real implementation with Supabase
      const { data, error } = await supabase
        .from('analytics_user_performance')
        .select('*')
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch user performance data: ${error.message}`);
      }
      
      return data as UserPerformance;
    },
  });
}; 