'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  UserPlus, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Target,
  Calendar as CalendarIcon,
  Users,
  DollarSign
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { MeetingDialog } from '@/components/meetings/MeetingDialog';
import { openMeetingDialog } from '@/lib/utils/dialogUtils';
import { toast } from '@/components/ui/use-toast';
import { LeadStatus, LeadSource } from '@/lib/types/lead';
import { EmailDialog } from '@/components/communications/EmailDialog';
import { PhoneDialog } from '@/components/communications/PhoneDialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { useCreateLead, useBulkCreateLeads } from "../../hooks/useLeads";

// Lead type definition
type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: string;
  created_at: string;
  last_contact: string | null;
  notes: string;
  score?: number; // Lead score
  address?: string; // Lead address
  campaign_id?: string; // Campaign assignment
  campaign_name?: string; // Campaign name for display
  company_name: string;
  position: string;
  linkedin_url?: string; // LinkedIn profile URL
  facebook_url?: string; // Facebook profile URL
  twitter_url?: string; // Twitter profile URL
};

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

export default function LeadsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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

  // Fetch leads data
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        // For now, using mock data until API is ready
        const mockLeads: Lead[] = [
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            status: 'new',
            source: 'Website',
            created_at: '2023-05-15T10:30:00Z',
            last_contact: null,
            notes: 'Interested in premium plan',
            score: 85,
            address: '123 Main St, San Francisco, CA 94105',
            campaign_id: '1',
            campaign_name: 'Summer Promotion',
            company_name: 'Acme Inc.',
            position: 'Marketing Manager',
            linkedin_url: 'https://www.linkedin.com/in/john-smith',
            facebook_url: 'https://www.facebook.com/john.smith',
            twitter_url: 'https://twitter.com/john_smith'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah.j@company.co',
            phone: '(555) 987-6543',
            status: 'contacted',
            source: 'Referral',
            created_at: '2023-05-10T14:20:00Z',
            last_contact: '2023-05-12T09:15:00Z',
            notes: 'Follow up next week',
            score: 72,
            address: '456 Market St, San Francisco, CA 94103',
            campaign_id: '2',
            campaign_name: 'New Product Launch',
            company_name: 'Tech Solutions',
            position: 'Marketing Specialist',
            linkedin_url: 'https://www.linkedin.com/in/sarah-johnson',
            facebook_url: 'https://www.facebook.com/sarah.johnson',
            twitter_url: 'https://twitter.com/sarah_johnson'
          },
          {
            id: '3',
            name: 'Michael Brown',
            email: 'mbrown@business.org',
            phone: '(555) 456-7890',
            status: 'qualified',
            source: 'LinkedIn',
            created_at: '2023-05-05T11:45:00Z',
            last_contact: '2023-05-11T16:30:00Z',
            notes: 'Needs custom solution',
            score: 91,
            address: '789 Howard St, San Francisco, CA 94103',
            campaign_id: '1',
            campaign_name: 'Summer Promotion',
            company_name: 'Business Solutions',
            position: 'Senior Account Manager',
            linkedin_url: 'https://www.linkedin.com/in/michael-brown',
            facebook_url: 'https://www.facebook.com/michael.brown',
            twitter_url: 'https://twitter.com/michael_brown'
          },
          {
            id: '4',
            name: 'Emily Davis',
            email: 'emily.davis@tech.io',
            phone: '(555) 234-5678',
            status: 'proposal',
            source: 'Conference',
            created_at: '2023-04-28T09:00:00Z',
            last_contact: '2023-05-09T13:45:00Z',
            notes: 'Sent proposal on 5/9',
            score: 65,
            address: '101 California St, San Francisco, CA 94111',
            campaign_id: '3',
            campaign_name: 'Enterprise Outreach',
            company_name: 'Tech Solutions',
            position: 'Product Manager',
            linkedin_url: 'https://www.linkedin.com/in/emily-davis',
            facebook_url: 'https://www.facebook.com/emily.davis',
            twitter_url: 'https://twitter.com/emily_davis'
          },
          {
            id: '5',
            name: 'David Wilson',
            email: 'dwilson@enterprise.net',
            phone: '(555) 876-5432',
            status: 'negotiation',
            source: 'Cold Call',
            created_at: '2023-04-20T15:10:00Z',
            last_contact: '2023-05-08T10:20:00Z',
            notes: 'Negotiating contract terms',
            score: 88,
            address: '555 Mission St, San Francisco, CA 94105',
            campaign_id: '2',
            campaign_name: 'New Product Launch',
            company_name: 'Enterprise Solutions',
            position: 'Sales Representative',
            linkedin_url: 'https://www.linkedin.com/in/david-wilson',
            facebook_url: 'https://www.facebook.com/david.wilson',
            twitter_url: 'https://twitter.com/david_wilson'
          }
        ];
        
        setLeads(mockLeads);
        setIsLoading(false);
        
        // Uncomment when API is ready
        // const response = await apiClient.get<Lead[]>('leads');
        // setLeads(response);
        // setIsLoading(false);
      } catch (error) {
        console.error('Error fetching leads:', error);
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search query and status filter
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === null || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

      // For now, just adding to local state
      // TODO: In production, connect to the API using the hooks from useLeads.ts
      const selectedCampaign = mockCampaigns.find(c => c.id === newLead.campaign_id);
      
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
      
      // In production, you would use the API like this:
      // try {
      //   const createdLead = await createLead(
      //     {
      //       first_name: newLead.name.split(' ')[0],
      //       last_name: newLead.name.split(' ').slice(1).join(' '),
      //       email: newLead.email,
      //       phone: newLead.phone,
      //       company_name: newLead.company_name,
      //       job_title: newLead.position,
      //       source: newLead.source,
      //       status: newLead.status,
      //       linkedin_url: newLead.linkedin_url,
      //       facebook_url: newLead.facebook_url,
      //       twitter_url: newLead.twitter_url,
      //       notes: newLead.notes,
      //       campaign_id: newLead.campaign_id
      //     },
      //     singleLeadDuplicateHandling
      //   );
      //   
      //   if (createdLead) {
      //     setLeads([createdLead, ...leads]);
      //     setShowAddLeadDialog(false);
      //     resetLeadForm();
      //   }
      // } catch (error) {
      //   if (error.message === 'Duplicate lead found') {
      //     setShowDuplicateAlert(true);
      //     return;
      //   }
      //   throw error;
      // }
      
      const newLeadWithId: Lead = {
        ...newLead,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        last_contact: null,
        status: newLead.status as Lead['status'],
        campaign_name: selectedCampaign?.name || 'Unassigned',
        score: leadScore
      };
      
      setLeads([newLeadWithId, ...leads]);
      setShowAddLeadDialog(false);
      
      // Reset form
      resetLeadForm();
      
      toast({
        title: 'Lead Added',
        description: 'New lead has been added successfully.',
      });
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
    setShowDuplicateAlert(false);
    setSingleLeadDuplicateHandling('skip');
  };

  // Calculate lead score based on available information
  const calculateLeadScore = (lead: any): number => {
    let score = 50; // Base score
    
    // Increase score for more complete information
    if (lead.email) score += 10;
    if (lead.phone) score += 10;
    if (lead.company_name) score += 10;
    if (lead.position) score += 5;
    if (lead.notes && lead.notes.length > 20) score += 5;
    
    // Increase score for social media profiles
    if (lead.linkedin_url) score += 7;
    if (lead.facebook_url) score += 3;
    if (lead.twitter_url) score += 3;
    
    // Cap score at 100
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
    // Find the lead with this email
    const lead = leads.find(l => l.email === email);
    if (lead) {
      setSelectedLead(lead);
      setShowEmailDialog(true);
    }
  };

  const handlePhoneClick = (phone: string) => {
    // Use the PhoneDialog component
    setSelectedLead({
      id: '',
      name: '',
      email: '',
      phone: phone,
      status: 'new',
      source: '',
      created_at: '',
      last_contact: null,
      notes: '',
      score: 50,
      address: '',
      campaign_id: '',
      campaign_name: '',
      company_name: '',
      position: '',
      linkedin_url: '',
      facebook_url: '',
      twitter_url: ''
    });
    setShowPhoneDialog(true);
  };

  const handleViewDetails = (leadId: string) => {
    router.push(`/dashboard/leads/${leadId}`);
  };

  const handleEditLead = (leadId: string) => {
    // Navigate to lead detail page
    router.push(`/dashboard/leads/${leadId}`);
  };

  const handleAddTask = (leadId: string) => {
    // Navigate to lead detail page with query parameter to open task dialog
    router.push(`/dashboard/leads/${leadId}?openTask=true`);
  };

  const handleScheduleMeeting = (leadId: string) => {
    // Open the meeting dialog
    console.log('Opening meeting dialog for lead:', leadId);
    openMeetingDialog(`lead-meeting-dialog-${leadId}`);
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

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!file || !validationResults?.valid) return;
    
    // Check if a campaign is selected
    if (selectedCampaignId === 'unassigned') {
      toast({
        title: 'Campaign Required',
        description: 'Please select or create a campaign for these leads.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      
      const newLeads: Lead[] = [];
      
      // Parse rows into lead objects
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // Skip empty rows
        
        const values = rows[i].split(',').map(v => v.trim());
        const leadData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            leadData[header] = values[index];
          }
        });
        
        // Set default values for missing fields
        const status = leadData.status || 'new';
        const source = leadData.source || 'website';
        const selectedCampaign = mockCampaigns.find(c => c.id === selectedCampaignId);
        
        // Calculate lead score
        const leadScore = calculateLeadScore({
          email: leadData.email,
          phone: leadData.phone,
          company_name: leadData.company_name,
          position: leadData.position,
          notes: leadData.notes,
          linkedin_url: leadData.linkedin_url,
          facebook_url: leadData.facebook_url,
          twitter_url: leadData.twitter_url
        });
        
        // Create new lead
        const newLead: Lead = {
          id: `temp-bulk-${Date.now()}-${i}`,
          name: leadData.name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
          email: leadData.email || '',
          phone: leadData.phone || '',
          status: status as Lead['status'],
          source: source,
          notes: leadData.notes || '',
          address: leadData.address || '',
          company_name: leadData.company_name || '',
          position: leadData.position || leadData.job_title || '',
          linkedin_url: leadData.linkedin_url || '',
          facebook_url: leadData.facebook_url || '',
          twitter_url: leadData.twitter_url || '',
          created_at: new Date().toISOString(),
          last_contact: null,
          campaign_id: selectedCampaignId,
          campaign_name: selectedCampaign?.name || 'Unassigned',
          score: leadScore
        };
        
        newLeads.push(newLead);
        
        // Update progress
        const progress = Math.round((i / (rows.length - 1)) * 100);
        setUploadProgress(progress);
      }
      
      // TODO: In production, connect to the API using the hooks from useLeads.ts
      // Simulate upload delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, you would use the API like this:
      // const apiLeadsData = newLeads.map(lead => ({
      //   first_name: lead.name.split(' ')[0],
      //   last_name: lead.name.split(' ').slice(1).join(' '),
      //   email: lead.email,
      //   phone: lead.phone,
      //   company: lead.company_name,
      //   title: lead.position,
      //   source: lead.source,
      //   status: lead.status,
      //   linkedin_url: lead.linkedin_url,
      //   facebook_url: lead.facebook_url,
      //   twitter_url: lead.twitter_url,
      //   custom_fields: { notes: lead.notes },
      //   campaign_ids: lead.campaign_id ? [parseInt(lead.campaign_id)] : []
      // }));
      // 
      // const result = await bulkCreateLeads(
      //   apiLeadsData, 
      //   duplicateHandling,
      //   selectedCampaignId !== 'unassigned' ? [parseInt(selectedCampaignId)] : undefined
      // );
      
      // Add new leads to the list
      setLeads([...newLeads, ...leads]);
      
      setUploadStatus('success');
      toast({
        title: 'Upload Successful',
        description: `${newLeads.length} leads have been imported successfully.`,
      });
      
      // Close dialog after a delay
      setTimeout(() => {
        setShowAddLeadDialog(false);
        setFile(null);
        setUploadStatus('idle');
        setValidationResults(null);
        setSelectedCampaignId('unassigned');
      }, 2000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to upload leads. Please try again.');
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the leads.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
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
                        onValueChange={(value) => setNewLead({...newLead, status: value as Lead['status']})}
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
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Score</TableHead>
                <TableHead className="hidden lg:table-cell">Address</TableHead>
                <TableHead className="hidden lg:table-cell">Campaign</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    No leads found. Try adjusting your search or add a new lead.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`mr-2 h-2 w-2 rounded-full ${
                          lead.status === 'new' ? 'bg-blue-500' :
                          lead.status === 'contacted' ? 'bg-purple-500' :
                          lead.status === 'qualified' ? 'bg-amber-500' :
                          lead.status === 'proposal' ? 'bg-orange-500' :
                          lead.status === 'negotiation' ? 'bg-pink-500' :
                          lead.status === 'closed_won' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></span>
                        <span className="capitalize">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          (lead.score || 0) >= 80 ? 'text-green-600' :
                          (lead.score || 0) >= 60 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {lead.score || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.address || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.campaign_name || 'Unassigned'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.source}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(lead.created_at)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(lead.last_contact)}</TableCell>
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
                              className="text-red-600"
                              onClick={() => handleDeleteLead(lead.id)}
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
        </CardContent>
      </Card>

      {/* Meeting dialogs for each lead */}
      {leads.map(lead => {
        // Map status to LeadStatus enum
        let leadStatus: LeadStatus;
        switch (lead.status) {
          case 'new': leadStatus = LeadStatus.NEW; break;
          case 'contacted': leadStatus = LeadStatus.CONTACTED; break;
          case 'qualified': leadStatus = LeadStatus.QUALIFIED; break;
          case 'proposal': leadStatus = LeadStatus.PROPOSAL; break;
          case 'negotiation': leadStatus = LeadStatus.NEGOTIATION; break;
          case 'closed_won': leadStatus = LeadStatus.WON; break;
          case 'closed_lost': leadStatus = LeadStatus.LOST; break;
          default: leadStatus = LeadStatus.NEW;
        }
        
        // Map source to LeadSource enum
        let leadSource: LeadSource;
        switch (lead.source) {
          case 'website': leadSource = LeadSource.WEBSITE; break;
          case 'referral': leadSource = LeadSource.REFERRAL; break;
          case 'linkedin': leadSource = LeadSource.LINKEDIN; break;
          case 'cold_call': leadSource = LeadSource.COLD_CALL; break;
          case 'email_campaign': leadSource = LeadSource.EMAIL_CAMPAIGN; break;
          case 'event': leadSource = LeadSource.EVENT; break;
          default: leadSource = LeadSource.OTHER;
        }
        
        return (
          <MeetingDialog 
            key={`meeting-dialog-${lead.id}`}
            id={`lead-meeting-dialog-${lead.id}`} 
            lead={{
              id: parseInt(lead.id),
              email: lead.email,
              first_name: lead.name.split(' ')[0],
              last_name: lead.name.split(' ').slice(1).join(' '),
              full_name: lead.name,
              status: leadStatus,
              source: leadSource,
              created_at: lead.created_at,
              updated_at: lead.created_at,
              company: '',
              custom_fields: {},
              lead_score: 0
            }}
            onSuccess={() => {
              toast({
                title: "Meeting scheduled",
                description: "The meeting has been successfully scheduled.",
              });
            }}
          />
        );
      })}

      {/* Add the EmailDialog component */}
      {selectedLead && (
        <EmailDialog 
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          leadEmail={selectedLead.email}
          leadName={selectedLead.name}
        />
      )}

      {/* Add the PhoneDialog component */}
      {selectedLead && (
        <PhoneDialog 
          open={showPhoneDialog}
          onOpenChange={setShowPhoneDialog}
          leadPhone={selectedLead.phone}
          leadName={selectedLead.name}
        />
      )}

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
    </div>
  );
} 