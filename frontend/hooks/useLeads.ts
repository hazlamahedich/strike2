import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';
import { Lead, LeadCreate as FrontendLeadCreate, LeadUpdate, LeadFormValues } from '../types/lead';
import { createLead as apiCreateLead, bulkCreateLeads as apiBulkCreateLeads } from '../lib/api/leads';

// Mock data for development
const mockLeads: Lead[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company_name: 'Acme Inc.',
    job_title: 'CEO',
    status: 'New',
    source: 'Website',
    notes: 'Initial contact via contact form',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: 'user1',
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    company_name: 'XYZ Corp',
    job_title: 'Marketing Director',
    status: 'Contacted',
    source: 'Referral',
    notes: 'Referred by John Doe',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    owner_id: 'user1',
  },
  {
    id: '3',
    first_name: 'Robert',
    last_name: 'Johnson',
    email: 'robert.johnson@example.com',
    phone: '+1 (555) 456-7890',
    company_name: 'Johnson & Co',
    job_title: 'Sales Manager',
    status: 'Qualified',
    source: 'Email Campaign',
    notes: 'Interested in enterprise plan',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    owner_id: 'user2',
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 789-0123',
    company_name: 'Davis Enterprises',
    job_title: 'CTO',
    status: 'Negotiation',
    source: 'Social Media',
    notes: 'Discussing custom implementation',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    owner_id: 'user1',
  },
  {
    id: '5',
    first_name: 'Michael',
    last_name: 'Wilson',
    email: 'michael.wilson@example.com',
    phone: '+1 (555) 321-6547',
    company_name: 'Wilson Tech',
    job_title: 'Product Manager',
    status: 'Won',
    source: 'Event',
    notes: 'Signed contract for premium plan',
    created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    owner_id: 'user2',
  },
  {
    id: '6',
    first_name: 'Sarah',
    last_name: 'Brown',
    email: 'sarah.brown@example.com',
    phone: '+1 (555) 654-9870',
    company_name: 'Brown & Associates',
    job_title: 'HR Director',
    status: 'Lost',
    source: 'Cold Call',
    notes: 'Went with competitor solution',
    created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    owner_id: 'user1',
  },
  {
    id: '7',
    first_name: 'David',
    last_name: 'Miller',
    email: 'david.miller@example.com',
    phone: '+1 (555) 147-2583',
    company_name: 'Miller Consulting',
    job_title: 'Consultant',
    status: 'Unqualified',
    source: 'Website',
    notes: 'Budget too small for our services',
    created_at: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    updated_at: new Date(Date.now() - 518400000).toISOString(),
    owner_id: 'user2',
  },
];

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      // In a real app, this would be an API call
      // const response = await fetch('/api/leads');
      // const data = await response.json();
      
      // Using mock data for now
      setTimeout(() => {
        setLeads(mockLeads);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leads'));
      setIsError(true);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [toast]);

  const refetch = () => {
    fetchLeads();
  };

  return {
    leads,
    isLoading,
    isError,
    error,
    refetch
  };
}

export function useCreateLead() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');

  const createLead = async (
    leadData: LeadFormValues, 
    handleDuplicates: 'skip' | 'update' | 'create_new' = 'skip'
  ): Promise<Lead | null> => {
    try {
      setIsSubmitting(true);
      setDuplicateFound(false);
      
      // Map frontend form values to API model
      const apiLeadData = {
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email || undefined,
        phone: leadData.phone || undefined,
        company: leadData.company_name || undefined,
        title: leadData.job_title || undefined,
        source: leadData.source || 'website',
        status: leadData.status || 'new',
        owner_id: leadData.owner_id ? leadData.owner_id : undefined,
        custom_fields: leadData.custom_fields || {},
        linkedin_url: leadData.linkedin_url || undefined,
        facebook_url: leadData.facebook_url || undefined,
        twitter_url: leadData.twitter_url || undefined,
        campaign_ids: leadData.campaign_id ? [leadData.campaign_id] : undefined
      };
      
      // Call the API
      try {
        const newLead = await apiCreateLead(apiLeadData as any, handleDuplicates);
        
        // Convert API response to frontend model
        const frontendLead: Lead = {
          ...newLead,
          id: String(newLead.id),
          company_name: newLead.company || '',
          job_title: newLead.title || '',
          owner_id: newLead.owner_id ? String(newLead.owner_id) : undefined
        };
        
        setIsSubmitting(false);
        return frontendLead;
      } catch (error: any) {
        // Check if the error is due to a duplicate
        if (error.response && error.response.status === 409) {
          setDuplicateFound(true);
          setDuplicateHandling('skip'); // Reset to default
          throw new Error('Duplicate lead found');
        }
        throw error;
      }
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    createLead,
    isSubmitting,
    duplicateFound,
    duplicateHandling,
    setDuplicateHandling
  };
}

