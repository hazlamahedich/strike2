import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { Card, CardContent } from '../ui/card';
import { SMSTemplate } from './SMSComposer';

interface SMSTemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SMSTemplate) => void;
}

export function SMSTemplateSelectionDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: SMSTemplateSelectionDialogProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SMSTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const filtered = templates.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call to your backend
      const mockTemplates: SMSTemplate[] = [
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
      
      setTemplates(mockTemplates);
      setFilteredTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to fetch SMS templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS templates. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: SMSTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select SMS Template</DialogTitle>
          <DialogDescription>
            Choose a template to use for your SMS message
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTemplate?.id === template.id ? 'border-primary' : ''
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {template.body}
                      </p>
                      {template.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.variables.map((variable) => (
                            <span 
                              key={variable} 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedTemplate}
          >
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 