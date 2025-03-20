'use client';

import React, { useState, useEffect } from 'react';
import { MeetingDialogContent } from '../ui/meeting-dialog';
import { MeetingDialogType } from '@/contexts/MeetingDialogContext';
import { useToast } from '../ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, FileText, Sparkles, Paperclip, X, Mail, Inbox, Share, Minimize } from 'lucide-react';
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
import { useEmailDialog } from '@/contexts/EmailDialogContext';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';

// Define the form schema
const emailFormSchema = z.object({
  to: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Email content is required' }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface ContextualEmailDialogProps {
  dialogId: string;
  leadEmail?: string;
  leadName: string;
  handleClose: () => void;
  onSuccess?: (emailData: { to: string; subject: string; body: string }) => void;
}

export function ContextualEmailDialog({ 
  dialogId,
  leadEmail, 
  leadName, 
  handleClose,
  onSuccess
}: ContextualEmailDialogProps) {
  console.log("⭐⭐⭐ CONTEXTUAL EMAIL DIALOG - Rendering for", leadName);
  
  const { toast } = useToast();
  const { minimizeDialog, updateDialogPosition } = useEmailDialog();
  const [activeTab, setActiveTab] = useState('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ReceivedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Initialize the form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: leadEmail || '',
      subject: `Follow up with ${leadName}`,
      content: `<p>Hello ${leadName},</p><p>I wanted to follow up regarding...</p><p>Best regards,<br>Your Name</p>`,
    },
  });
  
  // Fetch emails when dialog is mounted
  useEffect(() => {
    fetchEmails();
  }, [leadEmail]);
  
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
      // Process attachments if any
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          return new Promise<{
            filename: string;
            content: string;
            content_type: string;
            size: number;
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64content = reader.result as string;
              // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
              const base64Data = base64content.split(',')[1];
              resolve({
                filename: file.name,
                content: base64Data,
                content_type: file.type,
                size: file.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );
      
      // Call the email service to send the email
      const response = await sendEmail({
        to: data.to,
        subject: data.subject,
        content: data.content,
        attachments: processedAttachments,
      });
      
      toast({
        title: 'Email sent successfully',
        description: `Your email to ${data.to} has been sent.`,
      });
      
      // Reset the form and attachments
      form.reset({
        to: leadEmail || '',
        subject: '',
        content: '',
      });
      setAttachments([]);
      
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
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to attachments
      const newFiles = Array.from(e.target.files);
      
      // Check file sizes (SendGrid limit is 30MB total, but we'll limit individual files to 10MB)
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: 'File size exceeded',
          description: `${oversizedFiles.length > 1 ? 'Some files are' : 'One file is'} larger than 10MB and cannot be attached.`,
          variant: 'destructive',
        });
        
        // Filter out oversized files
        const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length > 0) {
          setAttachments([...attachments, ...validFiles]);
          
          // Show success toast for valid files
          toast({
            title: 'Files attached',
            description: `${validFiles.length} ${validFiles.length === 1 ? 'file' : 'files'} attached successfully.`,
          });
        }
      } else {
        // All files are valid
        setAttachments([...attachments, ...newFiles]);
        
        // Show success toast
        toast({
          title: 'Files attached',
          description: `${newFiles.length} ${newFiles.length === 1 ? 'file' : 'files'} attached successfully: ${newFiles.map(f => f.name).join(', ')}`,
        });
      }
      
      // Clear the input value so the same file can be selected again
      e.target.value = '';
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newAttachments = [...attachments];
    const removedFile = newAttachments[index];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    // Show toast for removed file
    toast({
      title: 'File removed',
      description: `Removed ${removedFile.name}`,
    });
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Handle minimize dialog
  const handleMinimize = () => {
    console.log("⭐⭐⭐ CONTEXTUAL EMAIL DIALOG - Minimizing dialog", dialogId);
    minimizeDialog(dialogId, true);
  };

  // Update position when dialog is dragged
  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    console.log("⭐⭐⭐ CONTEXTUAL EMAIL DIALOG - Updating position", d.x, d.y);
    // The position is already absolute, no need to invert it
    updateDialogPosition(dialogId, { x: d.x, y: d.y });
  };
  
  return (
    <MeetingDialogContent
      dialogId={dialogId}
      dialogType={MeetingDialogType.EMAIL}
      title={`Email ${leadName}`}
      onClose={handleClose}
      headerClassName="drag-handle"
      actionButtons={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMinimize}
          className="h-8 w-8 rounded-full"
          aria-label="Minimize"
        >
          <Minimize className="h-4 w-4" />
        </Button>
      }
    >
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <Share className="mr-2 h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose" className="pt-4">
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
                
                {/* File Attachments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Attachments</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {attachments.length > 0 
                        ? attachments.length === 1 
                          ? `1 file attached: ${attachments[0].name}` 
                          : `${attachments.length} files attached: ${attachments.map(file => file.name).join(', ')}`
                        : 'No files attached'
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach Files
                    </label>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="border rounded-md p-2 space-y-2 max-h-[150px] overflow-y-auto">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-accent/50 rounded-md p-2">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
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
          
          <TabsContent value="inbox" className="flex-1 overflow-auto pt-4">
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
          
          <TabsContent value="sent" className="flex-1 overflow-auto pt-4">
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
      </div>
      
      <TemplateSelectionDialog 
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </MeetingDialogContent>
  );
} 