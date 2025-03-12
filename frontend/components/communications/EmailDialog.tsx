'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, FileText, Sparkles } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { 
  sendEmail, 
  generateEmailWithAI, 
  getEmailTemplates, 
  getReceivedEmails, 
  ReceivedEmail,
  EmailTemplate 
} from '../../lib/services/communicationService';
import RichTextEditor from './RichTextEditor';
import { TemplateSelectionDialog } from './TemplateSelectionDialog';
import { format } from 'date-fns';

// Define the form schema
const emailFormSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Email content is required' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadEmail: string;
  leadName: string;
  onSuccess?: (emailData: { to: string; subject: string; body: string }) => void;
}

export function EmailDialog({ open, onOpenChange, leadEmail, leadName, onSuccess }: EmailDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ReceivedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize the form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: leadEmail,
      subject: `Follow up with ${leadName}`,
      content: `<p>Hello ${leadName},</p><p>I wanted to follow up regarding...</p><p>Best regards,<br>Your Name</p>`,
    },
  });
  
  // Fetch emails when dialog opens
  useEffect(() => {
    if (open) {
      fetchEmails();
    }
  }, [open, leadEmail]);
  
  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const emails = await getReceivedEmails();
      
      // Filter emails for this lead
      const leadReceivedEmails = emails.filter(email => email.from === leadEmail);
      const leadSentEmails = emails.filter(email => email.to === leadEmail);
      
      setReceivedEmails(leadReceivedEmails);
      setSentEmails(leadSentEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Failed to load emails',
        description: 'There was an error loading emails. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
      form.reset({
        to: leadEmail,
        subject: '',
        content: '',
      });
      
      // Refresh emails to show the newly sent email
      fetchEmails();
      
      // Switch to sent tab
      setActiveTab('sent');
      
      // Call the onSuccess callback
      if (onSuccess) {
        onSuccess({
          to: data.to,
          subject: data.subject,
          body: data.content
        });
      }
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
        context: leadName,
        tone: 'professional',
        purpose: 'follow_up',
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
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Handle reply to an email
  const handleReply = (email: ReceivedEmail) => {
    setActiveTab('compose');
    
    const replySubject = email.subject.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject}`;
    
    const replyContent = `
      <p>On ${formatDate(email.received_at)}, ${email.from} wrote:</p>
      <blockquote style="padding-left: 1rem; border-left: 2px solid #ccc; margin-left: 0.5rem;">
        ${email.content}
      </blockquote>
      <p></p>
      <p>Hello,</p>
      <p></p>
      <p>Best regards,<br>Your Name</p>
    `;
    
    form.setValue('subject', replySubject);
    form.setValue('content', replyContent);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden overflow-x-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Communication with {leadName}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="flex-1 overflow-auto">
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
                          className="min-h-[200px]"
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
          </TabsContent>
          
          <TabsContent value="inbox" className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : receivedEmails.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No emails received from this lead yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{email.subject}</h3>
                        <p className="text-sm text-muted-foreground">From: {email.from}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(email.received_at)}
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: email.content }} />
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleReply(email)}>
                        Reply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sent" className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sentEmails.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No emails sent to this lead yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{email.subject}</h3>
                        <p className="text-sm text-muted-foreground">To: {email.to}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(email.received_at)}
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.content }} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <TemplateSelectionDialog 
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          onSelectTemplate={handleSelectTemplate}
        />
      </DialogContent>
    </Dialog>
  );
} 