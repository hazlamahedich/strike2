'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define deal stages
const STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-blue-500' },
  { id: 'qualified', name: 'Qualified', color: 'bg-purple-500' },
  { id: 'proposal', name: 'Proposal', color: 'bg-orange-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-amber-500' },
  { id: 'closed_won', name: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed_lost', name: 'Closed Lost', color: 'bg-red-500' },
];

// Mock deals data
const MOCK_DEALS = [
  {
    id: '1',
    title: 'Enterprise Software Package',
    company: 'Acme Inc.',
    value: 75000,
    stage: 'lead',
    contact: 'Jane Smith',
    contactAvatar: '',
    probability: 20,
    expectedCloseDate: '2023-08-15',
    lastActivity: '2023-06-10',
    tags: ['Software', 'Enterprise'],
  },
  {
    id: '2',
    title: 'Consulting Services',
    company: 'TechCorp',
    value: 45000,
    stage: 'qualified',
    contact: 'John Doe',
    contactAvatar: '',
    probability: 40,
    expectedCloseDate: '2023-07-30',
    lastActivity: '2023-06-12',
    tags: ['Services', 'Consulting'],
  },
  {
    id: '3',
    title: 'Product Implementation',
    company: 'InnoSoft',
    value: 120000,
    stage: 'proposal',
    contact: 'Sarah Johnson',
    contactAvatar: '',
    probability: 60,
    expectedCloseDate: '2023-07-15',
    lastActivity: '2023-06-14',
    tags: ['Implementation'],
  },
  {
    id: '4',
    title: 'Annual Support Contract',
    company: 'GlobalTech Inc.',
    value: 95000,
    stage: 'negotiation',
    contact: 'Michael Brown',
    contactAvatar: '',
    probability: 80,
    expectedCloseDate: '2023-06-30',
    lastActivity: '2023-06-15',
    tags: ['Support', 'Annual'],
  },
  {
    id: '5',
    title: 'Software Upgrade',
    company: 'NextStep Solutions',
    value: 35000,
    stage: 'closed_won',
    contact: 'Emily Davis',
    contactAvatar: '',
    probability: 100,
    expectedCloseDate: '2023-06-05',
    lastActivity: '2023-06-05',
    tags: ['Upgrade', 'Software'],
  },
  {
    id: '6',
    title: 'Hardware Purchase',
    company: 'Innovate Labs',
    value: 65000,
    stage: 'closed_lost',
    contact: 'Robert Wilson',
    contactAvatar: '',
    probability: 0,
    expectedCloseDate: '2023-06-01',
    lastActivity: '2023-05-28',
    tags: ['Hardware'],
  },
  {
    id: '7',
    title: 'Cloud Migration Project',
    company: 'DataFlow Systems',
    value: 150000,
    stage: 'qualified',
    contact: 'Amanda Lee',
    contactAvatar: '',
    probability: 45,
    expectedCloseDate: '2023-08-30',
    lastActivity: '2023-06-13',
    tags: ['Cloud', 'Migration'],
  },
];

export default function DealsPage() {
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter deals based on search query
  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage === stage.id);
    return acc;
  }, {} as Record<string, typeof MOCK_DEALS>);
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    
    // Update the deal's stage
    const updatedDeals = deals.map(deal => 
      deal.id === dealId ? { ...deal, stage: stageId } : deal
    );
    
    setDeals(updatedDeals);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Calculate total value of deals
  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  
  // Calculate weighted pipeline value
  const weightedValue = filteredDeals
    .filter(deal => deal.stage !== 'closed_lost')
    .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  
  return (
    <div className="space-y-6 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Deal
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Kanban View</DropdownMenuItem>
              <DropdownMenuItem>List View</DropdownMenuItem>
              <DropdownMenuItem>Table View</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredDeals.length} active deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weighted Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weightedValue)}</div>
            <p className="text-xs text-muted-foreground">
              Based on probability of winning
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredDeals.length ? totalValue / filteredDeals.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredDeals.filter(d => d.stage === 'closed_won').length} deals won this month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <Input
            type="text"
            placeholder="Search deals..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deals</SelectItem>
            <SelectItem value="my_deals">My Deals</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="high_value">High Value</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
        {STAGES.map(stage => (
          <div 
            key={stage.id}
            className="min-w-[300px]"
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`}></div>
                <h3 className="font-medium">{stage.name}</h3>
              </div>
              <Badge variant="outline">{dealsByStage[stage.id]?.length || 0}</Badge>
            </div>
            <div className="space-y-3">
              {dealsByStage[stage.id]?.map(deal => (
                <Card 
                  key={deal.id}
                  className="cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{deal.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(deal.value)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{deal.company}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={deal.contactAvatar} alt={deal.contact} />
                            <AvatarFallback className="text-xs">{getInitials(deal.contact)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{deal.contact}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {deal.probability}%
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {deal.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dealsByStage[stage.id]?.length === 0 && (
                <div className="h-24 border border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  No deals
                </div>
              )}
              <Button variant="ghost" className="w-full text-xs justify-start" size="sm">
                <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Deal
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 