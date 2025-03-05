'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLeads } from '../../hooks/useLeads';
import LeadTable from '../../components/leads/LeadTable';
import { LeadKanban } from '../../components/leads/LeadKanban';
import { LeadCreateDialog } from '../../components/leads/LeadCreateDialog';
import { LeadViewDialog } from '../../components/leads/LeadViewDialog';
import { LeadEditDialog } from '../../components/leads/LeadEditDialog';
import { useToast } from '../../components/ui/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { Plus, Filter, Download, Upload, MoreHorizontal, RefreshCcw, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export default function LeadsPage() {
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('table');
  
  // Fetch leads data
  const { leads, isLoading, error, refetch } = useLeads();
  const { toast } = useToast();
  
  // Calculate error state from the error object
  const hasError = !!error;

  // Handler functions
  const handleCreateLead = () => {
    setCreateDialogOpen(true);
  };

  const handleViewLead = (id: string) => {
    setSelectedLeadId(id);
    setViewDialogOpen(true);
  };

  const handleEditLead = (id: string) => {
    setSelectedLeadId(id);
    setEditDialogOpen(true);
  };

  const handleSendEmail = (id: string) => {
    toast({
      title: 'Email Action',
      description: `Sending email to lead ID: ${id}`,
    });
    // Implementation for sending email
  };

  const handleScheduleMeeting = (id: string) => {
    toast({
      title: 'Schedule Meeting',
      description: `Scheduling a meeting with lead ID: ${id}`,
    });
    // Implementation for scheduling a meeting
  };

  const handleCallLead = (id: string) => {
    toast({
      title: 'Call Lead',
      description: `Calling lead ID: ${id}`,
    });
    // Implementation for calling a lead
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshed',
      description: 'Lead data has been refreshed',
    });
  };

  const handleImportLeads = () => {
    toast({
      title: 'Import Leads',
      description: 'Opening lead import interface',
    });
    // Implementation for importing leads
  };

  const handleExportLeads = () => {
    toast({
      title: 'Export Leads',
      description: 'Exporting lead data',
    });
    // Implementation for exporting leads
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refetch();
    toast({
      title: 'Lead Created',
      description: 'New lead has been successfully created',
    });
  };

  const handleUpdateSuccess = () => {
    setEditDialogOpen(false);
    refetch();
    toast({
      title: 'Lead Updated',
      description: 'Lead has been successfully updated',
    });
  };

  // Render content based on loading/error state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading leads data...</p>
        </div>
      );
    }

    if (hasError) {
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Error Loading Leads</CardTitle>
            <CardDescription>
              We encountered an issue while loading your leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error?.message || 'Unknown error occurred'}</p>
            <Button onClick={handleRefresh} variant="outline" className="mt-4">
              <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" /> More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleImportLeads}>
                  <Upload className="h-4 w-4 mr-2" /> Import Leads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportLeads}>
                  <Download className="h-4 w-4 mr-2" /> Export Leads
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" /> Lead Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={handleCreateLead} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Lead
            </Button>
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          <LeadTable
            leads={leads || []}
            onViewLead={handleViewLead}
            onEditLead={handleEditLead}
            onSendEmail={handleSendEmail}
            onScheduleMeeting={handleScheduleMeeting}
            onCallLead={handleCallLead}
          />
        </TabsContent>
        
        <TabsContent value="kanban" className="mt-0">
          <LeadKanban
            leads={leads || []}
            onViewLead={handleViewLead}
            onEditLead={handleEditLead}
            onSendEmail={handleSendEmail}
            onScheduleMeeting={handleScheduleMeeting}
            onCallLead={handleCallLead}
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
      </div>
      
      {renderContent()}
      
      {/* Dialogs */}
      <LeadCreateDialog 
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      
      {selectedLeadId && (
        <>
          <LeadViewDialog
            leadId={selectedLeadId}
            isOpen={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            onEdit={handleEditLead}
            onSendEmail={handleSendEmail}
            onScheduleMeeting={handleScheduleMeeting}
            onCallLead={handleCallLead}
          />
          
          <LeadEditDialog
            leadId={selectedLeadId}
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onSuccess={handleUpdateSuccess}
          />
        </>
      )}
      
      <Toaster />
    </div>
  );
} 