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
import { Search, FileText } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { getEmailTemplates } from '../../lib/services/emailService';
import { Card, CardContent } from '../ui/card';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: EmailTemplate) => void;
}

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateSelectionDialogProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  useEffect(() => {
    if (templates.length > 0) {
      const filtered = templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await getEmailTemplates();
      setTemplates(response);
      setFilteredTemplates(response);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
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
          <DialogTitle>Select Email Template</DialogTitle>
          <DialogDescription>
            Choose a template to use for your email
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Templates list */}
          <div className="overflow-auto max-h-[300px] pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <p>Loading templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex justify-center items-center h-[200px]">
                <p>No templates found</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSelection} disabled={!selectedTemplate}>
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 