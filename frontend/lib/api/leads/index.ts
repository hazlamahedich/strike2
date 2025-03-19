import apiClient from '../client';
import supabase from '../../supabase/client';
import { 
  Lead, 
  LeadDetail, 
  LeadCreate, 
  LeadUpdate, 
  LeadFilter, 
  LeadImport, 
  LeadExport,
  CampaignLead,
  LeadCampaignStatus
} from '../../types/lead';
import { SupabaseMLService } from '@/lib/ml/mlService';
import { getMockDataStatus } from '@/lib/utils/mockDataUtils';

// Base URL for lead endpoints
const BASE_URL = 'leads';

// Configuration flag to control whether to use mock data or real data
// Set this to false once the RLS policy is fixed
// const USE_MOCK_DATA_API = true;

// Configuration flag to control whether to use ML-based insights
// Set this to true to use the ML service for predictions
const USE_ML_INSIGHTS = true;

// Initialize the ML service
const mlService = new SupabaseMLService();

// Get leads with optional filtering
export const getLeads = async (
  skip: number = 0,
  limit: number = 100,
  status?: string,
  source?: string,
  owner_id?: number,
  campaign_id?: number,
  search?: string,
  sort_by: string = 'created_at',
  sort_desc: boolean = true
): Promise<Lead[]> => {
  // Use Supabase query
  let query = supabase
    .from('leads')
    .select('*')
    .range(skip, skip + limit - 1);
  
  // Apply filters if provided
  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (owner_id) query = query.eq('owner_id', owner_id);
  
  // Handle search
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }
  
  // Handle campaign filtering
  if (campaign_id) {
    // This requires a join with the lead_campaigns table
    // Restructure the query to avoid type issues
    const { data: campaignLeads, error: campaignError } = await supabase
      .from('lead_campaigns')
      .select('lead_id')
      .eq('campaign_id', campaign_id);
    
    if (campaignError) {
      console.error('Error fetching campaign leads:', campaignError);
      throw new Error(campaignError.message);
    }
    
    // Get the lead IDs from the campaign
    const leadIds = campaignLeads.map(cl => cl.lead_id);
    
    // Filter leads by these IDs
    if (leadIds.length > 0) {
      query = query.in('id', leadIds);
    } else {
      // No leads in this campaign, return empty array
      return [];
    }
  }
  
  // Apply sorting
  query = query.order(sort_by, { ascending: !sort_desc });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching leads:', error);
    throw new Error(error.message);
  }
  
  return data as Lead[];
};

