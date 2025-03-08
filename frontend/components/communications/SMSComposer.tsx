import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SMSTemplateSelectionDialog } from './SMSTemplateSelectionDialog';
import { 
  sendSMS, 
  generateSMSWithAI, 
  getSMSTemplates, 
  SMSTemplate,
  Contact
} from '@/lib/services/communicationService';
import { USE_MOCK_DATA } from '@/lib/config';

// Define the form schema
const smsFormSchema = z.object({
  to: z.string().min(1, { message: 'Phone number is required' }),
  body: z.string().min(1, { message: 'Message content is required' }).max(1600, { message: 'Message is too long (max 1600 characters)' }),
});

type SMSFormValues = z.infer<typeof smsFormSchema>;

interface SMSComposerProps {
  contact?: Contact;
  onSMSSent?: (to: string, body: string) => void;
  lead_id?: number;
}

export default function SMSComposer({ contact, onSMSSent, lead_id }: SMSComposerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<SMSFormValues>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: {
      to: contact?.phone_number || '',
      body: '',
    },
  });

  // Update recipient when contact changes
  useEffect(() => {
    if (contact) {
      form.setValue('to', contact.phone_number);
    }
  }, [contact, form]);

  // Fetch templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getSMSTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to fetch SMS templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load SMS templates. Please try again.',
          variant: 'destructive'
        });
      }
    };

    loadTemplates();
  }, [toast]);

  // Handle form submission
  const handleSubmit = async (data: SMSFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await sendSMS({
        to: data.to,
        body: data.body,
        lead_id: lead_id
      });
      
      if (result.success) {
        toast({
          title: 'SMS Sent',
          description: 'Your message has been sent successfully.',
        });
        
        form.reset();
        
        if (onSMSSent) {
          onSMSSent(data.to, data.body);
        }
      } else {
        throw new Error(result.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send SMS. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize template variables
    const variables: Record<string, string> = {};
    template.variables.forEach(variable => {
      variables[variable] = '';
    });
    setTemplateVariables(variables);
    
    // If the template has variables, open the variable dialog
    if (template.variables.length > 0) {
      setIsVariableDialogOpen(true);
    } else {
      // If no variables, apply the template directly
      form.setValue('body', template.body);
    }
  };

  // Handle AI generation
  const handleGenerateWithAI = async () => {
    const prompt = window.prompt('What kind of message would you like to generate?');
    if (!prompt) return;
    
    try {
      setIsGeneratingAI(true);
      const generatedText = await generateSMSWithAI(prompt);
      form.setValue('body', generatedText);
      toast({
        title: 'AI Message Generated',
        description: 'Your message has been generated with AI.',
      });
    } catch (error) {
      console.error('Failed to generate SMS with AI:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate SMS with AI. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Calculate remaining characters
  const bodyValue = form.watch('body');
  const remainingChars = 1600 - (bodyValue?.length || 0);
  const messageCount = Math.ceil((bodyValue?.length || 0) / 160);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send SMS {USE_MOCK_DATA ? '(Mock Mode)' : ''}</CardTitle>
        <CardDescription>
          Send text messages to your contacts
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
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <div className="flex justify-end space-x-2 mb-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsTemplateDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Templates
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateWithAI}
                      disabled={isGeneratingAI}
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      AI Assist
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Type your message here..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{remainingChars} characters remaining</span>
                    <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                  </div>
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
                Send Message
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      {/* Template Selection Dialog */}
      <SMSTemplateSelectionDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
        onSelectTemplate={handleSelectTemplate}
      />
      
      {/* Template Variables Dialog */}
      <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fill Template Variables</DialogTitle>
            <DialogDescription>
              Please fill in the variables for this template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTemplate && Object.keys(templateVariables).map((variable) => (
              <div key={variable} className="space-y-2">
                <Label htmlFor={variable}>{variable}</Label>
                <Input
                  id={variable}
                  value={templateVariables[variable]}
                  onChange={(e) => {
                    setTemplateVariables({
                      ...templateVariables,
                      [variable]: e.target.value,
                    });
                  }}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedTemplate) {
                let templateText = selectedTemplate.body;
                
                // Replace variables in the template
                Object.entries(templateVariables).forEach(([key, value]) => {
                  templateText = templateText.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
                });
                
                form.setValue('body', templateText);
                setIsVariableDialogOpen(false);
              }
            }}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 