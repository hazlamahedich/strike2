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
  MessageSquare 
} from 'lucide-react';
import apiClient from '@/lib/api/client';

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
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    source: '',
    notes: ''
  });

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
            notes: 'Interested in premium plan'
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
            notes: 'Follow up next week'
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
            notes: 'Needs custom solution'
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
            notes: 'Sent proposal on 5/9'
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
            notes: 'Negotiating contract terms'
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
    const matchesSearch = searchQuery === '' || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === null || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle adding a new lead
  const handleAddLead = async () => {
    try {
      // For now, just adding to local state
      // In production, would send to API first
      const newLeadWithId: Lead = {
        ...newLead,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        last_contact: null,
        status: newLead.status as Lead['status']
      };
      
      setLeads([newLeadWithId, ...leads]);
      setShowAddLeadDialog(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        status: 'new',
        source: '',
        notes: ''
      });
      
      // Uncomment when API is ready
      // await apiClient.post('leads', newLead);
    } catch (error) {
      console.error('Error adding lead:', error);
    }
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
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Enter the details of the new lead. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newLead.status} 
                    onValueChange={(value) => setNewLead({...newLead, status: value})}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddLeadDialog(false)}>Cancel</Button>
              <Button onClick={handleAddLead}>Save Lead</Button>
            </DialogFooter>
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
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Last Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
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
                    <TableCell className="hidden lg:table-cell">{lead.source}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(lead.created_at)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(lead.last_contact)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                            <DropdownMenuItem>Add Task</DropdownMenuItem>
                            <DropdownMenuItem>Schedule Meeting</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete Lead</DropdownMenuItem>
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