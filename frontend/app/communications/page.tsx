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
import { Loader2, Send, FileText, Sparkles } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { Toaster } from '../../components/ui/toaster';
import { sendEmail, generateEmailWithAI, getEmailTemplates } from '../../lib/services/emailService';
import Link from 'next/link';
import RichTextEditor from '../../components/communications/RichTextEditor';
import { useSearchParams } from 'next/navigation';
import { TemplateSelectionDialog, EmailTemplate } from '../../components/communications/TemplateSelectionDialog';

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
      try {
        const replyDataString = localStorage.getItem('emailReplyData');
        if (replyDataString) {
          const replyData = JSON.parse(replyDataString);
          
          // Pre-fill the form with reply data
          form.setValue('to', replyData.to || '');
          form.setValue('subject', replyData.subject || '');
          form.setValue('content', replyData.content || '');
          
          // Clear the localStorage after using the data
          localStorage.removeItem('emailReplyData');
          
          // Ensure the compose tab is active
          setActiveTab('compose');
        }
      } catch (error) {
        console.error('Error parsing reply data:', error);
      }
    };
    
    checkForReplyData();
  }, [form]);
  
  // Handle form submission
  const handleSubmit = async (data: EmailFormValues) => {
    setIsSubmitting(true);
    console.log('Sending email:', data);
    
    try {
      // Call the email service to send the email
      const response = await sendEmail({
        to: data.to,
        subject: data.subject,
        content: data.content,
      });
      
      toast({
        title: 'Email sent successfully',
        description: `Your email to ${data.to} has been sent.`,
      });
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Failed to send email',
        description: 'There was an error sending your email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle AI generation
  const handleGenerateWithAI = async () => {
    try {
      const result = await generateEmailWithAI({
        context: 'your product/service',
        tone: 'professional',
        purpose: 'introduction',
      });
      
      // Update the form with the generated content
      form.setValue('subject', result.subject);
      form.setValue('content', result.content);
      
      toast({
        title: 'Email Generated',
        description: 'AI has generated an email for you. Feel free to edit it before sending.',
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: 'Failed to Generate Email',
        description: 'There was an error generating the email. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle template selection
  const handleUseTemplate = async () => {
    setTemplateDialogOpen(true);
  };
  
  const handleSelectTemplate = (template: EmailTemplate) => {
    // Update the form with the template content
    form.setValue('subject', template.subject);
    form.setValue('content', template.content);
    
    toast({
      title: 'Template Applied',
      description: `The "${template.name}" template has been applied. Feel free to edit it before sending.`,
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Communications</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sent">Sent Emails</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose New Email</CardTitle>
              <CardDescription>
                Create and send emails to your leads and contacts
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
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Write your email message here..."
                            className="min-h-[300px]"
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
                        onClick={handleUseTemplate}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Use Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateWithAI}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>
                View and manage your received emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Access your email inbox to view, search, and manage received emails.
                </p>
                <Link href="/communications/inbox">
                  <Button>
                    Open Inbox
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Create and manage reusable email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Manage your email templates to save time and ensure consistency.
                </p>
                <Link href="/communications/templates">
                  <Button>
                    Manage Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Emails</CardTitle>
              <CardDescription>
                View and track your sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Sent emails will be displayed here once you start sending emails.
                </p>
              </div>
            </CardContent>
          </Card>
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