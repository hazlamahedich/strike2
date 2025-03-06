import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmailTemplate, EmailTemplateCreate } from '../../types/email';
import RichTextEditor from './RichTextEditor';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Template name is required' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  content: z.string().min(1, { message: 'Template content is required' }),
});

interface EmailTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
  initialData?: Partial<EmailTemplateCreate>;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
}) => {
  const [content, setContent] = useState(initialData.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmailTemplateCreate>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name || '',
      subject: initialData.subject || '',
      content: initialData.content || '',
    },
  });

  const handleSubmit = async (data: EmailTemplateCreate) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would call your API to save the template
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a new template with a generated ID
      const newTemplate: EmailTemplate = {
        id: uuidv4(),
        name: data.name,
        subject: data.subject,
        content: data.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1', // In a real app, this would be the current user's ID
      };
      
      onSave(newTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    form.setValue('content', newContent, { shouldValidate: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData.name ? 'Edit' : 'Create'} Email Template</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Follow-up Email" {...field} />
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
              render={({ field: { value, onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Template Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={content}
                      onChange={handleContentChange}
                      placeholder="Write your email template here..."
                      className="min-h-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateForm; 