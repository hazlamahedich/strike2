'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast, useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Upload, 
  Download, 
  Trash, 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  Filter, 
  RefreshCw, 
  FileText, 
  X, 
  AlertCircle,
  Edit,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  UserPlus,
  Target,
  Megaphone
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api/client';
import { useLeads } from '@/lib/hooks/useLeads';
import { USE_MOCK_DATA } from '@/lib/config';
import { DashboardLead, apiToDashboardLead, dashboardToApiLead } from '@/lib/utils/lead-mapper';
import { openMeetingDialog } from '@/lib/utils/dialogUtils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TaskDialog } from '@/components/leads/TaskDialog';
import { MeetingDialogNew } from '@/components/meetings/MeetingDialogNew';
import { Lead, LeadSource as ApiLeadSource, LeadStatus as ApiLeadStatus } from '@/lib/types/lead';
import { EmailDialog } from '@/components/communications/EmailDialog';
import { LeadPhoneDialogProvider, useLeadPhoneDialog } from '@/contexts/LeadPhoneDialogContext';
import { EmailDialogProvider, useEmailDialog } from '@/contexts/EmailDialogContext';

// Define Campaign type
type Campaign = {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  target_audience?: string;
  goal?: string;
  status?: 'active' | 'planned' | 'completed' | 'paused';
  owner?: string;
  created_at: string;
};

// Define the enums that are missing
enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'closed_won',
  LOST = 'closed_lost'
}

enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  LINKEDIN = 'linkedin',
  COLD_CALL = 'cold_call',
  EMAIL_CAMPAIGN = 'email_campaign',
  EVENT = 'event',
  OTHER = 'other'
}

export default function LeadsPage() {
  return (
    <EmailDialogProvider>
      <LeadPhoneDialogProvider>
        <LeadsContent />
      </LeadPhoneDialogProvider>
    </EmailDialogProvider>
  );
}

