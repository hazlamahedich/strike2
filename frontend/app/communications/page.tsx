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
import { Loader2, Send, FileText, Sparkles, Phone, MessageSquare, Mail, Users } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { sendEmail, generateEmailWithAI, getEmailTemplates } from '../../lib/services/emailService';
import Link from 'next/link';
import RichTextEditor from '../../components/communications/RichTextEditor';
import { useSearchParams } from 'next/navigation';
import { TemplateSelectionDialog, EmailTemplate } from '../../components/communications/TemplateSelectionDialog';
import AddressBook, { Contact } from '../../components/communications/AddressBook';
import CallLog from '../../components/communications/CallLog';
import Dialpad from '../../components/communications/Dialpad';
import SMSComposer from '../../components/communications/SMSComposer';
import SMSLog from '../../components/communications/SMSLog';

// Define the form schema
const emailFormSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Email content is required' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function CommunicationsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  
  // Initialize the form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      subject: '',
      content: '',
    },
  });
  
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
      });
      
      toast({
        title: 'Email Sent',
        description: 'Your email has been sent successfully.',
      });
      
      form.reset();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
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
  const handleSelectTemplate = (template: EmailTemplate) => {
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
        name: 'Unknown',
        phone_number: phoneNumber,
        email: '',
        company: '',
        contact_type: 'other',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Communications</h1>
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
            onSMSSent={(to, body) => {
              toast({
                title: 'SMS Sent',
                description: `Message sent to ${to}`,
              });
            }}
          />
        </TabsContent>
        
        <TabsContent value="phone" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dialpad 
              contact={selectedContact || undefined} 
              initialPhoneNumber={selectedContact?.phone_number}
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
      
      <Toaster />
    </div>
  );
} 