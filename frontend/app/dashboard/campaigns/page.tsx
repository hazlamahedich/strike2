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
  status: 'draft' | 'active' | 'paused' | 'completed';
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
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    status: 'draft',
    type: 'email',
    target_audience: '',
    start_date: '',
    end_date: '',
  });

  // Fetch campaigns data
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        // For now, using mock data until API is ready
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
        
        setCampaigns(mockCampaigns);
        setIsLoading(false);
        
        // Uncomment when API is ready
        // const response = await apiClient.get<Campaign[]>('campaigns');
        // setCampaigns(response);
        // setIsLoading(false);
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
      // For now, just adding to local state
      // In production, would send to API first
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
      
      // Uncomment when API is ready
      // await apiClient.post('campaigns', newCampaign);
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
                          <Button variant="ghost" size="icon" title="Pause Campaign">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status !== 'completed' ? (
                          <Button variant="ghost" size="icon" title="Start Campaign">
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" title="View Analytics">
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Schedule</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Campaign</DropdownMenuItem>
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
    </div>
  );
} 