function LeadsContent() {
  console.log("⭐⭐⭐ LEADS CONTENT - Rendering");
  
  const router = useRouter();
  const { toast } = useToast();
  const { openPhoneDialog } = useLeadPhoneDialog();
  const { openEmailDialog } = useEmailDialog();
  
  // State for leads and loading
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [singleLeadDuplicateHandling, setSingleLeadDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'website',
    notes: '',
    address: '',
    company_name: '',
    position: '',
    campaign_id: 'unassigned',
    linkedin_url: '',
    facebook_url: '',
    twitter_url: ''
  });

  // For bulk upload
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('unassigned');
  const [showNewCampaignInput, setShowNewCampaignInput] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');

  // For campaign creation in individual lead form
  const [showIndividualCampaignInput, setShowIndividualCampaignInput] = useState(false);
  const [individualCampaignName, setIndividualCampaignName] = useState('');

  // For campaign creation
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignSource, setcampaignSource] = useState<'individual' | 'bulk' | null>(null);
  const [newCampaign, setNewCampaign] = useState<Omit<Campaign, 'id' | 'created_at'>>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: undefined,
    target_audience: '',
    goal: '',
    status: 'planned',
    owner: ''
  });

  // Mock campaigns for dropdown
  const mockCampaigns: Campaign[] = [
    { 
      id: '1', 
      name: 'Summer Promotion',
      description: 'Summer promotional campaign targeting existing customers',
      start_date: '2023-06-01',
      end_date: '2023-08-31',
      budget: 5000,
      target_audience: 'Existing customers',
      goal: 'Increase repeat purchases by 15%',
      status: 'active',
      owner: 'Jane Smith',
      created_at: new Date().toISOString()
    },
    { 
      id: '2', 
      name: 'New Product Launch',
      description: 'Launch campaign for our new product line',
      start_date: '2023-09-15',
      end_date: '2023-12-15',
      budget: 12000,
      target_audience: 'New and existing customers',
      goal: 'Acquire 500 new customers',
      status: 'planned',
      owner: 'John Doe',
      created_at: new Date().toISOString()
    },
    { 
      id: '3', 
      name: 'Enterprise Outreach',
      description: 'B2B campaign targeting enterprise clients',
      start_date: '2023-07-01',
      end_date: '2023-10-31',
      budget: 8000,
      target_audience: 'Enterprise businesses',
      goal: 'Sign 10 new enterprise contracts',
      status: 'active',
      owner: 'Sarah Johnson',
      created_at: new Date().toISOString()
    }
  ];

  // Add the missing state for bulk upload dialog
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  // Add state variables for dialogs
  const [showEditLeadDialog, setShowEditLeadDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Add state for current lead
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  // Fetch leads data
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        
        if (USE_MOCK_DATA) {
          // Generate mock timeline data for leads that don't have it
          const generateMockTimeline = (leadId: string) => {
            const types = ['email', 'call', 'meeting', 'note'];
            const activities = [];
            
            for (let i = 0; i < 3; i++) {
              const type = types[Math.floor(Math.random() * types.length)];
              activities.push({
                id: `${leadId}-${i}`,
                type,
                content: `Mock ${type} activity ${i + 1}`,
                created_at: new Date(Date.now() - (i * 86400000)).toISOString(),
                user: { id: 'user1', name: 'Sales Rep' }
              });
            }
            
            return activities;
          };
          
          // For now, using mock data until API is ready
          const mockLeads: DashboardLead[] = [
            {
              id: '1',
              name: 'John Smith',
              email: 'john.smith@example.com',
              phone: '(555) 123-4567',
              status: 'new',
              source: 'Website',
              created_at: '2023-05-15T10:30:00Z',
              last_contact: new Date().toISOString(),
              notes: 'Interested in premium plan',
              score: 85,
              conversion_probability: 0.75,
              address: '123 Main St, San Francisco, CA 94105',
              campaign_id: '1',
              campaign_name: 'Summer Promotion',
              company_name: 'Acme Inc.',
              position: 'Marketing Manager',
              linkedin_url: 'https://www.linkedin.com/in/john-smith',
              facebook_url: 'https://www.facebook.com/john.smith',
              timeline: [
                {
                  id: 101,
                  type: 'email',
                  content: 'Sent introduction email',
                  created_at: new Date().toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                },
                {
                  id: 102,
                  type: 'note',
                  content: 'Customer interested in premium plan',
                  created_at: new Date(Date.now() - 3600000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                },
                {
                  id: 103,
                  type: 'call',
                  content: 'Discussed product features',
                  created_at: new Date(Date.now() - 7200000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                }
              ]
            },
            {
              id: '2',
              name: 'Sarah Johnson',
              email: 'sarah.johnson@example.com',
              phone: '(555) 987-6543',
              status: 'contacted',
              source: 'Referral',
              created_at: '2023-05-10T14:45:00Z',
              last_contact: '2023-05-12T09:15:00Z',
              notes: 'Follow up next week',
              score: 72,
              conversion_probability: 0.62,
              address: '456 Market St, San Francisco, CA 94105',
              campaign_id: '2',
              campaign_name: 'Enterprise Outreach',
              company_name: 'XYZ Corp',
              position: 'CTO',
              linkedin_url: 'https://www.linkedin.com/in/sarah-johnson',
              timeline: [
                {
                  id: 201,
                  type: 'meeting',
                  content: 'Initial discovery call',
                  created_at: new Date(Date.now() - 86400000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                },
                {
                  id: 202,
                  type: 'email',
                  content: 'Sent follow-up materials',
                  created_at: new Date(Date.now() - 90000000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                }
              ]
            },
            {
              id: '3',
              name: 'Michael Brown',
              email: 'michael.brown@example.com',
              phone: '(555) 456-7890',
              status: 'qualified',
              source: 'LinkedIn',
              created_at: '2023-05-05T11:20:00Z',
              last_contact: '2023-05-11T16:30:00Z',
              notes: 'Needs custom solution',
              score: 91,
              conversion_probability: 0.85,
              address: '789 Howard St, San Francisco, CA 94105',
              campaign_id: '1',
              campaign_name: 'Summer Promotion',
              company_name: 'ABC Enterprises',
              position: 'CEO',
              linkedin_url: 'https://www.linkedin.com/in/michael-brown',
              timeline: [
                {
                  id: 301,
                  type: 'call',
                  content: 'Discussed pricing options',
                  created_at: new Date(Date.now() - 172800000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                },
                {
                  id: 302,
                  type: 'email',
                  content: 'Sent proposal document',
                  created_at: new Date(Date.now() - 180000000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                },
                {
                  id: 303,
                  type: 'note',
                  content: 'Customer requested demo for team',
                  created_at: new Date(Date.now() - 190000000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                }
              ]
            },
            {
              id: '4',
              name: 'Emily Davis',
              email: 'emily.davis@example.com',
              phone: '(555) 789-0123',
              status: 'proposal',
              source: 'Event',
              created_at: '2023-04-28T09:10:00Z',
              last_contact: '2023-05-09T13:45:00Z',
              notes: 'Proposal sent, awaiting feedback',
              score: 88,
              conversion_probability: 0.78,
              address: '101 California St, San Francisco, CA 94111',
              campaign_id: '2',
              campaign_name: 'Enterprise Outreach',
              company_name: 'Davis Enterprises',
              position: 'CTO',
              linkedin_url: 'https://www.linkedin.com/in/emily-davis',
              timeline: [
                {
                  id: 401,
                  type: 'meeting',
                  content: 'Technical review with IT team',
                  created_at: new Date(Date.now() - 259200000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                },
                {
                  id: 402,
                  type: 'email',
                  content: 'Sent technical specifications',
                  created_at: new Date(Date.now() - 270000000).toISOString(),
                  user: { id: 'user1', name: 'Sales Rep' }
                }
              ]
            },
            {
              id: '5',
              name: 'Robert Wilson',
              email: 'robert.wilson@example.com',
              phone: '(555) 234-5678',
              status: 'negotiation',
              source: 'Cold Call',
              created_at: '2023-04-20T15:30:00Z',
              last_contact: '2023-05-08T10:20:00Z',
              notes: 'Negotiating contract terms',
              score: 95,
              conversion_probability: 0.92,
              address: '555 Mission St, San Francisco, CA 94105',
              campaign_id: '3',
              campaign_name: 'Q2 Sales Push',
              company_name: 'Wilson Tech',
              position: 'Procurement Manager',
              linkedin_url: 'https://www.linkedin.com/in/robert-wilson',
              timeline: [
                {
                  id: 501,
                  type: 'call',
                  content: 'Contract finalization call',
                  created_at: new Date(Date.now() - 345600000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                },
                {
                  id: 502,
                  type: 'email',
                  content: 'Sent revised contract',
                  created_at: new Date(Date.now() - 350000000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                },
                {
                  id: 503,
                  type: 'note',
                  content: 'Customer requested pricing adjustment',
                  created_at: new Date(Date.now() - 360000000).toISOString(),
                  user: { id: 'user2', name: 'Account Manager' }
                }
              ]
            }
          ];
          
          // Ensure all leads have timeline data
          const processedLeads = mockLeads.map(lead => {
            if (!lead.timeline || lead.timeline.length === 0) {
              lead.timeline = generateMockTimeline(lead.id);
            }
            
            // Ensure conversion probability is initialized
            if (lead.conversion_probability === undefined) {
              lead.conversion_probability = lead.score ? lead.score / 100 : 0.5;
            }
            
            return lead;
          });
          
          setLeads(processedLeads);
          setIsLoading(false);
        } else {
          // Use the useLeads hook to fetch data from Supabase
          const response = await apiClient.get<any[]>('/api/leads');
          
          if (response.error) {
            console.error('Error fetching leads:', response.error);
            toast({
              title: 'Error',
              description: 'Failed to fetch leads. Please try again.',
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
          
          // Convert API leads to dashboard format
          const dashboardLeads = response.data.map((apiLead: any) => apiToDashboardLead(apiLead));
          
          setLeads(dashboardLeads);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch leads. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search query and status filter
  const filteredLeads = leads.filter(lead => {
    // Ensure timeline is initialized
    if (!lead.timeline) {
      lead.timeline = [];
    }
    
    // Ensure conversion probability is initialized
    if (lead.conversion_probability === undefined) {
      // Calculate conversion probability the same way as the API does
      lead.conversion_probability = lead.score ? lead.score / 10 : 0.5;
    }
    
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === null || lead.status === statusFilter;
    
    const matchesCampaign = campaignFilter === null || 
                           campaignFilter === 'unassigned' && !lead.campaign_id || 
                           lead.campaign_id === campaignFilter;
    
    return matchesSearch && matchesStatus && matchesCampaign;
  });

  // Create a new campaign for individual lead
  const handleCreateIndividualCampaign = () => {
    if (!individualCampaignName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a campaign name.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a new ID for the campaign
    const newCampaignId = `new-${Date.now()}`;
    
    // Add the new campaign to the list
    const newCampaign: Campaign = {
      id: newCampaignId,
      name: individualCampaignName.trim(),
      description: '',
      start_date: '',
      end_date: '',
      budget: 0,
      target_audience: '',
      goal: '',
      status: 'planned',
      owner: '',
      created_at: new Date().toISOString()
    };
    
    // Update the campaigns list
    mockCampaigns.push(newCampaign);
    
    // Select the new campaign
    setNewLead({...newLead, campaign_id: newCampaignId});
    
    // Reset the new campaign input
    setIndividualCampaignName('');
    setShowIndividualCampaignInput(false);
    
    toast({
      title: 'Campaign Created',
      description: `Campaign "${individualCampaignName.trim()}" has been created.`,
    });
  };

  // Handle adding a new lead
  const handleAddLead = async () => {
    try {
      // Check if a campaign is selected
      if (newLead.campaign_id === 'unassigned') {
        toast({
          title: 'Campaign Required',
          description: 'Please select or create a campaign for this lead.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate lead score
      const leadScore = calculateLeadScore({
        email: newLead.email,
        phone: newLead.phone,
        company_name: newLead.company_name,
        position: newLead.position,
        notes: newLead.notes,
        linkedin_url: newLead.linkedin_url,
        facebook_url: newLead.facebook_url,
        twitter_url: newLead.twitter_url
      });
      
      // Check for duplicates (in production, this would be handled by the API)
      const duplicateExists = leads.some(lead => 
        lead.email === newLead.email && newLead.email !== ''
      );
      
      if (duplicateExists) {
        setShowDuplicateAlert(true);
        return;
      }
      
      if (USE_MOCK_DATA) {
        // For mock data, just add to local state
        const selectedCampaign = mockCampaigns.find(c => c.id === newLead.campaign_id);
        
        const newLeadWithId: DashboardLead = {
          ...newLead,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          last_contact: null,
          status: newLead.status as DashboardLead['status'],
          campaign_name: selectedCampaign?.name || 'Unassigned',
          score: leadScore
        };
        
        setLeads([newLeadWithId, ...leads]);
        setShowAddLeadDialog(false);
        resetLeadForm();
        
        toast({
          title: 'Lead Added',
          description: 'New lead has been added successfully.',
        });
      } else {
        // When using Supabase
        try {
          // Ensure the lead has all required properties for DashboardLead
          const completeNewLead: DashboardLead = {
            ...newLead,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            last_contact: null,
            timeline: [],
            // Fix the type issue with status
            status: (newLead.status as DashboardLead['status']) || 'new'
          };
          
          // Convert dashboard lead to API format
          const apiLead = dashboardToApiLead(completeNewLead);
          
          // Send to API
          const response = await apiClient.post<any>('/api/leads', apiLead);
          
          if (response.error) {
            toast({
              title: "Error adding lead",
              description: response.error.message,
              variant: "destructive",
            });
            return;
          }
          
          // Convert API lead to dashboard format and add to state
          const createdLead = apiToDashboardLead(response.data as any);
          setLeads([createdLead, ...leads]);
          setShowAddLeadDialog(false);
          resetLeadForm();
          
          toast({
            title: "Lead added",
            description: `${newLead.name} has been added successfully.`,
          });
        } catch (error) {
          console.error("Error adding lead:", error);
          toast({
            title: "Error adding lead",
            description: "There was an error adding the lead. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to add lead. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Reset lead form
  const resetLeadForm = () => {
    setNewLead({
      name: '',
      email: '',
      phone: '',
      status: 'new',
      source: '',
      notes: '',
      address: '',
      company_name: '',
      position: '',
      campaign_id: '',
      linkedin_url: '',
      facebook_url: '',
      twitter_url: ''
    });
    setShowDuplicateAlert(false);
    setSingleLeadDuplicateHandling('skip');
  };

  // Calculate lead score based on available information
  const calculateLeadScore = (lead: Partial<DashboardLead>): number => {
    let score = 0;
    
    // Email presence and validity
    if (lead.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      score += 20;
    }
    
    // Phone presence
    if (lead.phone && lead.phone.length > 5) {
      score += 15;
    }
    
    // Company information
    if (lead.company_name && lead.company_name.length > 0) {
      score += 15;
    }
    
    // Position/title
    if (lead.position && lead.position.length > 0) {
      score += 10;
    }
    
    // Social media presence
    if (lead.linkedin_url) score += 10;
    if (lead.facebook_url) score += 5;
    if (lead.twitter_url) score += 5;
    
    // Notes
    if (lead.notes && lead.notes.length > 10) {
      score += 10;
    }
    
    // Address
    if (lead.address && lead.address.length > 0) {
      score += 10;
    }
    
    return Math.min(score, 100);
  };

  // Handle file change for bulk upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadStatus('idle');
    setErrorMessage(null);
    setValidationResults(null);
  };

  // Download template for bulk upload
  const downloadTemplate = () => {
    // Create CSV template
    const headers = ['name', 'email', 'phone', 'company_name', 'position', 'status', 'source', 'notes', 'address', 'linkedin_url', 'facebook_url', 'twitter_url'];
    const csvContent = headers.join(',') + '\n';
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'Lead import template has been downloaded.',
    });
  };

  // Open campaign dialog from individual lead form
  const openCampaignDialogFromIndividual = () => {
    setcampaignSource('individual');
    setShowCampaignDialog(true);
  };

  // Open campaign dialog from bulk upload
  const openCampaignDialogFromBulk = () => {
    setcampaignSource('bulk');
    setShowCampaignDialog(true);
  };

  // Handle campaign form submission
  const handleCampaignSubmit = () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: 'Error',
        description: 'Campaign name is required.',
        variant: 'destructive',
      });
      return;
    }

    // Generate a new ID for the campaign
    const newCampaignId = `new-${Date.now()}`;
    
    // Create the new campaign object with all required fields
    const campaignToAdd: Campaign = {
      id: newCampaignId,
      name: newCampaign.name,
      description: newCampaign.description || '',
      start_date: newCampaign.start_date || '',
      end_date: newCampaign.end_date || '',
      budget: newCampaign.budget || 0,
      target_audience: newCampaign.target_audience || '',
      goal: newCampaign.goal || '',
      status: newCampaign.status || 'planned',
      owner: newCampaign.owner || '',
      created_at: new Date().toISOString()
    };
    
    // Add the new campaign to the list
    mockCampaigns.push(campaignToAdd);
    
    // Update the appropriate state based on source
    if (campaignSource === 'individual') {
      setNewLead({...newLead, campaign_id: newCampaignId});
    } else if (campaignSource === 'bulk') {
      setSelectedCampaignId(newCampaignId);
    }
    
    // Reset the form and close the dialog
    setNewCampaign({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      budget: undefined,
      target_audience: '',
      goal: '',
      status: 'planned',
      owner: ''
    });
    setShowCampaignDialog(false);
    
    toast({
      title: 'Campaign Created',
      description: `Campaign "${newCampaign.name.trim()}" has been created.`,
    });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Handle action links
  const handleEmailClick = (email: string, name: string) => {
    console.log("⭐⭐⭐ LEADS PAGE - Email clicked:", email);
    
    // Create a lead object with the email address
    const lead = {
      id: `temp-${Date.now()}`,
      name: name || 'Contact',
      email: email,
      phone: ''
    };
    
    // Open the email dialog using the context
    openEmailDialog(lead);
  };

  // Handle phone number click - use the context instead of dialog state
  const handlePhoneClick = (phone: string) => {
    console.log("⭐⭐⭐ LEADS PAGE - Phone clicked:", phone);
    
    // Create a lead object with the phone number
    const lead = {
      id: `temp-${Date.now()}`,
      name: 'Contact',
      phone: phone,
      email: ''
    };
    
    // Open the phone dialog using the context
    openPhoneDialog(lead);
  };

  const handleViewDetails = (leadId: string) => {
    router.push(`/dashboard/leads/${leadId}`);
  };

  const handleEditLead = (leadId: string) => {
    // Set the selected lead and open the edit dialog
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLeadId(leadId);
      setNewLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status as DashboardLead['status'],
        source: lead.source,
        notes: lead.notes || '',
        address: lead.address || '',
        company_name: lead.company_name,
        position: lead.position,
        campaign_id: lead.campaign_id || '',
        linkedin_url: lead.linkedin_url || '',
        facebook_url: lead.facebook_url || '',
        twitter_url: lead.twitter_url || ''
      });
      setShowEditLeadDialog(true);
    } else {
      console.error(`Lead with ID ${leadId} not found`);
      toast({
        title: "Error",
        description: "Lead not found. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = (leadId: string) => {
    // Set the selected lead and open the task dialog
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLeadId(leadId);
      setCurrentLead(lead);
      setShowTaskDialog(true);
    } else {
      console.error(`Lead with ID ${leadId} not found`);
      toast({
        title: "Error",
        description: "Lead not found. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleMeeting = (leadId: string) => {
    // Set the selected lead and open the meeting dialog
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLeadId(leadId);
      setCurrentLead(lead);
      setShowMeetingDialog(true);
    } else {
      console.error(`Lead with ID ${leadId} not found`);
      toast({
        title: "Error",
        description: "Lead not found. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      // In a real app, call API to delete lead
      setLeads(leads.filter(lead => lead.id !== leadId));
    }
  };

  // Validate file for bulk upload
  const validateFile = async () => {
    if (!file) return;
    
    setUploadStatus('validating');
    setErrorMessage(null);
    
    try {
      // Read the file
      const text = await file.text();
      const rows = text.split('\n');
      
      // Check if file is empty
      if (rows.length <= 1) {
        setErrorMessage('The file appears to be empty or contains only headers.');
        setUploadStatus('error');
        return;
      }
      
      // Validate headers
      const headers = rows[0].split(',').map(h => h.trim());
      const requiredHeaders = ['name', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrorMessage(`Missing required headers: ${missingHeaders.join(', ')}`);
        setUploadStatus('error');
        return;
      }
      
      // Validate rows
      const errors: Array<{ row: number; message: string }> = [];
      let validRows = 0;
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const values = rows[i].split(',').map(v => v.trim());
        
        // Check if row has correct number of columns
        if (values.length !== headers.length) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`,
          });
          continue;
        }
        
        // Create a record from the row
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        
        // Validate required fields
        if (!record.name) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} is missing name`,
          });
          continue;
        }
        
        // Validate email format if provided
        if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
          errors.push({
            row: i + 1,
            message: `Row ${i + 1} has invalid email format`,
          });
          continue;
        }
        
        validRows++;
      }
      
      setValidationResults({
        valid: errors.length === 0,
        totalRows: rows.length - 1, // Exclude header row
        validRows,
        invalidRows: errors.length,
        errors,
      });
      
      if (errors.length === 0) {
        setUploadStatus('idle');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      setErrorMessage('Failed to validate file. Please check the file format.');
      setUploadStatus('error');
    }
  };

  // Handle bulk upload of leads
  const handleBulkUpload = async () => {
    try {
      if (!file || !validationResults?.valid) {
        toast({
          title: 'Invalid File',
          description: 'Please upload a valid CSV file.',
          variant: 'destructive',
        });
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(10);
      
      // Parse CSV file
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim() !== '');
      
      if (rows.length < 2) {
        toast({
          title: 'Invalid File',
          description: 'The CSV file must contain at least one lead.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }
      
      // Get headers
      const headers = rows[0].split(',').map(h => h.trim());
      
      const newLeads: DashboardLead[] = [];
      
      // Parse rows into lead objects
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const values = row.split(',').map(v => v.trim());
        
        // Create object from headers and values
        const leadData: Record<string, string> = {};
        headers.forEach((header, index) => {
          leadData[header.toLowerCase()] = values[index] || '';
        });
        
        // Map to expected fields
        const status = leadData.status?.toLowerCase() || 'new';
        const source = leadData.source?.toLowerCase() || 'import';
        
        // Create new lead
        const newLead: DashboardLead = {
          id: `temp-bulk-${Date.now()}-${i}`,
          name: leadData.name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
          email: leadData.email || '',
          phone: leadData.phone || '',
          status: status as DashboardLead['status'],
          source: source,
          notes: leadData.notes || '',
          created_at: new Date().toISOString(),
          last_contact: null,
          company_name: leadData.company || leadData.company_name || '',
          position: leadData.position || leadData.job_title || '',
          campaign_id: selectedCampaignId,
          campaign_name: mockCampaigns.find(c => c.id === selectedCampaignId)?.name || 'Unassigned',
          linkedin_url: leadData.linkedin_url || '',
          facebook_url: leadData.facebook_url || '',
          twitter_url: leadData.twitter_url || ''
        };
        
        // Calculate lead score
        newLead.score = calculateLeadScore({
          email: newLead.email,
          phone: newLead.phone,
          company_name: newLead.company_name,
          position: newLead.position,
          notes: newLead.notes,
          linkedin_url: newLead.linkedin_url,
          facebook_url: newLead.facebook_url,
          twitter_url: newLead.twitter_url
        });
        
        newLeads.push(newLead);
        
        // Update progress
        setUploadProgress(10 + Math.floor((i / rows.length) * 50));
      }
      
      if (USE_MOCK_DATA) {
        // For mock data, just add to local state
        setUploadProgress(75);
        
        // Add new leads to state
        setLeads([...newLeads, ...leads]);
        
        setUploadProgress(100);
        setUploadStatus('success');
        setIsUploading(false);
        
        // Close dialog after a delay
        setTimeout(() => {
          setBulkUploadDialogOpen(false);
          setUploadStatus('idle');
          setFile(null);
          setValidationResults(null);
        }, 2000);
        
        toast({
          title: 'Leads Imported',
          description: `Successfully imported ${newLeads.length} leads.`,
        });
      } else {
        // In production, use the API
        setUploadProgress(60);
        
        // Convert dashboard leads to API format
        const apiLeads = newLeads.map(lead => ({
          first_name: lead.name.split(' ')[0],
          last_name: lead.name.split(' ').slice(1).join(' '),
          email: lead.email,
          phone: lead.phone,
          company_name: lead.company_name,
          job_title: lead.position,
          source: lead.source,
          status: lead.status,
          linkedin_url: lead.linkedin_url,
          facebook_url: lead.facebook_url,
          twitter_url: lead.twitter_url,
          custom_fields: {
            notes: lead.notes,
            campaign_id: lead.campaign_id,
            campaign_name: lead.campaign_name,
            address: lead.address
          }
        }));
        
        // Send to API
        const response = await apiClient.post('/api/leads/bulk', {
          leads: apiLeads,
          duplicate_handling: duplicateHandling,
          campaign_id: selectedCampaignId
        });
        
        if (response.error) {
          console.error('Error importing leads:', response.error);
          toast({
            title: 'Error',
            description: 'Failed to import leads. Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
        
        setUploadProgress(100);
        setUploadStatus('success');
        setIsUploading(false);
        
        // Refresh leads to get the newly created ones
        const fetchResponse = await apiClient.get<any[]>('/api/leads');
        if (!fetchResponse.error) {
          const dashboardLeads = fetchResponse.data.map((apiLead: any) => apiToDashboardLead(apiLead));
          setLeads(dashboardLeads);
        }
        
        // Close dialog after a delay
        setTimeout(() => {
          setBulkUploadDialogOpen(false);
          setUploadStatus('idle');
          setFile(null);
          setValidationResults(null);
        }, 2000);
        
        toast({
          title: 'Leads Imported',
          description: `Successfully imported ${newLeads.length} leads.`,
        });
      }
    } catch (error) {
      console.error('Error uploading leads:', error);
      setIsUploading(false);
      setUploadStatus('idle');
      
      toast({
        title: 'Error',
        description: 'Failed to import leads. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-3 w-3 text-blue-500" />;
      case 'call':
        return <Phone className="h-3 w-3 text-green-500" />;
      case 'meeting':
        return <Calendar className="h-3 w-3 text-purple-500" />;
      case 'note':
        return <FileText className="h-3 w-3 text-amber-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  // Add the handleUpdateLead function
  const handleUpdateLead = (leadId: string) => {
    // Find the lead in the leads array
    const leadIndex = leads.findIndex(l => l.id === leadId);
    
    if (leadIndex === -1) {
      console.error(`Lead with ID ${leadId} not found`);
      toast({
        title: "Error",
        description: "Lead not found. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a copy of the leads array
    const updatedLeads = [...leads];
    
    // Update the lead with the new data
    updatedLeads[leadIndex] = {
      ...updatedLeads[leadIndex],
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      status: newLead.status as DashboardLead['status'],
      source: newLead.source,
      notes: newLead.notes,
      address: newLead.address,
      company_name: newLead.company_name,
      position: newLead.position,
      campaign_id: newLead.campaign_id,
      linkedin_url: newLead.linkedin_url,
      facebook_url: newLead.facebook_url,
      twitter_url: newLead.twitter_url,
      // Preserve fields that aren't in the form
      id: leadId,
      created_at: updatedLeads[leadIndex].created_at,
      last_contact: updatedLeads[leadIndex].last_contact,
      score: calculateLeadScore({
        ...newLead,
        status: newLead.status as DashboardLead['status']
      }),
      conversion_probability: calculateLeadScore({
        ...newLead,
        status: newLead.status as DashboardLead['status']
      }) / 100,
      timeline: updatedLeads[leadIndex].timeline
    };
    
    // Update the state
    setLeads(updatedLeads);
    
    // Close the dialog
    setShowEditLeadDialog(false);
    
    // Show a success message
    toast({
      title: "Lead Updated",
      description: `${newLead.name} has been updated successfully.`,
    });
    
    // If not using mock data, update the lead in the API
    if (!USE_MOCK_DATA) {
      try {
        // Ensure the lead has all required properties for DashboardLead
        const completeUpdatedLead: DashboardLead = {
          id: leadId,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          status: newLead.status as DashboardLead['status'],
          source: newLead.source,
          created_at: updatedLeads[leadIndex].created_at,
          last_contact: updatedLeads[leadIndex].last_contact,
          notes: newLead.notes,
          company_name: newLead.company_name,
          position: newLead.position,
          address: newLead.address,
          campaign_id: newLead.campaign_id,
          linkedin_url: newLead.linkedin_url,
          facebook_url: newLead.facebook_url,
          twitter_url: newLead.twitter_url,
          timeline: updatedLeads[leadIndex].timeline
        };
        
        // Convert dashboard lead to API format
        const apiLead = dashboardToApiLead(completeUpdatedLead);
        
        // Send to API
        apiClient.put<any>(`/api/leads/${leadId}`, apiLead)
          .then(response => {
            if (response.error) {
              console.error("Error updating lead:", response.error);
              toast({
                title: "Error",
                description: "There was an error updating the lead on the server. The local changes have been saved.",
                variant: "destructive",
              });
            }
          })
          .catch(error => {
            console.error("Error updating lead:", error);
            toast({
              title: "Error",
              description: "There was an error updating the lead on the server. The local changes have been saved.",
              variant: "destructive",
            });
          });
      } catch (error) {
        console.error("Error updating lead:", error);
        toast({
          title: "Error",
          description: "There was an error updating the lead on the server. The local changes have been saved.",
          variant: "destructive",
        });
      }
    }
  };

  // Add task handlers
  const handleTaskCreate = (taskData: any) => {
    // Create a new task and add it to the lead's timeline
    if (!selectedLeadId) return;
    
    const leadIndex = leads.findIndex(l => l.id === selectedLeadId);
    if (leadIndex === -1) return;
    
    const updatedLeads = [...leads];
    const lead = updatedLeads[leadIndex];
    
    // Create a new task
    const newTask = {
      id: `task-${Date.now()}`,
      type: 'task',
      content: taskData.title,
      description: taskData.description,
      due_date: taskData.due_date,
      priority: taskData.priority,
      assignee: taskData.assignee,
      completed: false,
      created_at: new Date().toISOString(),
      user: {
        id: 'current-user',
        name: 'Current User'
      }
    };
    
    // Add to timeline if it doesn't exist
    if (!lead.timeline) {
      lead.timeline = [];
    }
    
    lead.timeline.unshift(newTask);
    
    // Update the leads state
    setLeads(updatedLeads);
    
    // Show success message
    toast({
      title: "Task Created",
      description: "The task has been created successfully.",
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your CRM system.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Individual Record</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newLead.name}
                        onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                        placeholder="john.smith@example.com"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={newLead.company_name}
                        onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={newLead.position}
                        onChange={(e) => setNewLead({...newLead, position: e.target.value})}
                        placeholder="Marketing Manager"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newLead.status} 
                        onValueChange={(value) => setNewLead({...newLead, status: value as DashboardLead['status']})}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="closed_won">Closed (Won)</SelectItem>
                          <SelectItem value="closed_lost">Closed (Lost)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        value={newLead.source}
                        onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                        placeholder="Website, Referral, etc."
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newLead.address}
                        onChange={(e) => setNewLead({...newLead, address: e.target.value})}
                        placeholder="123 Main St, City, State"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label htmlFor="campaign">Campaign *</Label>
                      <Select 
                        value={newLead.campaign_id} 
                        onValueChange={(value) => {
                          if (value === 'new') {
                            openCampaignDialogFromIndividual();
                          } else {
                            setNewLead({...newLead, campaign_id: value});
                          }
                        }}
                      >
                        <SelectTrigger id="campaign">
                          <SelectValue placeholder="Select campaign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Select a Campaign</SelectItem>
                          {mockCampaigns.map(campaign => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <span className="flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Create New Campaign
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {showIndividualCampaignInput && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Enter new campaign name"
                            value={individualCampaignName}
                            onChange={(e) => setIndividualCampaignName(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleCreateIndividualCampaign}
                            disabled={!individualCampaignName.trim()}
                            size="sm"
                          >
                            Create
                          </Button>
                        </div>
                      )}
                      
                      {showDuplicateAlert && (
                        <div className="col-span-2">
                          <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Duplicate Lead Detected</AlertTitle>
                            <AlertDescription>
                              A lead with this email already exists. How would you like to proceed?
                            </AlertDescription>
                            
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroup 
                                  value={singleLeadDuplicateHandling} 
                                  onValueChange={(value: string) => setSingleLeadDuplicateHandling(value as 'skip' | 'update' | 'create_new')}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="skip" id="skip" />
                                    <Label htmlFor="skip" className="font-normal">Skip (don't create)</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="update" id="update" />
                                    <Label htmlFor="update" className="font-normal">Update existing lead</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="create_new" id="create_new" />
                                    <Label htmlFor="create_new" className="font-normal">Create new lead anyway</Label>
                                  </div>
                                </RadioGroup>
                              </div>
                              
                              <div className="flex justify-end space-x-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setShowDuplicateAlert(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleAddLead}
                                >
                                  Continue
                                </Button>
                              </div>
                            </div>
                          </Alert>
                        </div>
                      )}
                      
                      <div className="col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newLead.notes}
                          onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                          placeholder="Additional information about this lead..."
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium mb-2">Social Media Profiles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="linkedin_url">LinkedIn</Label>
                          <Input
                            id="linkedin_url"
                            value={newLead.linkedin_url}
                            onChange={(e) => setNewLead({...newLead, linkedin_url: e.target.value})}
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="facebook_url">Facebook</Label>
                          <Input
                            id="facebook_url"
                            value={newLead.facebook_url}
                            onChange={(e) => setNewLead({...newLead, facebook_url: e.target.value})}
                            placeholder="https://facebook.com/username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitter_url">Twitter</Label>
                          <Input
                            id="twitter_url"
                            value={newLead.twitter_url}
                            onChange={(e) => setNewLead({...newLead, twitter_url: e.target.value})}
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddLead}>Save Lead</Button>
                  </DialogFooter>
                </div>
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={downloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="file-upload">Upload CSV File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {file && (
                        <Button 
                          variant="secondary" 
                          onClick={validateFile}
                          disabled={uploadStatus === 'validating' || uploadStatus === 'uploading'}
                        >
                          Validate
                        </Button>
                      )}
                    </div>
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="campaign-select">Assign to Campaign *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedCampaignId} 
                        onValueChange={(value) => {
                          if (value === 'new') {
                            openCampaignDialogFromBulk();
                          } else {
                            setSelectedCampaignId(value);
                          }
                        }}
                      >
                        <SelectTrigger id="campaign-select" className="flex-1">
                          <SelectValue placeholder="Select campaign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Select a Campaign</SelectItem>
                          {mockCampaigns.map(campaign => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            <span className="flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Create New Campaign
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      * All leads must be assigned to a campaign
                    </p>
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="duplicate-handling">Duplicate Handling</Label>
                    <Select 
                      value={duplicateHandling} 
                      onValueChange={(value) => setDuplicateHandling(value as 'skip' | 'update' | 'create_new')}
                    >
                      <SelectTrigger id="duplicate-handling">
                        <SelectValue placeholder="Select how to handle duplicates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">
                          Skip duplicates (default)
                        </SelectItem>
                        <SelectItem value="update">
                          Update existing leads
                        </SelectItem>
                        <SelectItem value="create_new">
                          Create new leads anyway
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How to handle leads with emails that already exist in the system
                    </p>
                    
                    <div className="mt-1 text-xs border rounded-md p-2 bg-muted/50">
                      <p className="font-medium mb-1">Selected option: {
                        duplicateHandling === 'skip' ? 'Skip duplicates' : 
                        duplicateHandling === 'update' ? 'Update existing leads' : 
                        'Create new leads anyway'
                      }</p>
                      {duplicateHandling === 'skip' && (
                        <p>Leads with emails that already exist in the system will be ignored.</p>
                      )}
                      {duplicateHandling === 'update' && (
                        <p>Existing leads will be updated with the new information from the CSV.</p>
                      )}
                      {duplicateHandling === 'create_new' && (
                        <p>New leads will be created even if the email already exists (may result in duplicates).</p>
                      )}
                    </div>
                  </div>
                  
                  {uploadStatus === 'validating' && (
                    <div className="space-y-2">
                      <p className="text-sm">Validating file...</p>
                      <Progress value={50} className="h-2" />
                    </div>
                  )}
                  
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <p className="text-sm">Uploading leads...</p>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {validationResults && (
                    <Alert variant={validationResults.valid ? "default" : "destructive"}>
                      <div className="flex items-start gap-2">
                        {validationResults.valid ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                        )}
                        <div>
                          <AlertTitle>
                            {validationResults.valid 
                              ? "File Validated Successfully" 
                              : "Validation Failed"}
                          </AlertTitle>
                          <AlertDescription>
                            <p>
                              Total rows: {validationResults.totalRows}, 
                              Valid: {validationResults.validRows}, 
                              Invalid: {validationResults.invalidRows}
                            </p>
                            
                            {validationResults.errors.length > 0 && (
                              <div className="mt-2 max-h-32 overflow-y-auto text-sm">
                                <p className="font-semibold">Errors:</p>
                                <ul className="list-disc pl-5">
                                  {validationResults.errors.slice(0, 5).map((error, index) => (
                                    <li key={index}>{error.message}</li>
                                  ))}
                                  {validationResults.errors.length > 5 && (
                                    <li>...and {validationResults.errors.length - 5} more errors</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
                  
                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadStatus === 'success' && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Upload Successful</AlertTitle>
                      <AlertDescription>
                        Your leads have been imported successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={
                        !file || 
                        !validationResults?.valid || 
                        isUploading || 
                        uploadStatus === 'validating' ||
                        selectedCampaignId === 'unassigned'
                      }
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Leads
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed_won">Closed (Won)</SelectItem>
              <SelectItem value="closed_lost">Closed (Lost)</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={campaignFilter || 'all'} onValueChange={(value) => setCampaignFilter(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <SelectValue placeholder="Filter by campaign" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {mockCampaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <div className="w-full overflow-x-auto relative">
            <Table className="relative">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap sticky left-0 z-20 bg-background">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="hidden sm:table-cell whitespace-nowrap">Email</TableHead>
                  <TableHead className="hidden sm:table-cell whitespace-nowrap">Phone</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Score</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Conv. Probability</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Address</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Campaign</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Source</TableHead>
                  <TableHead className="hidden xl:table-cell whitespace-nowrap">Created</TableHead>
                  <TableHead className="hidden xl:table-cell whitespace-nowrap">Last Contact</TableHead>
                  <TableHead className="hidden xl:table-cell whitespace-nowrap">Recent Activities</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      No leads found. Try adjusting your search or add a new lead.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="sticky left-0 z-10 bg-background">
                        <div className="font-medium truncate max-w-[150px]">
                          {lead.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant="outline" className={`
                            ${lead.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${lead.status === 'contacted' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                            ${lead.status === 'qualified' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${lead.status === 'proposal' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            ${lead.status === 'negotiation' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                            ${lead.status === 'closed_won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                            ${lead.status === 'closed_lost' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}>
                            {lead.status === 'closed_won' ? 'Won' : 
                             lead.status === 'closed_lost' ? 'Lost' : 
                             lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{lead.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{lead.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            (lead.score || 0) >= 80 ? 'text-green-600' : 
                            (lead.score || 0) >= 60 ? 'text-yellow-600' : 
                            (lead.score || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {lead.score || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {lead.conversion_probability !== undefined ? (
                          <div className="flex items-center">
                            <Progress 
                              value={lead.conversion_probability * 100} 
                              className="h-2 w-16 mr-2"
                              // Use a custom class name for the indicator
                              // The Progress component doesn't accept indicatorClassName directly
                            />
                            <span className="text-sm">{Math.round(lead.conversion_probability * 100)}%</span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell truncate max-w-[150px]">{lead.address || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{lead.campaign_name || 'Unassigned'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{lead.source}</TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDate(lead.created_at)}</TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDate(lead.last_contact)}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {lead.timeline && lead.timeline.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {lead.timeline.slice(0, 2).map((activity, index) => (
                              <div key={index} className="flex items-center text-xs">
                                {getActivityIcon(activity.type)}
                                <span className="ml-1 truncate max-w-[120px]">
                                  {activity.content || activity.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No recent activities</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEmailClick(lead.email, lead.name)}
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handlePhoneClick(lead.phone)}
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(lead.id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditLead(lead.id)}>
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddTask(lead.id)}>
                                Add Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleScheduleMeeting(lead.id)}>
                                Schedule Meeting
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-red-600"
                              >
                                Delete Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Campaign Creation Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Enter the details for your new marketing campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="campaign-name" className="flex items-center gap-1">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Summer Promotion 2023"
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                  id="campaign-description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  placeholder="Describe the purpose and goals of this campaign"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-start-date" className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" /> Start Date
                </Label>
                <Input
                  id="campaign-start-date"
                  type="date"
                  value={newCampaign.start_date}
                  onChange={(e) => setNewCampaign({...newCampaign, start_date: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-end-date" className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" /> End Date
                </Label>
                <Input
                  id="campaign-end-date"
                  type="date"
                  value={newCampaign.end_date}
                  onChange={(e) => setNewCampaign({...newCampaign, end_date: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-budget" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Budget
                </Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  min="0"
                  step="100"
                  value={newCampaign.budget || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, budget: parseFloat(e.target.value) || undefined})}
                  placeholder="5000"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-status" className="flex items-center gap-1">
                  Status
                </Label>
                <Select
                  value={newCampaign.status}
                  onValueChange={(value) => setNewCampaign({...newCampaign, status: value as Campaign['status']})}
                >
                  <SelectTrigger id="campaign-status" className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-target" className="flex items-center gap-1">
                  <Target className="h-4 w-4" /> Target Audience
                </Label>
                <Input
                  id="campaign-target"
                  value={newCampaign.target_audience}
                  onChange={(e) => setNewCampaign({...newCampaign, target_audience: e.target.value})}
                  placeholder="New customers, existing clients, etc."
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-1">
                <Label htmlFor="campaign-owner" className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> Campaign Owner
                </Label>
                <Input
                  id="campaign-owner"
                  value={newCampaign.owner}
                  onChange={(e) => setNewCampaign({...newCampaign, owner: e.target.value})}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="campaign-goal">Campaign Goal</Label>
                <Input
                  id="campaign-goal"
                  value={newCampaign.goal}
                  onChange={(e) => setNewCampaign({...newCampaign, goal: e.target.value})}
                  placeholder="Increase sales by 20%, generate 100 leads, etc."
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCampaignSubmit}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Lead Dialog */}
      {selectedLeadId && (
        <Dialog open={showEditLeadDialog} onOpenChange={setShowEditLeadDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>
                Update the lead information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Same form fields as in the Add Lead dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-company_name">Company Name</Label>
                  <Input
                    id="edit-company_name"
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={newLead.position}
                    onChange={(e) => setNewLead({...newLead, position: e.target.value})}
                    placeholder="Marketing Manager"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={newLead.status} 
                    onValueChange={(value) => setNewLead({...newLead, status: value as DashboardLead['status']})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed (Won)</SelectItem>
                      <SelectItem value="closed_lost">Closed (Lost)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-source">Source</Label>
                  <Input
                    id="edit-source"
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    placeholder="Website, Referral, etc."
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={newLead.address}
                    onChange={(e) => setNewLead({...newLead, address: e.target.value})}
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-campaign">Campaign</Label>
                  <Select 
                    value={newLead.campaign_id} 
                    onValueChange={(value) => {
                      const campaign = mockCampaigns.find(c => c.id === value);
                      setNewLead({
                        ...newLead, 
                        campaign_id: value
                      });
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    placeholder="Add any notes about this lead..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-linkedin_url">LinkedIn</Label>
                    <Input
                      id="edit-linkedin_url"
                      value={newLead.linkedin_url}
                      onChange={(e) => setNewLead({...newLead, linkedin_url: e.target.value})}
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-facebook_url">Facebook</Label>
                    <Input
                      id="edit-facebook_url"
                      value={newLead.facebook_url}
                      onChange={(e) => setNewLead({...newLead, facebook_url: e.target.value})}
                      placeholder="Facebook URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-twitter_url">Twitter</Label>
                    <Input
                      id="edit-twitter_url"
                      value={newLead.twitter_url}
                      onChange={(e) => setNewLead({...newLead, twitter_url: e.target.value})}
                      placeholder="Twitter URL"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditLeadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateLead(selectedLeadId)}>
                Update Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Task Dialog */}
      {selectedLeadId && currentLead && (
        <TaskDialog
          open={showTaskDialog}
          onOpenChange={setShowTaskDialog}
          leadId={parseInt(selectedLeadId)}
          leadName={currentLead.name || ''}
          isMock={USE_MOCK_DATA}
          onSuccess={(taskData) => {
            if (isEditingTask && currentTask && taskData) {
              // Handle task update
              // handleTaskUpdate({
              //   ...currentTask,
              //   ...taskData
              // });
            } else if (taskData) {
              // Handle task creation
              handleTaskCreate(taskData);
            }
          }}
          task={isEditingTask ? currentTask : undefined}
          isEditing={isEditingTask}
        />
      )}
      
      {/* Meeting Dialog */}
      {selectedLeadId && currentLead && (
        <MeetingDialogNew
          open={showMeetingDialog}
          onOpenChange={setShowMeetingDialog}
          lead={{
            id: selectedLeadId.toString(), // Convert to string
            first_name: currentLead.name.split(' ')[0],
            last_name: currentLead.name.split(' ').slice(1).join(' '),
            email: currentLead.email || '',
            phone: currentLead.phone || '',
            status: ApiLeadStatus.NEW,
            source: ApiLeadSource.WEBSITE,
            created_at: currentLead.created_at || new Date().toISOString(),
            updated_at: currentLead.created_at || new Date().toISOString(),
            notes: currentLead.notes || '',
            company: currentLead.company_name || '',
            job_title: currentLead.position || '',
          }}
          onSuccess={(meetingData) => {
            if (meetingData) {
              // Handle meeting creation
              toast({
                title: "Meeting Scheduled",
                description: "The meeting has been scheduled successfully.",
              });
            }
          }}
        />
      )}
      
      {/* Email Dialog */}
      {selectedLead && (
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={selectedLead.email}
          leadName={selectedLead.name}
          onSuccess={(emailData) => {
            toast({
              title: "Email Sent",
              description: `Email has been sent to ${selectedLead.name}.`,
            });
          }}
        />
      )}
    </div>
  );
} 