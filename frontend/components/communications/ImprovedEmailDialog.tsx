'use client';

import React, { useState, useEffect } from 'react';
import {
  ImprovedDialogContent,
  ImprovedDialogHeader,
  ImprovedDialogFooter,
} from '../ui/improved-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, FileText, Sparkles, Paperclip, X } from 'lucide-react';
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
import { useImprovedDialog } from '@/lib/contexts/ImprovedDialogContext';

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

export function ImprovedEmailDialog({ open, onOpenChange, leadEmail, leadName, onSuccess }: EmailDialogProps) {
  const { toast } = useToast();
  const { openDialog, closeDialog } = useImprovedDialog();
  const dialogId = `email-dialog-${leadEmail}`;
  
  const [activeTab, setActiveTab] = useState('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ReceivedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  
  // Create form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: leadEmail,
      subject: '',
      content: '',
    },
  });
  
  // Effect to fetch emails when the dialog opens
  useEffect(() => {
    if (open) {
      fetchEmails();
      
      // Create and open the dialog
      renderEmailDialog();
    } else {
      closeDialog(dialogId);
    }
  }, [open, activeTab, leadEmail]);
  
  const renderEmailDialog = () => {
    openDialog(
      dialogId,
      <ImprovedDialogContent dialogId={dialogId} className="sm:max-w-3xl">
        <ImprovedDialogHeader>
          <h2 className="text-lg font-semibold">Email Communication</h2>
          <p className="text-sm text-muted-foreground">
            Send and view emails for {leadName}
          </p>
        </ImprovedDialogHeader>
        
        <Tabs defaultValue="compose" value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
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
                        <Input {...field} disabled={isSubmitting} />
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
                      <FormLabel>Email Content</FormLabel>
                      <FormControl>
                        <RichTextEditor 
                          value={field.value} 
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* File attachment section */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label 
                      htmlFor="file-upload" 
                      className="flex items-center space-x-2 text-sm py-1 px-2 border border-input rounded-md cursor-pointer hover:bg-accent"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>Attach Files</span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="border rounded-md p-2">
                      <h4 className="text-sm font-medium mb-2">Attachments ({selectedFiles.length})</h4>
                      <ul className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGenerateWithAI}
                    disabled={isSubmitting || isGeneratingWithAI}
                  >
                    {isGeneratingWithAI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleUseTemplate}
                    disabled={isSubmitting}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="received" className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : receivedEmails.length > 0 ? (
              <div className="space-y-4">
                {receivedEmails.map((email) => (
                  <div key={email.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{email.subject}</h3>
                        <p className="text-sm text-muted-foreground">From: {email.from}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(email.received_at)}</p>
                    </div>
                    <div className="text-sm mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.body }} />
                    <Button size="sm" onClick={() => handleReply(email)}>Reply</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No emails received from this contact.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sent" className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sentEmails.length > 0 ? (
              <div className="space-y-4">
                {sentEmails.map((email) => (
                  <div key={email.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{email.subject}</h3>
                        <p className="text-sm text-muted-foreground">To: {email.to}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(email.sent_at || email.received_at)}</p>
                    </div>
                    <div className="text-sm mb-3 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.body }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No emails sent to this contact.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <ImprovedDialogFooter>
          <Button variant="outline" onClick={() => {
            closeDialog(dialogId);
            onOpenChange(false);
          }}>
            Close
          </Button>
        </ImprovedDialogFooter>
      </ImprovedDialogContent>
    );
  };
  
  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      // In a real app, these would be API calls with the lead's email as a parameter
      // For now, we'll use mock data
      const received = await getReceivedEmails(leadEmail);
      const sent = await getReceivedEmails(leadEmail, true);
      
      setReceivedEmails(received);
      setSentEmails(sent);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: 'Error fetching emails',
        description: 'Could not load email history. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (data: EmailFormValues) => {
    setIsSubmitting(true);
    try {
      // Create form data if there are file attachments
      const formData = new FormData();
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      formData.append('content', data.content);
      
      // Add files if any
      selectedFiles.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      
      // Send the email
      await sendEmail(formData);
      
      toast({
        title: 'Email sent',
        description: `Your email to ${data.to} has been sent successfully.`,
      });
      
      // Reset form
      form.reset({
        to: leadEmail,
        subject: '',
        content: '',
      });
      
      // Clear selected files
      setSelectedFiles([]);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess({
          to: data.to,
          subject: data.subject,
          body: data.content,
        });
      }
      
      // Refresh emails list
      fetchEmails();
      
      // Switch to sent tab
      setActiveTab('sent');
      
      // Close the dialog
      closeDialog(dialogId);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error sending email',
        description: 'Could not send the email. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGenerateWithAI = async () => {
    setIsGeneratingWithAI(true);
    try {
      const result = await generateEmailWithAI(leadName, leadEmail);
      
      if (result) {
        form.setValue('subject', result.subject);
        form.setValue('content', result.content);
      }
    } catch (error) {
      console.error('Error generating email with AI:', error);
      toast({
        title: 'Error generating email',
        description: 'Could not generate email with AI. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };
  
  const handleUseTemplate = async () => {
    setTemplateDialogOpen(true);
  };
  
  const handleSelectTemplate = (template: EmailTemplate) => {
    form.setValue('subject', template.subject);
    form.setValue('content', template.content);
    setTemplateDialogOpen(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  const handleReply = (email: ReceivedEmail) => {
    setActiveTab('compose');
    
    const replySubject = email.subject.startsWith('Re:') 
      ? email.subject 
      : `Re: ${email.subject}`;
    
    const replyContent = `
      <p>On ${formatDate(email.received_at)}, ${email.from} wrote:</p>
      <blockquote>
        ${email.body}
      </blockquote>
      <p><br></p>
      <p>Dear ${email.from_name || 'Sir/Madam'},</p>
      <p><br></p>
      <p>Best regards,</p>
      <p>Your Name</p>
    `;
    
    form.setValue('subject', replySubject);
    form.setValue('content', replyContent);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Check file size limit (10MB per file)
      const oversizedFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: 'Files too large',
          description: `Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: 'destructive',
        });
        
        // Filter out oversized files
        const validFiles = filesArray.filter(file => file.size <= 10 * 1024 * 1024);
        setSelectedFiles(prev => [...prev, ...validFiles]);
        return;
      }
      
      // Check total attachment limit (20MB)
      const currentSize = selectedFiles.reduce((total, file) => total + file.size, 0);
      const newFilesSize = filesArray.reduce((total, file) => total + file.size, 0);
      
      if (currentSize + newFilesSize > 20 * 1024 * 1024) {
        toast({
          title: 'Attachment limit exceeded',
          description: 'Total attachments cannot exceed 20MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // The actual rendering is handled by ImprovedDialogContainer
  return (
    <>
      {templateDialogOpen && (
        <TemplateSelectionDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          onSelect={handleSelectTemplate}
        />
      )}
    </>
  );
}

export default ImprovedEmailDialog; 