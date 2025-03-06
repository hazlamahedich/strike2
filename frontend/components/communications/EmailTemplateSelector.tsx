import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Search, Plus } from 'lucide-react';
import { EmailTemplate } from '../../types/email';
import { useToast } from '../ui/use-toast';

// Placeholder component for EmailTemplateForm
const EmailTemplateForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = {} 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
  initialData?: Partial<any>;
}) => {
  if (!isOpen) return null;
  
  const handleSave = () => {
    // Create a sample template
    const template: EmailTemplate = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'Sample Template',
      subject: 'Sample Subject',
      content: '<p>This is a sample template content.</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
    };
    
    onSave(template);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Email Template</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center">
          <p className="mb-4">Email template form will be implemented here.</p>
          <Button onClick={handleSave}>Save Sample Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EmailTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: { subject: string; content: string }) => void;
}

const EmailTemplateSelector: React.FC<EmailTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock templates for demonstration
  const mockTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Initial Contact',
      subject: 'Introduction from [Your Company]',
      content: '<p>Dear [First Name],</p><p>I hope this email finds you well. I am reaching out from [Your Company] to introduce our services that might be of interest to you.</p><p>Would you be available for a quick call to discuss how we might be able to help [Company Name]?</p><p>Best regards,<br>[Your Name]</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
    },
    {
      id: '2',
      name: 'Follow-up',
      subject: 'Following up on our conversation',
      content: '<p>Dear [First Name],</p><p>I wanted to follow up on our previous conversation about [Topic]. Have you had a chance to consider the proposal I sent over?</p><p>I\'m happy to answer any questions you might have.</p><p>Best regards,<br>[Your Name]</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
    },
    {
      id: '3',
      name: 'Meeting Request',
      subject: 'Request for a meeting',
      content: '<p>Dear [First Name],</p><p>I would like to schedule a meeting to discuss [Topic]. Would you be available next week for a 30-minute call?</p><p>Please let me know what times work best for you.</p><p>Best regards,<br>[Your Name]</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
    },
  ];

  useEffect(() => {
    // Simulate API call to fetch templates
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch from your API
        await new Promise(resolve => setTimeout(resolve, 500));
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast({
          title: 'Failed to load templates',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, toast]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTemplate = (template: EmailTemplate) => {
    setTemplates([...templates, template]);
    setShowCreateForm(false);
    toast({
      title: 'Template created',
      description: 'Your email template has been created successfully',
    });
  };

  return (
    <>
      <Dialog open={isOpen && !showCreateForm} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Email Template</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 mr-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">Loading templates...</div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(template)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="line-clamp-3 text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex justify-center p-8 text-muted-foreground">
              No templates found. Create a new template to get started.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showCreateForm && (
        <EmailTemplateForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateTemplate}
        />
      )}
    </>
  );
};

export default EmailTemplateSelector; 