export function useUpdateLead() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Use useCallback to memoize the updateLead function
  const updateLead = useCallback(async (leadId: string, leadData: any): Promise<Lead | null> => {
    try {
      setIsSubmitting(true);
      
      // In a real app, this would be an API call
      // const response = await fetch(`/api/leads/${leadId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(leadData),
      // });
      // const data = await response.json();
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First try to update in mockLeads array
      const leadIndex = mockLeads.findIndex(lead => String(lead.id) === String(leadId));
      
      console.log('useUpdateLead - leadId:', leadId);
      console.log('useUpdateLead - leadIndex:', leadIndex);
      console.log('useUpdateLead - mockLeads:', mockLeads);
      
      if (leadIndex !== -1) {
        // Update the lead in the mockLeads array
        const updatedLead = {
          ...mockLeads[leadIndex],
          ...leadData,
          // Map fields if needed
          company_name: leadData.company_name || leadData.company,
          job_title: leadData.job_title || leadData.title,
          updated_at: new Date().toISOString()
        };
        
        // Update the lead in the array
        mockLeads[leadIndex] = updatedLead;
        
        console.log('Updated lead in mockLeads:', updatedLead);
        
        setIsSubmitting(false);
        return updatedLead;
      } else {
        // If not found in mockLeads, try the hardcoded mockLeadDetails as fallback
        // This is for compatibility with the lead detail page
        const mockLeadDetails: Record<string, any> = {
          '1': {
            id: 1,
            first_name: 'John',
            last_name: 'Smith',
            full_name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            company: 'Smith Enterprises',
            title: 'CEO',
            source: 'website',
            status: 'new',
            owner_id: 1,
            team_id: 1,
            custom_fields: {
              address: '123 Main St, San Francisco, CA 94105'
            },
            lead_score: 8.5,
            created_at: '2023-05-15T10:30:00Z',
            updated_at: '2023-05-15T10:30:00Z',
            owner: { id: 1, name: 'Jane Doe' }
          }
        };
        
        if (mockLeadDetails[leadId]) {
          // Update the lead in mockLeadDetails
          const updatedLead = {
            ...mockLeadDetails[leadId],
            ...leadData,
            full_name: `${leadData.first_name || mockLeadDetails[leadId].first_name} ${leadData.last_name || mockLeadDetails[leadId].last_name}`,
            updated_at: new Date().toISOString()
          };
          
          // Update the lead in the object
          mockLeadDetails[leadId] = updatedLead;
          
          console.log('Updated lead in mockLeadDetails:', updatedLead);
          
          setIsSubmitting(false);
          return updatedLead;
        } else {
          throw new Error('Lead not found');
        }
      }
    } catch (err) {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]); // Only depend on toast

  return {
    updateLead,
    isSubmitting,
  };
}

export function useGetLead() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with false to prevent immediate loading
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Use useCallback to memoize the fetchLead function
  const fetchLead = useCallback(async (leadId: string) => {
    console.log('useGetLead - fetchLead called with leadId:', leadId);
    
    // Reset state before fetching
    setError(null);
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/leads/${leadId}`);
      // const data = await response.json();
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the lead in the mockLeads array
      console.log('useGetLead - mockLeads:', mockLeads);
      // Convert leadId to string for comparison if needed
      const foundLead = mockLeads.find(lead => String(lead.id) === String(leadId));
      console.log('useGetLead - foundLead from mockLeads:', foundLead);
      
      if (foundLead) {
        // Convert the lead to the expected format if needed
        const formattedLead = {
          ...foundLead,
          // Add any additional fields needed for the lead detail page
          company: foundLead.company_name,
          title: foundLead.job_title,
          // Add any other fields needed
        };
        
        console.log('useGetLead - formattedLead:', formattedLead);
        setLead(formattedLead);
      } else {
        // If not found in mockLeads, try the hardcoded mockLeadDetails as fallback
        // This is for compatibility with the lead detail page
        const mockLeadDetails: Record<string, any> = {
          '1': {
            id: 1,
            first_name: 'John',
            last_name: 'Smith',
            full_name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            company: 'Smith Enterprises',
            title: 'CEO',
            source: 'website',
            status: 'new',
            owner_id: 1,
            team_id: 1,
            custom_fields: {
              address: '123 Main St, San Francisco, CA 94105'
            },
            lead_score: 8.5,
            created_at: '2023-05-15T10:30:00Z',
            updated_at: '2023-05-15T10:30:00Z',
            owner: { id: 1, name: 'Jane Doe' }
          }
        };
        
        console.log('useGetLead - mockLeadDetails:', mockLeadDetails);
        const fallbackLead = mockLeadDetails[leadId];
        console.log('useGetLead - fallbackLead from mockLeadDetails:', fallbackLead);
        
        if (fallbackLead) {
          setLead(fallbackLead);
        } else {
          throw new Error('Lead not found');
        }
      }
    } catch (err) {
      console.error('useGetLead - Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch lead'));
      setLead(null); // Clear lead data on error
      toast({
        title: 'Error',
        description: 'Failed to fetch lead details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Only depend on toast

  return {
    lead,
    isLoading,
    error,
    fetchLead,
  };
}

export function useBulkCreateLeads() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bulkCreateLeads = async (
    leadsData: LeadFormValues[], 
    duplicateHandling: 'skip' | 'update' | 'create_new' = 'skip',
    campaignId?: string
  ): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      // Map frontend form values to API model
      const apiLeadsData = leadsData.map(leadData => ({
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: leadData.email || undefined,
        phone: leadData.phone || undefined,
        company: leadData.company_name || undefined,
        title: leadData.job_title || undefined,
        source: leadData.source || 'website',
        status: leadData.status || 'new',
        owner_id: leadData.owner_id ? leadData.owner_id : undefined,
        custom_fields: leadData.custom_fields || {},
        linkedin_url: leadData.linkedin_url || undefined,
        facebook_url: leadData.facebook_url || undefined,
        twitter_url: leadData.twitter_url || undefined,
        campaign_ids: leadData.campaign_id ? [leadData.campaign_id] : undefined
      }));
      
      // Call the API
      const campaignIds = campaignId ? [parseInt(campaignId)] : undefined;
      const result = await apiBulkCreateLeads(apiLeadsData as any, duplicateHandling, campaignIds);
      
      setIsSubmitting(false);
      return result.success;
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to create leads. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    bulkCreateLeads,
    isSubmitting,
  };
} 