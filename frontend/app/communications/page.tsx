'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, FileText, Sparkles, Phone, MessageSquare, Mail, Users, UserPlus } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { 
  sendEmail, 
  generateEmailWithAI, 
  getEmailTemplates, 
  EmailTemplate as EmailTemplateType,
  Contact
} from '../../lib/services/communicationService';
import Link from 'next/link';
import RichTextEditor from '../../components/communications/RichTextEditor';
import { useSearchParams } from 'next/navigation';
import { TemplateSelectionDialog } from '../../components/communications/TemplateSelectionDialog';
import AddressBook from '../../components/communications/AddressBook';
import CallLog from '../../components/communications/CallLog';
import Dialpad from '../../components/communications/Dialpad';
import SMSComposer from '../../components/communications/SMSComposer';
import SMSLog from '../../components/communications/SMSLog';
import { USE_MOCK_DATA } from '@/lib/config';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import supabase from '@/lib/supabase/client';

// Define the form schema
const emailFormSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Email content is required' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

// Define the Lead type
interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  
  // Initialize the form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      subject: '',
      content: '',
    },
  });
  
  // Fetch leads when component mounts
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoadingLeads(true);
      try {
        if (USE_MOCK_DATA) {
          // Mock leads data
          const mockLeads: Lead[] = [
            { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '+1234567890', company: 'Acme Inc' },
            { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+0987654321', company: 'XYZ Corp' },
            { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', phone: '+1122334455', company: 'ABC Ltd' },
          ];
          setLeads(mockLeads);
        } else {
          // Fetch leads from Supabase
          const { data, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, company')
            .order('name', { ascending: true });
          
          if (error) throw error;
          setLeads(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leads. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingLeads(false);
      }
    };
    
    fetchLeads();
  }, [toast]);
  
  // Check for reply data in localStorage when component mounts
  useEffect(() => {
    const checkForReplyData = () => {
      const replyData = localStorage.getItem('replyEmailData');
      if (replyData) {
        try {
          const parsedData = JSON.parse(replyData);
          form.setValue('to', parsedData.to || '');
          form.setValue('subject', parsedData.subject || '');
          form.setValue('content', parsedData.content || '');
          
          // Clear the stored data
          localStorage.removeItem('replyEmailData');
          
          // Switch to compose tab
          setActiveTab('compose');
        } catch (error) {
          console.error('Failed to parse reply data:', error);
        }
      }
    };
    
    checkForReplyData();
  }, [form]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle email form submission
  const handleSubmit = async (data: EmailFormValues) => {
    try {
      setIsSubmitting(true);
      
      const result = await sendEmail({
        to: data.to,
        subject: data.subject,
        content: data.content,
        lead_id: selectedLead?.id, // Pass lead_id if a lead is selected
      });
      
      if (result.success) {
        toast({
          title: 'Email Sent',
          description: selectedLead 
            ? `Email sent to ${data.to} and recorded for lead ${selectedLead.name}`
            : 'Your email has been sent successfully.',
        });
        
        form.reset();
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle AI generation
  const handleGenerateWithAI = async () => {
    const prompt = window.prompt('What kind of email would you like to generate?');
    if (!prompt) return;
    
    try {
      const generatedEmail = await generateEmailWithAI({
        context: prompt,
        tone: 'professional'
      });
      
      if (generatedEmail) {
        form.setValue('subject', generatedEmail.subject);
        form.setValue('content', generatedEmail.content);
        
        toast({
          title: 'Email Generated',
          description: 'AI has generated an email based on your prompt.',
        });
      }
    } catch (error) {
      console.error('Failed to generate email with AI:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate email with AI. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle template selection
  const handleUseTemplate = async () => {
    setTemplateDialogOpen(true);
  };
  
  // Handle template selection
  const handleSelectTemplate = (template: EmailTemplateType) => {
    form.setValue('subject', template.subject);
    form.setValue('content', template.content);
    setTemplateDialogOpen(false);
  };

  // Handle contact selection for calling or messaging
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDialpadOpen(true);
  };

  // Handle initiating a call
  const handleCall = (phoneNumber: string) => {
    setIsDialpadOpen(true);
  };

  // Handle selecting a lead
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDialogOpen(false);
    
    // If we're in the compose tab, update the email form with the lead's email
    if (activeTab === 'compose') {
      form.setValue('to', lead.email);
    }
    
    // If we're in the SMS tab, update the selected contact
    if (activeTab === 'sms' && selectedContact) {
      setSelectedContact({
        ...selectedContact,
        phone_number: lead.phone,
        email: lead.email,
        name: lead.name,
      });
    }
    
    toast({
      title: 'Lead Selected',
      description: `Communications will be associated with ${lead.name}`,
    });
  };

  const handleSMSContact = (phoneNumber: string) => {
    // Set the active tab to SMS
    setActiveTab('sms');
    
    // If we have a contact with this phone number, select it
    if (selectedContact && selectedContact.phone_number === phoneNumber) {
      // Contact already selected
    } else {
      // Create a temporary contact with just the phone number
      setSelectedContact({
        id: 0,
        name: selectedLead?.name || 'Unknown',
        phone_number: phoneNumber,
        email: selectedLead?.email || '',
        company: selectedLead?.company || '',
        contact_type: 'other',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communications {USE_MOCK_DATA ? '(Mock Mode)' : ''}</h1>
        <div className="flex space-x-2">
          <Link href="/communications/inbox">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Inbox
            </Button>
          </Link>
          <Link href="/communications/templates">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Templates
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Lead selection */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          {selectedLead ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Selected Lead:</span>
              <Badge className="bg-primary">{selectedLead.name}</Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedLead(null)}
              >
                Clear
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No lead selected. Communications will not be tracked in lead timeline.</span>
          )}
        </div>
        <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              {selectedLead ? 'Change Lead' : 'Select Lead'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a Lead</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Search leads..."
                className="mb-4"
                onChange={(e) => {
                  // Implement lead search functionality here
                }}
              />
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {isLoadingLeads ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No leads found
                  </div>
                ) : (
                  leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleSelectLead(lead)}
                    >
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.email} • {lead.phone}
                      </div>
                      {lead.company && (
                        <div className="text-sm text-muted-foreground">
                          {lead.company}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="compose">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="phone">
            <Phone className="h-4 w-4 mr-2" />
            Phone
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="call-log">
            <FileText className="h-4 w-4 mr-2" />
            Call Log
          </TabsTrigger>
          <TabsTrigger value="sms-log">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>
                Create and send emails to your contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <div className="flex justify-end space-x-2 mb-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleUseTemplate}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Templates
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleGenerateWithAI}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Assist
                          </Button>
                        </div>
                        <FormControl>
                          <RichTextEditor 
                            content={field.value} 
                            onChange={field.onChange} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Email
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sms" className="mt-6">
          <SMSComposer 
            contact={selectedContact || undefined} 
            lead_id={selectedLead?.id}
            onSMSSent={(to, body) => {
              toast({
                title: 'SMS Sent',
                description: selectedLead 
                  ? `Message sent to ${to} and recorded for lead ${selectedLead.name}`
                  : `Message sent to ${to}`,
              });
            }}
          />
        </TabsContent>
        
        <TabsContent value="phone" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dialpad 
              contact={selectedContact || undefined} 
              initialPhoneNumber={selectedContact?.phone_number}
              lead_id={selectedLead?.id}
              onCallComplete={(callSid, duration) => {
                toast({
                  title: 'Call Completed',
                  description: selectedLead 
                    ? `Call completed and recorded for lead ${selectedLead.name}`
                    : `Call completed (${duration} seconds)`,
                });
              }}
            />
            <Card>
              <CardHeader>
                <CardTitle>Recent Contacts</CardTitle>
                <CardDescription>
                  Quick access to your recent contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be populated with actual recent contacts */}
                  <p className="text-sm text-gray-500">
                    Select a contact from the Contacts tab to call them.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="mt-6">
          <AddressBook onSelectContact={handleContactSelect} />
        </TabsContent>
        
        <TabsContent value="call-log" className="mt-6">
          <CallLog onCallContact={handleCall} />
        </TabsContent>
        
        <TabsContent value="sms-log" className="mt-6">
          <SMSLog 
            onSMSContact={handleSMSContact} 
            onCallContact={handleCall}
            onEmailContact={(email, name) => {
              // Create a temporary contact with the email and name
              const contact: Contact = {
                id: 0,
                name: name,
                email: email,
                phone_number: '',
                contact_type: 'other',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              handleContactSelect(contact);
            }}
          />
        </TabsContent>
      </Tabs>
      
      <TemplateSelectionDialog 
        open={templateDialogOpen} 
        onOpenChange={setTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
} 