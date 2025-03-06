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
import { Contact } from './AddressBook';
import { SMSTemplateSelectionDialog } from './SMSTemplateSelectionDialog';

// Define the SMS template type
export interface SMSTemplate {
  id: number;
  name: string;
  body: string;
  created_by: number;
  team_id?: number;
  is_global: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

// Define the form schema
const smsFormSchema = z.object({
  to: z.string().min(1, { message: 'Phone number is required' }),
  body: z.string().min(1, { message: 'Message content is required' }).max(1600, { message: 'Message is too long (max 1600 characters)' }),
});

type SMSFormValues = z.infer<typeof smsFormSchema>;

// Mock API functions (replace with actual API calls)
const sendSMS = async (to: string, body: string): Promise<{ success: boolean; message_id: string }> => {
  // In a real app, this would be an API call to your backend
  console.log(`Sending SMS to ${to}: ${body}`);
  return { success: true, message_id: `SM${Math.random().toString(36).substring(2, 15)}` };
};

const generateSMSWithAI = async (prompt: string): Promise<string> => {
  // In a real app, this would be an API call to your backend
  console.log(`Generating SMS with AI: ${prompt}`);
  return `This is an AI-generated SMS based on your prompt: "${prompt}". We're excited to help you with your inquiry. Please let us know if you need any further assistance.`;
};

const fetchSMSTemplates = async (): Promise<SMSTemplate[]> => {
  // In a real app, this would be an API call to your backend
  return [
    {
      id: 1,
      name: 'Appointment Reminder',
      body: 'Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}. Please reply YES to confirm or call us to reschedule.',
      created_by: 1,
      is_global: true,
      variables: ['name', 'date', 'time'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Follow-up',
      body: 'Hi {{name}}, thank you for your interest in our services. I wanted to follow up on our conversation. Please let me know if you have any questions.',
      created_by: 1,
      is_global: true,
      variables: ['name'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Payment Confirmation',
      body: 'Thank you for your payment of {{amount}}. Your transaction has been processed successfully. Reference: {{reference}}',
      created_by: 1,
      is_global: true,
      variables: ['amount', 'reference'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

interface SMSComposerProps {
  contact?: Contact;
  onSMSSent?: (to: string, body: string) => void;
}

export default function SMSComposer({ contact, onSMSSent }: SMSComposerProps) {
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
        const data = await fetchSMSTemplates();
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
      const result = await sendSMS(data.to, data.body);
      
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
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS. Please try again.',
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
        <CardTitle>Compose SMS</CardTitle>
        <CardDescription>
          Create and send SMS messages to your contacts
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
                    <Input placeholder="+1 (555) 123-4567" {...field} />
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
                  <div className="flex space-x-2 mb-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsTemplateDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Use Template
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
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-2">
                    {field.value.length} / 1600 characters
                  </p>
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
                Send SMS
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Template Selection Dialog */}
      <SMSTemplateSelectionDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Template Variables Dialog */}
      <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fill Template Variables</DialogTitle>
            <DialogDescription>
              Please fill in the variables for the template
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
                    setTemplateVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }));
                  }}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVariableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedTemplate) return;
                
                let messageBody = selectedTemplate.body;
                
                // Replace variables in the template
                Object.entries(templateVariables).forEach(([variable, value]) => {
                  messageBody = messageBody.replace(new RegExp(`{{${variable}}}`, 'g'), value || `[${variable}]`);
                });
                
                form.setValue('body', messageBody);
                setIsVariableDialogOpen(false);
              }}
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 