// Get a single lead by ID
export const getLead = async (
  leadId: number,
  includeCampaignData: boolean = true
): Promise<LeadDetail> => {
  try {
    // Use the standardized approach to check mock data status
    if (getMockDataStatus()) {
      // Mock data implementation
      console.log(`Using mock data for lead ID: ${leadId}`);
      
      // Return mock data
      const mockData = {
        id: leadId,
        first_name: "John",
        last_name: "Smith",
        full_name: "John Smith",
        email: "john.smith@example.com",
        phone: "(555) 123-4567",
        company: "Acme Inc.",
        title: "CEO",
        source: "Website",
        status: "New",
        owner_id: "1",
        team_id: 1,
        lead_score: 8.5,
        custom_fields: {
          address: "123 Main St, San Francisco, CA 94105"
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tasks: [
          {
            id: 1,
            title: "Follow up call",
            description: "Call to discuss the proposal",
            due_date: new Date(Date.now() + 86400000).toISOString(),
            priority: "high",
            status: "pending",
            lead_id: leadId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        notes: [
          {
            id: 1,
            lead_id: leadId,
            body: "Initial contact made via website form",
            created_by: "1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        activities: [
          {
            id: 1,
            lead_id: leadId,
            activity_type: "note",
            created_at: new Date().toISOString(),
            metadata: {
              content: "Initial contact made via website form"
            }
          }
        ],
        campaigns: includeCampaignData ? [
          {
            id: 1,
            campaign_id: 1,
            lead_id: leadId,
            status: "active",
            added_at: new Date().toISOString(),
            campaign: {
              id: 1,
              name: "Summer Promotion",
              description: "Summer 2023 promotional campaign",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ] : [],
        owner: {
          id: "1",
          name: "Sales Rep",
          email: "sales@example.com"
        },
        // Add missing properties required by LeadDetail type
        emails: [],
        calls: [],
        meetings: [],
        timeline: []
      };
      
      return mockData as unknown as LeadDetail;
    } else {
      // Real data implementation
      console.log(`Fetching lead with ID: ${leadId}`);
      
      // STEP 1: Fetch only the lead data with no joins
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (error) {
        console.error('Error fetching lead details:', JSON.stringify(error));
        throw new Error(`Error fetching lead details: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        console.error(`Lead with ID ${leadId} not found`);
        throw new Error(`Lead with ID ${leadId} not found`);
      }
      
      // Create a basic lead detail object with empty arrays for related data
      const leadDetail = {
        ...data,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
        company: data.company_name || data.company || '',
        title: data.job_title || data.title || '',
        tasks: [],
        notes: [],
        activities: [],
        campaigns: [],
        emails: [],
        calls: [],
        meetings: [],
        timeline: [],
        // Create a minimal owner object without querying the users table
        owner: data.owner_id ? { id: data.owner_id, name: 'Owner', email: '' } : null,
        custom_fields: data.custom_fields || {}
      } as LeadDetail;
      
      // STEP 2: Fetch related data in separate queries
      try {
        // Fetch tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('lead_id', leadId);
        
        if (tasks) {
          leadDetail.tasks = tasks;
        }
        
        // Fetch notes
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .eq('lead_id', leadId);
        
        if (notes) {
          leadDetail.notes = notes;
        }
        
        // Fetch activities
        const { data: activities } = await supabase
          .from('activities')
          .select('*')
          .eq('lead_id', leadId);
        
        if (activities) {
          leadDetail.activities = activities;
        }
        
        // Fetch campaigns if requested
        if (includeCampaignData) {
          const { data: campaigns } = await supabase
            .from('campaign_leads')
            .select('*, campaign:campaigns(*)')
            .eq('lead_id', leadId);
          
          if (campaigns) {
            leadDetail.campaigns = campaigns;
          }
        }
      } catch (e) {
        console.error('Error fetching related data:', e);
        // Continue with partial data
      }
      
      return leadDetail;
    }
  } catch (error: any) {
    console.error('Error in getLead function:', error);
    throw new Error(error.message || `Unknown error fetching lead details: ${JSON.stringify(error)}`);
  }
};

// Create a new lead
export const createLead = async (
  leadData: LeadCreate, 
  handleDuplicates: string = 'skip'
): Promise<Lead> => {
  // Check for duplicates if needed
  if (handleDuplicates !== 'allow') {
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('email', leadData.email);
    
    if (existingLeads && existingLeads.length > 0) {
      if (handleDuplicates === 'skip') {
        throw new Error('A lead with this email already exists');
      } else if (handleDuplicates === 'update') {
        // Update the existing lead instead
        return updateLead(existingLeads[0].id, leadData as LeadUpdate);
      }
    }
  }
  
  // Prepare the lead data
  const newLead = {
    ...leadData,
    // Ensure proper field names for Supabase
    company_name: (leadData as any).company_name || leadData.company,
    job_title: (leadData as any).job_title || leadData.title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('leads')
    .insert(newLead)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating lead:', error);
    throw new Error(error.message);
  }
  
  return data as Lead;
};

// Bulk create leads
export const bulkCreateLeads = async (
  leads: LeadCreate[],
  handleDuplicates: string = 'skip',
  campaignIds?: number[]
): Promise<any> => {
  const importData: LeadImport = {
    data: leads.map(lead => {
      // Convert each lead to a plain object
      const leadObj: Record<string, any> = {};
      Object.entries(lead).forEach(([key, value]) => {
        if (value !== undefined) {
          leadObj[key] = value;
        }
      });
      return leadObj;
    }),
    field_mapping: {
      // Direct mapping (field name in API = field name in CSV)
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'email',
      phone: 'phone',
      company: 'company',
      title: 'title',
      source: 'source',
      status: 'status',
      notes: 'notes',
      linkedin_url: 'linkedin_url',
      facebook_url: 'facebook_url',
      twitter_url: 'twitter_url'
    },
    handle_duplicates: handleDuplicates,
    campaign_ids: campaignIds
  };
  
  return apiClient.post<any>(`${BASE_URL}/bulk`, importData);
};

// Update an existing lead
export const updateLead = async (leadId: number, leadData: LeadUpdate): Promise<Lead> => {
  // Prepare the update data
  const updateData = {
    ...leadData,
    // Ensure proper field names for Supabase
    company_name: (leadData as any).company_name || leadData.company,
    job_title: (leadData as any).job_title || leadData.title,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating lead:', error);
    throw new Error(error.message);
  }
  
  return data as Lead;
};

// Delete a lead
export const deleteLead = async (id: string): Promise<void> => {
  const response = await apiClient.delete<any>('/api/leads', id);
  
  if (response.error) {
    throw new Error(`Failed to delete lead: ${response.error.message}`);
  }
};

// Import leads from a file
export const importLeads = async (
  file: File,
  fieldMapping: Record<string, string>,
  campaignId?: number,
  handleDuplicates: string = 'skip'
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_mapping', JSON.stringify(fieldMapping));
  formData.append('handle_duplicates', handleDuplicates);
  
  if (campaignId) {
    formData.append('campaign_id', campaignId.toString());
  }
  
  // Custom fetch to handle FormData
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/${BASE_URL}/import`;
  const token = apiClient.getAuthToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || errorData.message || 'Failed to import leads');
  }
  
  return response.json();
};

// Export leads
export const exportLeads = async (exportConfig: LeadExport): Promise<any> => {
  return apiClient.post<any>(`${BASE_URL}/export`, exportConfig);
};

// Get lead timeline
export const getLeadTimeline = async (
  leadId: number, 
  limit: number = 20,
  interactionTypes?: string[]
): Promise<any[]> => {
  try {
    // Validate leadId
    if (isNaN(leadId) || leadId <= 0) {
      console.error(`Invalid lead ID: ${leadId}`);
      throw new Error(`Invalid lead ID: ${leadId}`);
    }
    
    if (getMockDataStatus()) {
      console.log(`Using mock timeline data for lead ID: ${leadId}`);
      
      // Return mock timeline data
      const mockTimeline = [
        {
          id: 1,
          type: 'note',
          content: 'Added a note about the lead',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          user: { name: 'John Doe' }
        },
        {
          id: 2,
          type: 'email',
          content: 'Sent an email about the product demo',
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          user: { name: 'Jane Smith' }
        },
        {
          id: 3,
          type: 'call',
          content: 'Had a call to discuss requirements',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          user: { name: 'John Doe' }
        },
        {
          id: 4,
          type: 'meeting',
          content: 'Scheduled an initial discovery meeting',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          user: { name: 'John Doe' },
          metadata: {
            title: 'Initial Discovery Meeting',
            start_time: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days in the future
            end_time: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(), // 1 hour later
            location: 'Zoom Meeting',
            status: 'scheduled',
            action: 'created'
          }
        },
        {
          id: 5,
          type: 'meeting',
          content: 'Updated meeting time for discovery call',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user: { name: 'Jane Smith' },
          metadata: {
            title: 'Initial Discovery Meeting',
            start_time: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in the future
            end_time: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(), // 1 hour later
            location: 'Zoom Meeting',
            status: 'rescheduled',
            action: 'updated'
          }
        },
        {
          id: 6,
          type: 'status_change',
          content: 'Changed status from New to Qualified',
          created_at: new Date().toISOString(),
          user: { name: 'Jane Smith' }
        }
      ];
      
      // Filter by interaction types if provided
      if (interactionTypes && interactionTypes.length > 0) {
        return mockTimeline
          .filter(item => interactionTypes.includes(item.type))
          .slice(0, limit);
      }
      
      return mockTimeline.slice(0, limit);
    } else {
      // Use real data from Supabase
      console.log(`Fetching timeline for lead ID: ${leadId}`);
      
      // Use a simple query without any joins to the users table
      let query = supabase
        .from('activities')
        .select('*') // Do NOT join with users table
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Filter by interaction types if provided
      if (interactionTypes && interactionTypes.length > 0) {
        query = query.in('activity_type', interactionTypes);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching lead timeline:', JSON.stringify(error));
        throw new Error(`Error fetching lead timeline: ${error.message || JSON.stringify(error)}`);
      }
      
      // Map the activities to a format compatible with the frontend
      // Create a minimal user object without querying the users table
      const timeline = (data || []).map(activity => ({
        id: activity.id,
        type: activity.activity_type || 'unknown',
        content: activity.metadata?.content || `${activity.activity_type || 'Unknown'} activity`,
        created_at: activity.created_at,
        user: {
          id: activity.user_id || '0',
          name: 'User' // Don't try to fetch the actual user name
        },
        metadata: activity.metadata || {}
      }));
      
      return timeline;
    }
  } catch (error: any) {
    console.error('Error in getLeadTimeline function:', error);
    throw new Error(error.message || 'Failed to fetch lead timeline');
  }
};

// Get lead campaigns
export const getLeadCampaigns = async (leadId: number, includeRemoved: boolean = false): Promise<any[]> => {
  let query = supabase
    .from('lead_campaigns')
    .select('*, campaign:campaigns(*)')
    .eq('lead_id', leadId);
  
  if (!includeRemoved) {
    query = query.neq('status', 'REMOVED');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching lead campaigns:', error);
    throw new Error(error.message);
  }
  
  return data;
};

// Add lead to campaign
export const addLeadToCampaign = async (campaignId: string, leadId: string): Promise<CampaignLead> => {
  const campaignLead = {
    campaign_id: campaignId,
    lead_id: leadId,
    status: 'active',
    added_by: 'system',
    added_at: new Date().toISOString(),
    notes: ''
  };
  
  const response = await apiClient.post<any>('/api/campaign-leads', campaignLead);
  
  if (response.error) {
    throw new Error(`Failed to add lead to campaign: ${response.error.message}`);
  }
  
  return response.data as CampaignLead;
};

// Remove lead from campaign
export const removeLeadFromCampaign = async (
  leadId: number,
  campaignId: number,
  notes?: string
): Promise<void> => {
  const queryParams = new URLSearchParams();
  if (notes) queryParams.append('notes', notes);
  
  const response = await apiClient.delete<void>(
    `${BASE_URL}/${leadId}/campaigns/${campaignId}?${queryParams.toString()}`
  );
  
  if (response.error) {
    throw new Error(`Failed to remove lead from campaign: ${response.error.message}`);
  }
};

// Update lead campaign status
export const updateLeadCampaignStatus = async (
  leadId: number,
  campaignId: number,
  status: LeadCampaignStatus,
  notes?: string,
  metadata?: Record<string, any>
): Promise<CampaignLead> => {
  const response = await apiClient.put<CampaignLead>(
    `${BASE_URL}/${leadId}/campaigns/${campaignId}`,
    { status, notes, metadata }
  );
  
  if (response.error) {
    throw new Error(`Failed to update lead campaign status: ${response.error.message}`);
  }
  
  return response.data;
};

// Bulk add leads to campaign
export const bulkAddLeadsToCampaign = async (
  campaignId: number,
  leadIds: number[],
  status: LeadCampaignStatus = LeadCampaignStatus.ADDED,
  notes?: string
): Promise<any> => {
  return apiClient.post<any>(
    `${BASE_URL}/bulk-add-to-campaign`,
    { campaign_id: campaignId, lead_ids: leadIds, status, notes }
  );
};

// Get lead insights with ML-based predictions
export const getLeadInsights = async (leadId: number): Promise<any> => {
  try {
    // Validate leadId
    if (isNaN(leadId) || leadId <= 0) {
      console.error(`Invalid lead ID: ${leadId}`);
      throw new Error(`Invalid lead ID: ${leadId}`);
    }
    
    if (getMockDataStatus()) {
      console.log(`Using enhanced mock insights data for lead ID: ${leadId}`);
      
      // First, try to get some basic lead info to make the mock data more realistic
      let leadData: any = null;
      try {
        const { data } = await supabase
          .from('leads')
          .select('id, first_name, last_name, email, status, created_at, lead_score')
          .eq('id', leadId)
          .single();
        
        leadData = data;
      } catch (e) {
        console.log('Could not fetch lead data for insights, using generic mock data');
      }
      
      // Generate a deterministic but seemingly random score based on the lead ID
      // This ensures the same lead always gets the same score
      const baseScore = ((leadId * 13) % 100) / 100; // Between 0 and 1
      const conversionProbability = leadData?.lead_score 
        ? leadData.lead_score / 10 // Use the actual lead score if available
        : 0.4 + (baseScore * 0.5); // Otherwise generate a score between 0.4 and 0.9
      
      // Generate engagement factors based on lead status
      const status = leadData?.status || 'New';
      const engagementFactors = generateEngagementFactors(status, leadId);
      
      // Generate recommendations based on conversion probability
      const recommendations = generateRecommendations(conversionProbability, status, leadId);
      
      // Return enhanced mock insights data
      return {
        score_factors: engagementFactors,
        recommendations: recommendations,
        conversion_probability: parseFloat(conversionProbability.toFixed(2)),
        lead_id: leadId,
        last_calculated_at: new Date().toISOString(),
        // Add some metadata about how the score was calculated
        metadata: {
          calculation_method: "predictive_scoring_v1",
          data_points_used: engagementFactors.length,
          confidence_level: "medium",
          next_recommended_action: recommendations[0]?.text || "Follow up"
        }
      };
    } else {
      // If ML insights are enabled, use the ML service
      if (USE_ML_INSIGHTS) {
        console.log(`Using ML service for lead insights: ${leadId}`);
        
        try {
          // Check if we have a recent prediction in the database
          const { data: existingPrediction, error: predictionError } = await supabase
            .from('ml_predictions')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          // If we have a recent prediction (less than 24 hours old), use it
          if (!predictionError && existingPrediction && existingPrediction.length > 0) {
            const prediction = existingPrediction[0];
            const predictionAge = new Date().getTime() - new Date(prediction.created_at).getTime();
            const predictionAgeHours = predictionAge / (1000 * 60 * 60);
            
            if (predictionAgeHours < 24) {
              console.log(`Using existing prediction from ${predictionAgeHours.toFixed(1)} hours ago`);
              return {
                score_factors: prediction.score_factors,
                recommendations: prediction.recommendations,
                conversion_probability: prediction.conversion_probability,
                lead_id: leadId,
                last_calculated_at: prediction.created_at,
                expected_conversion_time: prediction.expected_conversion_time,
                confidence: prediction.confidence,
                model_id: prediction.model_id,
                model_version: prediction.model_version
              };
            }
          }
          
          // Generate a new prediction
          console.log(`Generating new ML prediction for lead ID: ${leadId}`);
          const prediction = await mlService.predictConversion(leadId);
          
          return {
            score_factors: prediction.score_factors,
            recommendations: prediction.recommendations,
            conversion_probability: prediction.conversion_probability,
            lead_id: leadId,
            last_calculated_at: prediction.created_at,
            expected_conversion_time: prediction.expected_conversion_time,
            confidence: prediction.confidence,
            model_id: prediction.model_id,
            model_version: prediction.model_version
          };
        } catch (mlError) {
          console.error('Error using ML service, falling back to database:', mlError);
          // Fall back to database query
        }
      }
      
      // Query the lead_insights table
      console.log(`Fetching insights for lead ID: ${leadId}`);
      
      const { data, error } = await supabase
        .from('lead_insights')
        .select('*')
        .eq('lead_id', leadId)
        .single();
      
      if (error) {
        // If the table doesn't exist or there's another error, log it and return mock data
        console.error('Error fetching lead insights:', JSON.stringify(error));
        console.log('Falling back to mock insights data');
        
        return {
          score_factors: [
            { factor: "Recent engagement", impact: 0.8, description: "Opened emails in the last 7 days" },
            { factor: "Website visits", impact: 0.6, description: "Visited pricing page 3 times" },
            { factor: "Response time", impact: -0.3, description: "Slow response to last outreach" }
          ],
          recommendations: [
            { text: "Schedule a product demo", priority: "high" },
            { text: "Share case study on similar company", priority: "medium" },
            { text: "Follow up on pricing discussion", priority: "medium" }
          ],
          conversion_probability: 0.75,
          lead_id: leadId
        };
      }
      
      // If no data found, return mock data
      if (!data) {
        console.log('No insights found for lead, returning mock data');
        
        return {
          score_factors: [
            { factor: "Recent engagement", impact: 0.8, description: "Opened emails in the last 7 days" },
            { factor: "Website visits", impact: 0.6, description: "Visited pricing page 3 times" },
            { factor: "Response time", impact: -0.3, description: "Slow response to last outreach" }
          ],
          recommendations: [
            { text: "Schedule a product demo", priority: "high" },
            { text: "Share case study on similar company", priority: "medium" },
            { text: "Follow up on pricing discussion", priority: "medium" }
          ],
          conversion_probability: 0.75,
          lead_id: leadId
        };
      }
      
      return data;
    }
  } catch (error: any) {
    console.error('Error in getLeadInsights function:', error);
    throw new Error(error.message || 'Failed to get lead insights');
  }
};

// Helper function to generate engagement factors based on lead status
function generateEngagementFactors(status: string, leadId: number) {
  // Use the lead ID to create deterministic but seemingly random factors
  const seed = leadId % 10;
  
  // Base factors that apply to all leads
  const baseFactors = [
    { 
      factor: "Email engagement", 
      impact: 0.4 + (seed / 20), 
      description: "Opens and clicks on emails" 
    }
  ];
  
  // Status-specific factors
  const statusFactors: Record<string, any[]> = {
    'New': [
      { 
        factor: "New lead", 
        impact: 0.7, 
        description: "Recently added to the system" 
      },
      { 
        factor: "No prior contact", 
        impact: -0.2, 
        description: "No previous interactions" 
      }
    ],
    'Contacted': [
      { 
        factor: "Recent contact", 
        impact: 0.6, 
        description: "Recently contacted by sales team" 
      },
      { 
        factor: "Response pending", 
        impact: 0.1, 
        description: "Waiting for response" 
      }
    ],
    'Qualified': [
      { 
        factor: "Qualification criteria", 
        impact: 0.8, 
        description: "Meets all qualification criteria" 
      },
      { 
        factor: "Budget confirmed", 
        impact: 0.7, 
        description: "Has confirmed budget availability" 
      }
    ],
    'Proposal': [
      { 
        factor: "Proposal review", 
        impact: 0.9, 
        description: "Currently reviewing proposal" 
      },
      { 
        factor: "Competitive situation", 
        impact: -0.3, 
        description: "Evaluating multiple vendors" 
      }
    ],
    'Negotiation': [
      { 
        factor: "Price sensitivity", 
        impact: -0.4, 
        description: "Negotiating on price points" 
      },
      { 
        factor: "Decision timeline", 
        impact: 0.6, 
        description: "Decision expected within 2 weeks" 
      }
    ],
    'Closed Won': [
      { 
        factor: "Customer success", 
        impact: 0.9, 
        description: "Successfully converted to customer" 
      },
      { 
        factor: "Upsell opportunity", 
        impact: 0.7, 
        description: "Potential for additional products/services" 
      }
    ],
    'Closed Lost': [
      { 
        factor: "Competitor selection", 
        impact: -0.9, 
        description: "Selected a competitor's solution" 
      },
      { 
        factor: "Reengagement potential", 
        impact: 0.3, 
        description: "Potential to reengage in 6 months" 
      }
    ]
  };
  
  // Get factors for the current status or default to 'New'
  const currentStatusFactors = statusFactors[status] || statusFactors['New'];
  
  // Additional random factors based on lead ID
  const additionalFactors = [
    { 
      factor: "Website visits", 
      impact: 0.3 + (seed / 30), 
      description: `Visited ${1 + (seed % 5)} pages on the website` 
    },
    { 
      factor: "Content downloads", 
      impact: 0.4 + (seed / 25), 
      description: seed % 2 === 0 ? "Downloaded whitepaper" : "Downloaded case study" 
    },
    { 
      factor: "Social media engagement", 
      impact: 0.2 + (seed / 40), 
      description: "Engaged with social media posts" 
    },
    { 
      factor: "Response time", 
      impact: -0.3 + (seed / 30), 
      description: "Slow to respond to outreach" 
    },
    { 
      factor: "Meeting attendance", 
      impact: 0.6 + (seed / 20), 
      description: "Attended scheduled meetings" 
    }
  ];
  
  // Select a subset of additional factors based on lead ID
  const selectedAdditionalFactors = additionalFactors.filter((_, index) => {
    return (leadId + index) % 3 === 0;
  });
  
  // Combine all factors
  return [...baseFactors, ...currentStatusFactors, ...selectedAdditionalFactors];
}

// Helper function to generate recommendations based on conversion probability and status
function generateRecommendations(probability: number, status: string, leadId: number) {
  // Use the lead ID to create deterministic but seemingly random recommendations
  const seed = leadId % 10;
  
  // Base recommendations for all leads
  const baseRecommendations = [
    { 
      text: "Update contact information", 
      priority: "low" 
    }
  ];
  
  // Status-specific recommendations
  const statusRecommendations: Record<string, any[]> = {
    'New': [
      { 
        text: "Send welcome email", 
        priority: "high" 
      },
      { 
        text: "Connect on LinkedIn", 
        priority: "medium" 
      },
      { 
        text: "Add to nurture campaign", 
        priority: "high" 
      }
    ],
    'Contacted': [
      { 
        text: "Follow up on initial contact", 
        priority: "high" 
      },
      { 
        text: "Share relevant case study", 
        priority: "medium" 
      },
      { 
        text: "Invite to upcoming webinar", 
        priority: "medium" 
      }
    ],
    'Qualified': [
      { 
        text: "Schedule product demo", 
        priority: "high" 
      },
      { 
        text: "Send pricing information", 
        priority: "high" 
      },
      { 
        text: "Introduce to technical team", 
        priority: "medium" 
      }
    ],
    'Proposal': [
      { 
        text: "Follow up on proposal", 
        priority: "high" 
      },
      { 
        text: "Address outstanding questions", 
        priority: "high" 
      },
      { 
        text: "Prepare for negotiation", 
        priority: "medium" 
      }
    ],
    'Negotiation': [
      { 
        text: "Prepare final offer", 
        priority: "high" 
      },
      { 
        text: "Schedule decision meeting", 
        priority: "high" 
      },
      { 
        text: "Prepare implementation plan", 
        priority: "medium" 
      }
    ],
    'Closed Won': [
      { 
        text: "Schedule onboarding call", 
        priority: "high" 
      },
      { 
        text: "Introduce to customer success team", 
        priority: "high" 
      },
      { 
        text: "Explore upsell opportunities", 
        priority: "medium" 
      }
    ],
    'Closed Lost': [
      { 
        text: "Send thank you note", 
        priority: "medium" 
      },
      { 
        text: "Schedule follow-up in 3 months", 
        priority: "medium" 
      },
      { 
        text: "Request feedback on decision", 
        priority: "high" 
      }
    ]
  };
  
  // Get recommendations for the current status or default to 'New'
  const currentStatusRecommendations = statusRecommendations[status] || statusRecommendations['New'];
  
  // Additional recommendations based on conversion probability
  let probabilityRecommendations = [];
  
  if (probability < 0.3) {
    // Low probability recommendations
    probabilityRecommendations = [
      { 
        text: "Qualify lead interest level", 
        priority: "high" 
      },
      { 
        text: "Add to nurture campaign", 
        priority: "medium" 
      }
    ];
  } else if (probability < 0.7) {
    // Medium probability recommendations
    probabilityRecommendations = [
      { 
        text: "Schedule discovery call", 
        priority: "high" 
      },
      { 
        text: "Share relevant content", 
        priority: "medium" 
      }
    ];
  } else {
    // High probability recommendations
    probabilityRecommendations = [
      { 
        text: "Accelerate sales process", 
        priority: "high" 
      },
      { 
        text: "Involve decision makers", 
        priority: "high" 
      }
    ];
  }
  
  // Additional random recommendations based on lead ID
  const additionalRecommendations = [
    { 
      text: "Send industry whitepaper", 
      priority: seed % 3 === 0 ? "high" : "medium" 
    },
    { 
      text: "Invite to customer event", 
      priority: seed % 2 === 0 ? "medium" : "low" 
    },
    { 
      text: "Share product roadmap", 
      priority: "medium" 
    },
    { 
      text: "Offer free trial extension", 
      priority: "medium" 
    },
    { 
      text: "Schedule technical deep dive", 
      priority: "high" 
    }
  ];
  
  // Select a subset of additional recommendations based on lead ID
  const selectedAdditionalRecommendations = additionalRecommendations.filter((_, index) => {
    return (leadId + index) % 4 === 0;
  });
  
  // Combine all recommendations and sort by priority
  const allRecommendations = [
    ...baseRecommendations, 
    ...currentStatusRecommendations.slice(0, 2), // Take top 2 status recommendations
    ...probabilityRecommendations.slice(0, 1),   // Take top 1 probability recommendation
    ...selectedAdditionalRecommendations.slice(0, 1) // Take top 1 additional recommendation
  ];
  
  // Sort by priority (high, medium, low)
  const priorityOrder = { "high": 0, "medium": 1, "low": 2 };
  return allRecommendations.sort((a, b) => {
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });
}

// Add a note to a lead
export const addLeadNote = async (
  leadId: number, 
  content: string, 
  isPrivate: boolean = false
): Promise<any> => {
  try {
    // Validate leadId
    if (isNaN(leadId) || leadId <= 0) {
      console.error(`Invalid lead ID: ${leadId}`);
      throw new Error(`Invalid lead ID: ${leadId}`);
    }
    
    if (getMockDataStatus()) {
      console.log(`Using mock data for adding note to lead ID: ${leadId}`);
      
      // Return mock note data
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        lead_id: leadId,
        body: content,
        created_by: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      console.log(`Adding note to lead ID: ${leadId}`);
      
      // Get the current user ID safely
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.warn('Could not get current user, continuing without user ID');
      }
      
      // Create the note
      const newNote = {
        lead_id: leadId,
        body: content, // The notes table uses 'body' instead of 'content'
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert the note
      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding lead note:', JSON.stringify(error));
        throw new Error(`Error adding lead note: ${error.message || JSON.stringify(error)}`);
      }
      
      // Log the activity separately, but don't let it block the note creation
      try {
        if (userId) {
          const activityData = {
            lead_id: leadId,
            user_id: userId,
            activity_type: 'note',
            activity_id: data.id,
            metadata: {
              content: content.length > 50 ? content.substring(0, 50) + '...' : content
            },
            created_at: new Date().toISOString()
          };
          
          await supabase.from('activities').insert(activityData);
        }
      } catch (activityError) {
        console.error('Error logging note activity:', activityError);
        // Don't throw here, as the note was already created
      }
      
      return data;
    }
  } catch (error: any) {
    console.error('Error in addLeadNote function:', error);
    throw new Error(error.message || 'Failed to add lead note');
  }
};

// Calculate insights for all leads or a specific set of leads
export const calculateLeadInsights = async (
  leadIds?: number[],
  limit: number = 100
): Promise<{ processed: number; errors: number }> => {
  try {
    console.log(`Calculating insights for ${leadIds ? leadIds.length : limit} leads`);
    
    if (getMockDataStatus()) {
      return {
        processed: leadIds?.length || limit,
        errors: 0
      };
    }
    
    // If ML insights are enabled, use the ML service
    if (USE_ML_INSIGHTS) {
      try {
        // Get the leads to process
        let leadsQuery = supabase.from('leads').select('id');
        
        // If specific lead IDs are provided, use those
        if (leadIds && leadIds.length > 0) {
          leadsQuery = leadsQuery.in('id', leadIds);
        } else {
          // Otherwise, get the most recently updated leads
          leadsQuery = leadsQuery.order('updated_at', { ascending: false }).limit(limit);
        }
        
        const { data: leads, error: leadsError } = await leadsQuery;
        
        if (leadsError) {
          console.error('Error fetching leads for insight calculation:', JSON.stringify(leadsError));
          throw new Error(`Error fetching leads: ${leadsError.message || JSON.stringify(leadsError)}`);
        }
        
        if (!leads || leads.length === 0) {
          console.log('No leads found for insight calculation');
          return { processed: 0, errors: 0 };
        }
        
        console.log(`Processing insights for ${leads.length} leads using ML service`);
        
        // Extract lead IDs
        const leadIdsToProcess = leads.map(lead => lead.id);
        
        // Extract features for all leads
        const leadFeaturesData = await mlService.batchExtractFeatures(leadIdsToProcess);
        
        // Generate predictions for all leads
        const predictions = await mlService.batchPredictConversion(leadFeaturesData);
        
        console.log(`Generated predictions for ${predictions.length} leads`);
        
        // Store the predictions in the lead_insights table
        let processed = 0;
        let errors = 0;
        
        for (const prediction of predictions) {
          try {
            const insightData = {
              lead_id: prediction.lead_id,
              score_factors: prediction.score_factors,
              recommendations: prediction.recommendations,
              conversion_probability: prediction.conversion_probability,
              last_calculated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: upsertError } = await supabase
              .from('lead_insights')
              .upsert(insightData, { onConflict: 'lead_id' });
            
            if (upsertError) {
              console.error(`Error upserting insights for lead ${prediction.lead_id}:`, JSON.stringify(upsertError));
              errors++;
            } else {
              processed++;
            }
          } catch (leadError) {
            console.error(`Error processing insights for lead ${prediction.lead_id}:`, leadError);
            errors++;
          }
        }
        
        console.log(`Completed ML insight calculation: ${processed} processed, ${errors} errors`);
        return { processed, errors };
      } catch (mlError) {
        console.error('Error using ML service for batch insights:', mlError);
        // Fall back to the rule-based approach
      }
    }
    
    // Get the leads to process
    let leadsQuery = supabase.from('leads').select('id, status, lead_score, created_at');
    
    // If specific lead IDs are provided, use those
    if (leadIds && leadIds.length > 0) {
      leadsQuery = leadsQuery.in('id', leadIds);
    } else {
      // Otherwise, get the most recently updated leads
      leadsQuery = leadsQuery.order('updated_at', { ascending: false }).limit(limit);
    }
    
    const { data: leads, error: leadsError } = await leadsQuery;
    
    if (leadsError) {
      console.error('Error fetching leads for insight calculation:', JSON.stringify(leadsError));
      throw new Error(`Error fetching leads: ${leadsError.message || JSON.stringify(leadsError)}`);
    }
    
    if (!leads || leads.length === 0) {
      console.log('No leads found for insight calculation');
      return { processed: 0, errors: 0 };
    }
    
    console.log(`Processing insights for ${leads.length} leads`);
    
    // Process each lead
    let processed = 0;
    let errors = 0;
    
    for (const lead of leads) {
      try {
        // Calculate a conversion probability based on lead properties
        // This is a simplified model - in a real system, you'd use a more sophisticated algorithm
        let conversionProbability = 0.5; // Default
        
        // Adjust based on lead score if available
        if (lead.lead_score) {
          conversionProbability = Math.min(0.95, lead.lead_score / 10);
        }
        
        // Adjust based on status
        const statusBoost: Record<string, number> = {
          'New': 0,
          'Contacted': 0.1,
          'Qualified': 0.3,
          'Proposal': 0.5,
          'Negotiation': 0.7,
          'Closed Won': 1.0,
          'Closed Lost': 0
        };
        
        conversionProbability += (statusBoost[lead.status] || 0) * 0.2;
        conversionProbability = Math.min(0.95, Math.max(0.05, conversionProbability));
        
        // Generate factors and recommendations using our helper functions
        const engagementFactors = generateEngagementFactors(lead.status, lead.id);
        const recommendations = generateRecommendations(conversionProbability, lead.status, lead.id);
        
        // Create or update the insights record
        const insightData = {
          lead_id: lead.id,
          score_factors: engagementFactors,
          recommendations: recommendations,
          conversion_probability: parseFloat(conversionProbability.toFixed(2)),
          last_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: upsertError } = await supabase
          .from('lead_insights')
          .upsert(insightData, { onConflict: 'lead_id' });
        
        if (upsertError) {
          console.error(`Error upserting insights for lead ${lead.id}:`, JSON.stringify(upsertError));
          errors++;
        } else {
          processed++;
        }
      } catch (leadError) {
        console.error(`Error processing insights for lead ${lead.id}:`, leadError);
        errors++;
      }
    }
    
    console.log(`Completed insight calculation: ${processed} processed, ${errors} errors`);
    return { processed, errors };
  } catch (error: any) {
    console.error('Error in calculateLeadInsights function:', error);
    throw new Error(error.message || 'Failed to calculate lead insights');
  }
};

// Fix the getAuthToken issue
export const getAuthToken = () => {
  // Use the apiClient's getAuthToken method
  return apiClient.getAuthToken();
};

/**
 * Get leads in low conversion probability workflows
 */
export const getLowConversionLeads = async (options?: { 
  limit?: number,
  workflowId?: string
}) => {
  try {
    const limit = options?.limit || 100;
    let query = supabase
      .from('leads')
      .select(`
        id, 
        name, 
        email, 
        company, 
        status, 
        created_at,
        updated_at,
        lead_insights (conversion_probability),
        automations (
          id,
          name,
          type,
          current_stage
        )
      `)
      .lt('lead_insights.conversion_probability', 0.4)
      .order('updated_at', { ascending: false });
    
    if (options?.workflowId) {
      query = query.eq('automations.id', options.workflowId);
    }
      
    const { data, error } = await query.limit(limit);
    
    if (error) {
      console.error('Error fetching low conversion leads:', error);
      return { error };
    }
    
    // Format the data for the frontend
    const formattedLeads = data.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company || '',
      status: lead.status,
      conversion_probability: lead.lead_insights?.conversion_probability || 0.3,
      workflow_name: lead.automations?.name || 'Default Nurture',
      workflow_stage: lead.automations?.current_stage || 'early_nurture',
      days_in_pipeline: Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 3600 * 24)),
      last_activity: lead.updated_at,
    }));
    
    return { data: formattedLeads };
  } catch (error) {
    console.error('Error in getLowConversionLeads:', error);
    return { error };
  }
};

/**
 * Agent intervention for a low conversion lead
 */
export const agentIntervene = async (leadId: number, options: {
  action: 'manual_takeover' | 'add_task' | 'send_message',
  message?: string,
  taskDetails?: any
}) => {
  try {
    // First, get the current lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, 
        name, 
        automations (id, name)
      `)
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.error('Error fetching lead for intervention:', leadError);
      return { error: leadError };
    }
    
    // Record the agent intervention action
    const { error: interventionError } = await supabase
      .from('lead_actions')
      .insert({
        lead_id: leadId,
        action_type: 'agent_intervention',
        action_details: {
          intervention_type: options.action,
          workflow_before: lead.automations?.name || 'None',
          agent_id: getCurrentUserId(), // Assuming this function exists
          timestamp: new Date().toISOString(),
          message: options.message,
          task_details: options.taskDetails
        }
      });
    
    if (interventionError) {
      console.error('Error recording intervention:', interventionError);
      // Continue anyway as this is not critical
    }
    
    if (options.action === 'manual_takeover') {
      // Remove from automation workflow
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'engaged', // Move to an active status
          assigned_to: getCurrentUserId(), // Assign to current user
          automation_id: null, // Remove from automated workflow
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
      
      if (updateError) {
        console.error('Error updating lead for manual takeover:', updateError);
        return { error: updateError };
      }
      
      // Create a task for follow-up
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          lead_id: leadId,
          assigned_to: getCurrentUserId(),
          title: `Follow up with ${lead.name}`,
          description: 'Manual intervention from low conversion workflow',
          priority: 'high',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          status: 'not_started'
        });
      
      if (taskError) {
        console.error('Error creating follow-up task:', taskError);
        // Continue anyway as the main action succeeded
      }
    } else if (options.action === 'send_message' && options.message) {
      // Send a manual message while keeping in automation
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          lead_id: leadId,
          sender_id: getCurrentUserId(),
          message_type: 'email', // Or could be from options
          content: options.message,
          sent_at: new Date().toISOString(),
          status: 'queued'
        });
      
      if (messageError) {
        console.error('Error creating message:', messageError);
        return { error: messageError };
      }
    } else if (options.action === 'add_task' && options.taskDetails) {
      // Add a task while keeping in automation
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          lead_id: leadId,
          assigned_to: getCurrentUserId(),
          title: options.taskDetails.title,
          description: options.taskDetails.description,
          priority: options.taskDetails.priority || 'medium',
          due_date: options.taskDetails.due_date,
          status: 'not_started'
        });
      
      if (taskError) {
        console.error('Error creating task:', taskError);
        return { error: taskError };
      }
    }
    
    return { success: true, data: { leadId } };
  } catch (error) {
    console.error('Error in agentIntervene:', error);
    return { error };
  }
};

/**
 * Update a lead's workflow stage
 */
export const updateLeadWorkflowStage = async (leadId: number, stage: string) => {
  try {
    // Get the current lead automation
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, 
        name, 
        automation_id,
        automations (id, name)
      `)
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.error('Error fetching lead for workflow update:', leadError);
      return { error: leadError };
    }
    
    if (!lead.automation_id) {
      return { error: { message: 'Lead is not in an automation workflow' } };
    }
    
    // Update the automation stage
    const { error: updateError } = await supabase
      .from('automations')
      .update({
        current_stage: stage,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.automation_id);
    
    if (updateError) {
      console.error('Error updating workflow stage:', updateError);
      return { error: updateError };
    }
    
    // Record the stage change
    const { error: logError } = await supabase
      .from('automation_logs')
      .insert({
        automation_id: lead.automation_id,
        lead_id: leadId,
        action: 'stage_change',
        details: {
          new_stage: stage,
          changed_by: getCurrentUserId(),
          manual_change: true
        },
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Error logging stage change:', logError);
      // Continue anyway as the main action succeeded
    }
    
    return { success: true, data: { stage } };
  } catch (error) {
    console.error('Error in updateLeadWorkflowStage:', error);
    return { error };
  }
};

// Helper function to get current user ID
const getCurrentUserId = () => {
  const session = supabase.auth.session();
  return session?.user?.id || 'system';
}; 