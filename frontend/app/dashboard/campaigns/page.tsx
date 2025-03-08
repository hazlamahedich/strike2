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
  Megaphone, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Mail, 
  Calendar, 
  BarChart3, 
  Users,
  Play,
  Pause,
  MessageSquare
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import { validateCampaignAction } from '@/lib/utils/campaignUtils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Mock data flag - set to false when ready to use real Supabase data
const USE_MOCK_DATA = true;

// Mock campaigns data for development
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Promotion',
    status: 'active',
    type: 'email',
    target_audience: 'All leads',
    start_date: '2023-06-01T00:00:00Z',
    end_date: '2023-06-30T00:00:00Z',
    leads_count: 1250,
    open_rate: 32.5,
    click_rate: 12.8,
    conversion_rate: 3.2,
    created_at: '2023-05-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Product Launch',
    status: 'draft',
    type: 'multi-channel',
    target_audience: 'Premium customers',
    start_date: '2023-07-15T00:00:00Z',
    end_date: null,
    leads_count: 500,
    created_at: '2023-05-20T14:20:00Z',
  },
  {
    id: '3',
    name: 'Re-engagement',
    status: 'paused',
    type: 'email',
    target_audience: 'Inactive leads',
    start_date: '2023-05-10T00:00:00Z',
    end_date: '2023-05-25T00:00:00Z',
    leads_count: 875,
    open_rate: 18.3,
    click_rate: 5.7,
    conversion_rate: 1.2,
    created_at: '2023-05-05T11:45:00Z',
  },
  {
    id: '4',
    name: 'Webinar Invitation',
    status: 'completed',
    type: 'email',
    target_audience: 'Tech industry leads',
    start_date: '2023-04-20T00:00:00Z',
    end_date: '2023-04-27T00:00:00Z',
    leads_count: 350,
    open_rate: 45.2,
    click_rate: 28.6,
    conversion_rate: 15.3,
    created_at: '2023-04-15T09:00:00Z',
  },
  {
    id: '5',
    name: 'SMS Promotion',
    status: 'active',
    type: 'sms',
    target_audience: 'Local customers',
    start_date: '2023-05-25T00:00:00Z',
    end_date: '2023-06-10T00:00:00Z',
    leads_count: 620,
    click_rate: 8.2,
    conversion_rate: 4.5,
    created_at: '2023-05-18T15:10:00Z',
  }
];

// Custom Progress component since we don't have the ui/progress component
const Progress = ({ value = 0, className = "" }: { value?: number, className?: string }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  );
};

