'use client';

import React, { useState, useEffect } from 'react';
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
import { Plus, Filter, Download, Upload, MoreHorizontal, RefreshCcw, Settings, FileText, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { Loader2, Send } from 'lucide-react';

export default function LeadsPage() {
  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('table');
  const [emailFormData, setEmailFormData] = useState({
    to: '',
    subject: '',
    content: '',
  });
  
  // Fetch leads data
  const { leads, isLoading, error, refetch } = useLeads();
  const { toast } = useToast();
  
  // Calculate error state from the error object
  const hasError = !!error;

  // Email form schema
  const emailFormSchema = z.object({
    to: z.string().email({ message: 'Please enter a valid email address' }),
    subject: z.string().min(1, { message: 'Subject is required' }),
    content: z.string().min(1, { message: 'Email content is required' }),
  });
  
  type EmailFormValues = z.infer<typeof emailFormSchema>;
  
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: emailFormData,
  });
  
  // Update email form when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      setEmailFormData({
        to: selectedLead.email || '',
        subject: '',
        content: '',
      });
      emailForm.reset({
        to: selectedLead.email || '',
        subject: '',
        content: '',
      });
    }
  }, [selectedLead, emailForm]);
  
  // Log state changes for email dialog
  useEffect(() => {
    console.log('🔍 emailDialogOpen state changed:', emailDialogOpen);
    console.log('🔍 selectedLead state:', selectedLead);
  }, [emailDialogOpen, selectedLead]);

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
    console.log('🔍 handleSendEmail called with id:', id);
    try {
      if (leads) {
        console.log('🔍 Leads available:', leads.length);
        const lead = leads.find(lead => lead.id.toString() === id);
        console.log('🔍 Found lead:', lead);
        if (lead) {
          console.log('🔍 Setting selectedLead and opening dialog');
          setSelectedLead(lead);
          setEmailDialogOpen(true);
          console.log('🔍 Email dialog should be open now, emailDialogOpen:', true);
        } else {
          console.log('🔍 Lead not found for id:', id);
          toast({
            title: 'Error',
            description: 'Lead not found',
            variant: 'destructive',
          });
        }
      } else {
        console.log('🔍 No leads available');
      }
    } catch (error) {
      console.error('🔍 Error in handleSendEmail:', error);
    }
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

  const handleEmailSubmit = async (data: EmailFormValues) => {
    console.log('Sending email:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Email sent',
      description: `Email sent to ${data.to}`,
    });
    
    setEmailDialogOpen(false);
    setSelectedLead(null);
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
        
        <div className="space-x-2">
          {/* Test button for simple dialog */}
          <Button 
            onClick={() => {
              console.log('🔍 Simple dialog test button clicked');
              setTestDialogOpen(true);
            }}
            variant="outline"
          >
            Test Simple Dialog
          </Button>
          
          {/* Test button for email dialog */}
          <Button 
            onClick={() => {
              console.log('🔍 Test button clicked');
              if (leads && leads.length > 0) {
                const firstLead = leads[0];
                console.log('🔍 Setting selectedLead to first lead:', firstLead);
                setSelectedLead(firstLead);
                setEmailDialogOpen(true);
              } else {
                console.log('🔍 No leads available for test');
                toast({
                  title: 'No Leads Available',
                  description: 'Cannot open email dialog without leads.',
                  variant: 'destructive',
                });
              }
            }}
          >
            Test Email Dialog
          </Button>
        </div>
      </div>
      
      {renderContent()}
      
      {/* Simple test dialog */}
      <Dialog 
        open={testDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔍 Simple dialog onOpenChange called with value:', open);
          setTestDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simple Test Dialog</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>This is a simple test dialog to verify that dialogs work correctly.</p>
            <Button 
              className="mt-4"
              onClick={() => setTestDialogOpen(false)}
            >
              Close Dialog
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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
      
      {/* Email Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onOpenChange={(open) => {
          console.log('🔍 Email Dialog onOpenChange called with value:', open);
          if (!open) {
            setEmailDialogOpen(false);
            setSelectedLead(null);
          } else {
            setEmailDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLead ? `Send Email to ${selectedLead.first_name} ${selectedLead.last_name}` : 'Send Email'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead ? (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="recipient@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Email subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <textarea
                          className="w-full min-h-[200px] p-2 border rounded-md"
                          placeholder="Write your email message here..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: 'Template Feature',
                          description: 'Email templates will be implemented soon.',
                        });
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: 'AI Feature',
                          description: 'AI email generation will be implemented soon.',
                        });
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Reply with AI
                    </Button>
                  </div>
                  <Button type="submit" disabled={emailForm.formState.isSubmitting}>
                    {emailForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="p-4 text-center">
              <p>No lead selected. Please select a lead to send an email.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
} 