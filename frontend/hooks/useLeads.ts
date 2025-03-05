import { useState, useEffect } from 'react';
import { useToast } from '../components/ui/use-toast';
import { Lead, LeadCreate, LeadUpdate, LeadFormValues } from '../types/lead';

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

  const createLead = async (leadData: LeadFormValues): Promise<Lead | null> => {
    try {
      setIsSubmitting(true);
      
      // In a real app, this would be an API call
      // const response = await fetch('/api/leads', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(leadData),
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new lead with mock data
      const newLead: Lead = {
        id: `new-${Date.now()}`,
        ...leadData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setIsSubmitting(false);
      return newLead;
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
  };
}

export function useUpdateLead() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateLead = async (leadId: string, leadData: LeadFormValues): Promise<Lead | null> => {
    try {
      setIsSubmitting(true);
      
      // In a real app, this would be an API call
      // const response = await fetch(`/api/leads/${leadId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(leadData),
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the lead with mock data
      const updatedLead: Lead = {
        id: leadId,
        ...leadData,
        created_at: new Date().toISOString(), // This would come from the server
        updated_at: new Date().toISOString(),
      };
      
      setIsSubmitting(false);
      return updatedLead;
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    updateLead,
    isSubmitting,
  };
}

export function useGetLead() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchLead = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // const response = await fetch(`/api/leads/${leadId}`);
      // const data = await response.json();
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const foundLead = mockLeads.find(lead => lead.id === leadId);
      
      if (foundLead) {
        setLead(foundLead);
      } else {
        throw new Error('Lead not found');
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch lead'));
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch lead details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    lead,
    isLoading,
    error,
    fetchLead,
  };
} 