// Campaign type definition
type Campaign = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'cancelled';
  type: 'email' | 'sms' | 'social' | 'multi-channel';
  target_audience: string;
  start_date: string;
  end_date: string | null;
  leads_count: number;
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  created_at: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddCampaignDialog, setShowAddCampaignDialog] = useState(false);
  const [showEditCampaignDialog, setShowEditCampaignDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    start_date: '',
    end_date: '',
    status: 'scheduled' as Campaign['status']
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    status: 'draft',
    type: 'email',
    target_audience: '',
    start_date: '',
    end_date: '',
  });
  const router = useRouter();

  // Fetch campaigns data
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        
        if (USE_MOCK_DATA) {
          // Use mock data for development
          setCampaigns(mockCampaigns);
          setIsLoading(false);
          return;
        }
        
        // Use real API data when ready
        const { data, error } = await apiClient.get<Campaign[]>('campaigns');
        
        if (error) {
          console.error('Error fetching campaigns:', error);
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setCampaigns(data);
        } else {
          setCampaigns([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Filter campaigns based on search query and status filter
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchQuery === '' || 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.target_audience.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === null || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle adding a new campaign
  const handleAddCampaign = async () => {
    try {
      // Validate required fields
      if (!newCampaign.name || !newCampaign.type || !newCampaign.start_date) {
        // You could add a toast notification here
        console.error('Please fill in all required fields');
        return;
      }

      if (USE_MOCK_DATA) {
        // Mock adding a campaign
        const newCampaignWithId: Campaign = {
          ...newCampaign,
          id: `temp-${Date.now()}`,
          leads_count: 0,
          created_at: new Date().toISOString(),
          end_date: newCampaign.end_date || null,
          status: newCampaign.status as Campaign['status'],
          type: newCampaign.type as Campaign['type']
        };
        
        setCampaigns([newCampaignWithId, ...campaigns]);
        setShowAddCampaignDialog(false);
        setNewCampaign({
          name: '',
          status: 'draft',
          type: 'email',
          target_audience: '',
          start_date: '',
          end_date: '',
        });
        return;
      }
      
      // Send to API
      const { data, error } = await apiClient.post<Campaign>('campaigns', newCampaign);
      
      if (error) {
        console.error('Error creating campaign:', error);
        return;
      }
      
      if (data) {
        // Add the new campaign to the state
        setCampaigns([data, ...campaigns]);
        
        // Close dialog and reset form
        setShowAddCampaignDialog(false);
        setNewCampaign({
          name: '',
          status: 'draft',
          type: 'email',
          target_audience: '',
          start_date: '',
          end_date: '',
        });
      }
    } catch (error) {
      console.error('Error adding campaign:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get status badge color
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-amber-500';
      case 'draft':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      case 'scheduled':
        return 'bg-purple-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get campaign type icon
  const getCampaignTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'multi-channel':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  // Handle campaign status toggle (play/pause)
  const handleStatusToggle = async (campaign: Campaign) => {
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      
      if (USE_MOCK_DATA) {
        // Mock status toggle
        setCampaigns(campaigns.map(c => 
          c.id === campaign.id ? { ...c, status: newStatus } : c
        ));
        return;
      }
      
      // Call API to update campaign status
      const { data, error } = await apiClient.put<Campaign>('campaigns', {
        ...campaign,
        status: newStatus
      });
      
      if (error) {
        console.error('Error updating campaign status:', error);
        return;
      }
      
      if (data) {
        // Update campaign in state
        setCampaigns(campaigns.map(c => 
          c.id === campaign.id ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  };

  // Handle campaign deletion
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      if (USE_MOCK_DATA) {
        // Mock deletion
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
        return;
      }
      
      // Call API to delete campaign
      const { error } = await apiClient.delete('campaigns', campaignId);
      
      if (error) {
        console.error('Error deleting campaign:', error);
        return;
      }
      
      // Remove campaign from state
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Handle editing a campaign
  const handleEditCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    setShowEditCampaignDialog(true);
  };

  // Handle updating a campaign
  const handleUpdateCampaign = async () => {
    if (!currentCampaign) return;

    try {
      if (USE_MOCK_DATA) {
        // Mock update
        setCampaigns(campaigns.map(c => 
          c.id === currentCampaign.id ? currentCampaign : c
        ));
        
        // Close dialog
        setShowEditCampaignDialog(false);
        setCurrentCampaign(null);
        return;
      }
      
      // Call API to update campaign
      const { data, error } = await apiClient.put<Campaign>('campaigns', {
        ...currentCampaign
      });
      
      if (error) {
        console.error('Error updating campaign:', error);
        return;
      }
      
      if (data) {
        // Update campaign in state
        setCampaigns(campaigns.map(c => 
          c.id === currentCampaign.id ? data : c
        ));
        
        // Close dialog
        setShowEditCampaignDialog(false);
        setCurrentCampaign(null);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  // Handle duplicating a campaign
  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      // Create a new campaign based on the existing one
      const duplicatedCampaign = {
        name: `${campaign.name} (Copy)`,
        status: 'draft', // Always start as draft
        type: campaign.type,
        target_audience: campaign.target_audience,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      };
      
      if (USE_MOCK_DATA) {
        // Mock duplication
        const newCampaignWithId: Campaign = {
          ...duplicatedCampaign,
          id: `temp-${Date.now()}`,
          leads_count: 0,
          created_at: new Date().toISOString(),
          end_date: duplicatedCampaign.end_date || null,
          status: duplicatedCampaign.status as Campaign['status'],
          type: duplicatedCampaign.type as Campaign['type']
        };
        
        setCampaigns([newCampaignWithId, ...campaigns]);
        return;
      }
      
      // Call API to create the duplicated campaign
      const { data, error } = await apiClient.post<Campaign>('campaigns', duplicatedCampaign);
      
      if (error) {
        console.error('Error duplicating campaign:', error);
        return;
      }
      
      if (data) {
        // Add the new campaign to the state
        setCampaigns([data, ...campaigns]);
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
    }
  };

  // Handle viewing campaign details
  const handleViewDetails = async (campaign: Campaign) => {
    try {
      setCurrentCampaign(campaign);
      setIsLoadingDetails(true);
      setShowDetailsDialog(true);
      
      if (USE_MOCK_DATA) {
        // Mock campaign details - just use the campaign itself
        setCampaignDetails({
          ...campaign,
          lead_sample: [
            { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', company: 'Acme Inc.' },
            { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', company: 'XYZ Corp' },
            { id: 3, first_name: 'Bob', last_name: 'Johnson', email: 'bob.johnson@example.com', company: 'ABC Ltd' }
          ]
        });
        setIsLoadingDetails(false);
        return;
      }
      
      // Call API to get campaign details
      const { data, error } = await apiClient.get<any>(`campaigns/${campaign.id}`);
      
      if (error) {
        console.error('Error fetching campaign details:', error);
        setIsLoadingDetails(false);
        return;
      }
      
      if (data) {
        setCampaignDetails(data);
      }
      
      setIsLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setIsLoadingDetails(false);
    }
  };

  // Handle scheduling a campaign
  const handleScheduleCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    
    // Initialize schedule data with current campaign dates
    setScheduleData({
      start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
      status: 'scheduled'
    });
    
    setShowScheduleDialog(true);
  };
  
  // Handle saving schedule
  const handleSaveSchedule = async () => {
    if (!currentCampaign) return;
    
    try {
      // Validate dates
      if (!scheduleData.start_date) {
        console.error('Start date is required');
        return;
      }
      
      if (USE_MOCK_DATA) {
        // Mock schedule update
        setCampaigns(campaigns.map(c => 
          c.id === currentCampaign.id ? {
            ...currentCampaign,
            start_date: scheduleData.start_date,
            end_date: scheduleData.end_date || null,
            status: scheduleData.status
          } : c
        ));
        
        // Close dialog
        setShowScheduleDialog(false);
        setCurrentCampaign(null);
        return;
      }
      
      // Call API to update campaign with schedule
      const { data, error } = await apiClient.put<Campaign>('campaigns', {
        ...currentCampaign,
        start_date: scheduleData.start_date,
        end_date: scheduleData.end_date || null,
        status: scheduleData.status
      });
      
      if (error) {
        console.error('Error scheduling campaign:', error);
        return;
      }
      
      if (data) {
        // Update campaign in state
        setCampaigns(campaigns.map(c => 
          c.id === currentCampaign.id ? data : c
        ));
        
        // Close dialog
        setShowScheduleDialog(false);
        setCurrentCampaign(null);
      }
    } catch (error) {
      console.error('Error scheduling campaign:', error);
    }
  };

  // Handle adding leads to campaign
  const handleAddLeadsToCampaign = (campaign: Campaign) => {
    // Check if leads can be added based on campaign status
    if (!validateCampaignAction(campaign.status, 'lead')) {
      return;
    }
    
    // Continue with adding leads logic
    // This would typically open a dialog or navigate to a page for adding leads
    toast.success('You can now add leads to this campaign');
    // Example: router.push(`/dashboard/campaigns/${campaign.id}/add-leads`);
  };

  // Handle adding activities to campaign
  const handleAddActivitiesToCampaign = (campaign: Campaign) => {
    // Check if activities can be added based on campaign status
    if (!validateCampaignAction(campaign.status, 'activity')) {
      return;
    }
    
    // Continue with adding activities logic
    toast.success('You can now add activities to this campaign');
    // Example: router.push(`/dashboard/campaigns/${campaign.id}/add-activities`);
  };

  // Handle viewing campaign analytics
  const handleViewAnalytics = (campaignId: string) => {
    router.push(`/dashboard/campaigns/${campaignId}/analytics`);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
        <Dialog open={showAddCampaignDialog} onOpenChange={setShowAddCampaignDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span>Create Campaign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Enter the details of your new marketing campaign. You can edit all settings later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    placeholder="Summer Promotion 2023"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select 
                    value={newCampaign.type} 
                    onValueChange={(value) => setNewCampaign({...newCampaign, type: value})}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="multi-channel">Multi-channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newCampaign.status} 
                    onValueChange={(value) => setNewCampaign({...newCampaign, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Input
                    id="target_audience"
                    value={newCampaign.target_audience}
                    onChange={(e) => setNewCampaign({...newCampaign, target_audience: e.target.value})}
                    placeholder="All leads, Premium customers, etc."
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({...newCampaign, start_date: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({...newCampaign, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCampaignDialog(false)}>Cancel</Button>
              <Button onClick={handleAddCampaign}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Audience</TableHead>
                <TableHead className="hidden lg:table-cell">Leads</TableHead>
                <TableHead className="hidden lg:table-cell">Performance</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading campaigns...
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No campaigns found. Try adjusting your search or create a new campaign.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`mr-2 h-2 w-2 rounded-full ${getStatusColor(campaign.status)}`}></span>
                        <span className="capitalize">
                          {campaign.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {getCampaignTypeIcon(campaign.type)}
                        <span className="capitalize">{campaign.type.replace('-', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{campaign.target_audience}</TableCell>
                    <TableCell className="hidden lg:table-cell">{campaign.leads_count.toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campaign.conversion_rate ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Conversion: {campaign.conversion_rate}%</span>
                          </div>
                          <Progress value={campaign.conversion_rate} className="h-1" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No data yet</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <div>Start: {formatDate(campaign.start_date)}</div>
                        <div>End: {formatDate(campaign.end_date)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {campaign.status === 'active' ? (
                          <Button variant="ghost" size="icon" title="Pause Campaign" onClick={() => handleStatusToggle(campaign)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status !== 'completed' ? (
                          <Button variant="ghost" size="icon" title="Start Campaign" onClick={() => handleStatusToggle(campaign)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="View Analytics"
                          onClick={() => handleViewAnalytics(campaign.id)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(campaign)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleCampaign(campaign)}>Schedule</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAnalytics(campaign.id)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAddLeadsToCampaign(campaign)}>Add Leads</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddActivitiesToCampaign(campaign)}>Add Activities</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCampaign(campaign.id)}>Delete Campaign</DropdownMenuItem>
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

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditCampaignDialog} onOpenChange={setShowEditCampaignDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update the details of your campaign.
            </DialogDescription>
          </DialogHeader>
          {currentCampaign && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-name">Campaign Name</Label>
                  <Input
                    id="edit-name"
                    value={currentCampaign.name}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, name: e.target.value})}
                    placeholder="Summer Promotion 2023"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-type">Campaign Type</Label>
                  <Select 
                    value={currentCampaign.type} 
                    onValueChange={(value) => setCurrentCampaign({...currentCampaign, type: value as Campaign['type']})}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="multi-channel">Multi-channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={currentCampaign.status} 
                    onValueChange={(value) => setCurrentCampaign({...currentCampaign, status: value as Campaign['status']})}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-target_audience">Target Audience</Label>
                  <Input
                    id="edit-target_audience"
                    value={currentCampaign.target_audience}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, target_audience: e.target.value})}
                    placeholder="All leads, Premium customers, etc."
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-start_date">Start Date</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={currentCampaign.start_date ? new Date(currentCampaign.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, start_date: e.target.value})}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="edit-end_date">End Date (Optional)</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={currentCampaign.end_date ? new Date(currentCampaign.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentCampaign({...currentCampaign, end_date: e.target.value || null})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCampaignDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateCampaign}>Update Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Detailed information about the campaign.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="py-8 text-center">Loading campaign details...</div>
          ) : currentCampaign ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Campaign Name</h3>
                  <p className="text-base">{currentCampaign.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(currentCampaign.status)}`}></span>
                    <span className="capitalize">{currentCampaign.status}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getCampaignTypeIcon(currentCampaign.type)}
                    <span className="capitalize">{currentCampaign.type.replace('-', ' ')}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Target Audience</h3>
                  <p className="text-base">{currentCampaign.target_audience}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                  <p className="text-base">{formatDate(currentCampaign.start_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                  <p className="text-base">{formatDate(currentCampaign.end_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Leads</h3>
                  <p className="text-base">{currentCampaign.leads_count.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-base">{formatDate(currentCampaign.created_at)}</p>
                </div>
              </div>
              
              {currentCampaign.open_rate !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Performance</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Open Rate</span>
                        <span>{currentCampaign.open_rate}%</span>
                      </div>
                      <Progress value={currentCampaign.open_rate} className="h-1 mt-1" />
                    </div>
                    {currentCampaign.click_rate !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Click Rate</span>
                          <span>{currentCampaign.click_rate}%</span>
                        </div>
                        <Progress value={currentCampaign.click_rate} className="h-1 mt-1" />
                      </div>
                    )}
                    {currentCampaign.conversion_rate !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Conversion Rate</span>
                          <span>{currentCampaign.conversion_rate}%</span>
                        </div>
                        <Progress value={currentCampaign.conversion_rate} className="h-1 mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Additional details from API if available */}
              {campaignDetails && campaignDetails.lead_sample && campaignDetails.lead_sample.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Sample Leads</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignDetails.lead_sample.map((lead: any) => (
                          <TableRow key={lead.id}>
                            <TableCell>{lead.first_name} {lead.last_name}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">No campaign selected</div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
            {currentCampaign && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleViewAnalytics(currentCampaign.id);
                  }}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button onClick={() => {
                  setShowDetailsDialog(false);
                  handleEditCampaign(currentCampaign);
                }}>Edit Campaign</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Campaign Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Set the start and end dates for your campaign.
            </DialogDescription>
          </DialogHeader>
          
          {currentCampaign && (
            <div className="grid gap-4 py-4">
              <div>
                <h3 className="font-medium mb-2">{currentCampaign.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="schedule-start-date">Start Date</Label>
                  <Input
                    id="schedule-start-date"
                    type="date"
                    value={scheduleData.start_date}
                    onChange={(e) => setScheduleData({...scheduleData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="schedule-end-date">End Date (Optional)</Label>
                  <Input
                    id="schedule-end-date"
                    type="date"
                    value={scheduleData.end_date}
                    onChange={(e) => setScheduleData({...scheduleData, end_date: e.target.value})}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="schedule-status">Status</Label>
                  <Select 
                    value={scheduleData.status} 
                    onValueChange={(value) => setScheduleData({...scheduleData, status: value as Campaign['status']})}
                  >
                    <SelectTrigger id="schedule-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSchedule}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 